const XLSX = require('xlsx')

// Maps a logical Book field to the header text(s) we expect to find for it.
// Order matters only within a field; the first matching column wins.
const FIELD_PATTERNS = {
  title: /title/i,
  author: /author|writer/i,
  publish_year: /year|publish/i,
  isbn: /isbn/i,
  price: /price|cost|amount/i,
  stock: /stock|qty|quantity|copies|available/i,
  categories: /categor|genre|subject/i,
  description: /description|\bdesc\b|summary|detail/i,
  page_count: /page/i,
}

// A real header row is one that names at least a title AND an author column.
// This lets us skip branding/title banner rows that real-world book lists put
// at the top of the sheet (e.g. shop name, address, contact).
function detectHeaderRow(rows) {
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].map((c) => (c == null ? '' : String(c)))
    const hasTitle = cells.some((c) => FIELD_PATTERNS.title.test(c))
    const hasAuthor = cells.some((c) => FIELD_PATTERNS.author.test(c))
    if (hasTitle && hasAuthor) return i
  }
  return -1
}

function buildColumnMap(headerRow) {
  const map = {}
  headerRow.forEach((cell, idx) => {
    const text = cell == null ? '' : String(cell)
    for (const [field, re] of Object.entries(FIELD_PATTERNS)) {
      if (map[field] === undefined && re.test(text)) map[field] = idx
    }
  })
  return map
}

/**
 * Parse a book list from an .xlsx, .xls or .csv file into Book-ready documents.
 *
 * Required Book fields that the source omits are filled with safe defaults so
 * the documents pass schema validation:
 *   - isbn: synthetic, unique "<prefix>-NNNN" (when no ISBN column is present)
 *   - description: generated from title/author/year (+ price if available)
 *   - categories: opts.defaultCategories
 *   - stock: opts.defaultStock
 *   - page_count: 0
 *   - cover_image: opts.coverImage
 *
 * @returns {{ books: object[], skipped: number, format: string }}
 */
function parseBookFile(filePath, opts = {}) {
  const {
    defaultStock = 1,
    defaultCategories = ['Computer Science'],
    isbnPrefix = 'CSIT',
    isbnStart = 1,
    coverImage = 'default_cover.jpg',
  } = opts

  const wb = XLSX.readFile(filePath, { raw: true })
  const books = []
  let skipped = 0
  let isbnSeq = isbnStart
  const seenIsbn = new Set()

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      blankrows: false,
      defval: null,
      raw: true,
    })
    if (!rows.length) continue

    const headerIdx = detectHeaderRow(rows)
    if (headerIdx === -1) continue

    const col = buildColumnMap(rows[headerIdx])
    if (col.title === undefined) continue

    for (let r = headerIdx + 1; r < rows.length; r++) {
      const row = rows[r]
      const cell = (field) => (col[field] !== undefined ? row[col[field]] : undefined)

      const title = cell('title') == null ? '' : String(cell('title')).trim()
      if (!title) continue // blank line / section separator — not an error

      const author =
        (cell('author') != null && String(cell('author')).trim()) || 'Unknown'

      let year = cell('publish_year') == null ? '' : String(cell('publish_year')).trim()
      if (!/^\d{3,4}$/.test(year)) year = '2000'

      // ISBN: use the file's value if present, otherwise mint a unique one.
      let isbn = cell('isbn') == null ? '' : String(cell('isbn')).trim()
      if (!isbn) {
        isbn = `${isbnPrefix}-${String(isbnSeq).padStart(4, '0')}`
        isbnSeq++
      }
      if (seenIsbn.has(isbn)) {
        skipped++ // duplicate ISBN within the same file
        continue
      }
      seenIsbn.add(isbn)

      // Price is not a Book field; capture it best-effort to enrich the
      // description. Many lists split it into a currency cell + a number cell.
      let priceStr = ''
      if (col.price !== undefined) {
        const p = row[col.price]
        const next = row[col.price + 1]
        if (typeof p === 'string' && typeof next === 'number') priceStr = `${p.trim()}${next}`
        else if (p != null) priceStr = String(p).trim()
      }

      let description = cell('description') == null ? '' : String(cell('description')).trim()
      if (!description) {
        description = `${title} by ${author} (${year}).`
        if (priceStr) description += ` Price: ${priceStr}.`
      }

      let categories = cell('categories')
      if (categories != null && String(categories).trim()) {
        categories = String(categories)
          .split('|')
          .map((c) => c.trim())
          .filter(Boolean)
      } else {
        categories = [...defaultCategories]
      }

      let pageCount = parseInt(cell('page_count'), 10)
      if (!Number.isFinite(pageCount) || pageCount < 0) pageCount = 0

      let stock = parseInt(cell('stock'), 10)
      if (!Number.isFinite(stock) || stock < 0) stock = defaultStock

      const cover = (cell('cover_image') != null && String(cell('cover_image')).trim()) || coverImage

      books.push({
        isbn,
        title,
        author,
        publish_year: year,
        page_count: pageCount,
        categories,
        description,
        stock,
        cover_image: cover,
      })
    }
  }

  return { books, skipped, format: 'sheet' }
}

module.exports = { parseBookFile }
