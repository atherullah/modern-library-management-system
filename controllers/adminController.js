const Book = require('../models/Book')
const BorrowHistory = require('../models/BorrowHistory')
const User = require('../models/User')
const { validationResult } = require('express-validator')
const path = require('path')
const fs = require('fs')
const { sendDueReminders } = require('../utils/reminderService')
const { logAction } = require('../utils/audit')
const { getBaseUrl } = require('../utils/baseUrl')

const genres = [
  'Art', 
  'Science Fiction', 
  'Fantasy',
  'Finance',
  'Biographies', 
  'Recipes', 
  'Romance', 
  'Children',
  'History',
  'Medicine',
  'Religion',
  'Mystery',
  'Music',
  'Science'
]

const removeImage = (filePath) => {
  try {
    const absPath = path.join(__dirname, '../', filePath)
    if (fs.existsSync(absPath)) {
      fs.unlink(absPath, err => {
        if(err) console.log('[removeImage] Error deleting file:', err.message)
      })
    }
  } catch(err) {
    console.log('[removeImage] Unexpected error:', err.message)
  }
}

exports.admin_dashboard = async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments()
    const totalUsers = await User.countDocuments()
    const totalBorrows = await BorrowHistory.countDocuments()
    const activeBorrows = await BorrowHistory.countDocuments({ status: 'In Progress' })

    // Borrowing trend — last 30 days grouped by date
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    const borrowTrend = await BorrowHistory.aggregate([
      { $match: { borrow_date: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$borrow_date' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Fill in missing days with 0
    const trendMap = {}
    borrowTrend.forEach(d => { trendMap[d._id] = d.count })
    const trendLabels = []
    const trendData = []
    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo)
      d.setDate(d.getDate() + i)
      const key = d.toISOString().slice(0, 10)
      trendLabels.push(key.slice(5)) // MM-DD
      trendData.push(trendMap[key] || 0)
    }

    // Top 5 most borrowed books
    const topBorrowedRaw = await BorrowHistory.aggregate([
      { $group: { _id: '$borrowed_book', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])
    const topBorrowed = await Book.populate(topBorrowedRaw, { path: '_id', select: 'title' })

    // Borrows by genre
    const allBorrows = await BorrowHistory.find().populate({ path: 'borrowed_book', select: 'categories' })
    const genreCount = {}
    allBorrows.forEach(b => {
      if (b.borrowed_book && b.borrowed_book.categories) {
        b.borrowed_book.categories.forEach(cat => {
          genreCount[cat] = (genreCount[cat] || 0) + 1
        })
      }
    })
    const genreLabels = Object.keys(genreCount)
    const genreData = Object.values(genreCount)

    res.render('admin/index', {
      msg: req.flash('msg'),
      stats: { totalBooks, totalUsers, totalBorrows, activeBorrows },
      trendLabels: JSON.stringify(trendLabels),
      trendData: JSON.stringify(trendData),
      topBorrowed,
      genreLabels: JSON.stringify(genreLabels),
      genreData: JSON.stringify(genreData),
    })
  } catch (err) {
    console.log(err)
    res.render('admin/index', {
      msg: req.flash('msg'),
      stats: { totalBooks: 0, totalUsers: 0, totalBorrows: 0, activeBorrows: 0 },
      trendLabels: '[]', trendData: '[]',
      topBorrowed: [],
      genreLabels: '[]', genreData: '[]',
    })
  }
}

exports.books = (req, res) => {
  let currentPage = req.params.page || 1
  let perPage = req.query.perPage || 10
  let totalBook
  let query = Book.find()

  if(req.query.search) {
    // query = query.regex('title', new RegExp(req.query.search, 'i'))
    query = Book.find( { $or: [{ title: { $regex: req.query.search, $options: 'i' } }, { isbn: { $regex: req.query.search, $options: 'i' }}] } )
  }

  query
    .countDocuments()
    .then(count => {
      totalBook = count
      // return Book.find().regex('title', new RegExp(req.query.search, 'i'))
      return Book.find({ $or: [{ title: { $regex: req.query.search || '', $options: 'i' } }, { isbn: { $regex: req.query.search || '', $options: 'i' }}] })
        .skip(parseInt(currentPage - 1) * parseInt(perPage))
        .limit(parseInt(perPage))
        .sort({ title: 1 })
    })
    .then(books => {
      res.render('admin/books', {
        books,
        searchOption: req.query,
        currentPage: parseInt(currentPage),
        perPage: parseInt(perPage),
        totalBook: parseInt(totalBook),
        totalPage: Math.ceil(parseInt(totalBook) / parseInt(perPage)),
        msg: req.flash('msg')
      })
    })
    .catch(err => {
      console.log(err)
      res.redirect('/admin')
    })
}

exports.add_book_view = (req, res) => {
  res.render('admin/book-add', { genres })
}

exports.add_book = (req, res) => {
  const { isbn, title, author, publish_year, page_count, categories, description, stock } = req.body
  const errors = validationResult(req)
  if(!errors.isEmpty()) {
    removeImage(req.files.cover_image[0].path)
    res.render('admin/book-add', { 
      genres,
      errors: errors.array(),
      isbn: isbn || '',
      title: title || '',
      author: author || '',
      publish_year: publish_year || '',
      page_count: page_count || '',
      description: description || '',
      stock: stock || ''
    })
  } else {
    const cover_image = req.files.cover_image[0].filename
    Book.create({ isbn, title, author, publish_year, page_count, categories, description, stock, cover_image })
      .then(result => {
        logAction(req.adminUser, 'ADD_BOOK', 'Book', result._id, `Added book: "${title}"`, req.ip)
        req.flash('msg', 'New book has been added!')
        res.redirect('/admin/book')
      })
      .catch(err => {
        console.log(err)
        res.redirect('/admin')
      })
  }
}

exports.detail_book = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
    
    const QRCode = require('qrcode')
    const bookUrl = `${getBaseUrl(req)}/book/${book._id}`
    const qrCodeDataUrl = await QRCode.toDataURL(bookUrl)

    res.render('admin/book-detail', { book, qrCodeDataUrl, msg: req.flash('msg') })
  } catch (err) {
    console.log(err)
    res.redirect('/admin/book')
  }
}

exports.update_book_view = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
    res.render('admin/book-update', { book, genres })
  } catch(err) {
    console.log(err)
    res.redirect('/admin')
  }
}

exports.update_book = async (req, res) => {
  const { isbn, title, author, publish_year, page_count, categories, description, stock } = req.body
  const errors = validationResult(req)
  if(!errors.isEmpty()) {
    try {
      if(req.files.cover_image) removeImage(req.files.cover_image[0].path)
      const book = await Book.findById(req.body.id)
      res.render('admin/book-update', {
        genres,
        errors: errors.array(),
        book,
      })
    } catch(err) {
      console.log(err)
      res.redirect('/admin')
    }
  } else {
    let cover_image
    if(req.files.cover_image) {
      Book.findById(req.body.id)
        .then(book => {
          removeImage(book.coverImagePath)
        })
        .catch(err => {
          console.log(err)
          res.redirect('/admin')
        })
      cover_image = req.files.cover_image[0].filename
    } else {
      try {
        const book = await Book.findById(req.body.id)
        cover_image = book.cover_image
      } catch (err) {
        console.log(err)
        res.redirect('/admin')
      }
    }
    Book.updateOne(
      { _id: req.body.id },
      { $set: {
          isbn, title, author, publish_year, page_count, categories, description, stock, cover_image
        }
      })
      .then(result => {
        logAction(req.adminUser, 'UPDATE_BOOK', 'Book', req.body.id, `Updated book: "${title}"`, req.ip)
        req.flash('msg', `Book has been updated!`)
        res.redirect(`/admin/book/detail/${req.body.id}`)
      })
      .catch(err => {
        console.log(err)
        res.redirect('/admin')
      })
  }
}

exports.delete_book = async (req, res) => {
  try {
    const book = await Book.findById(req.body.book_id)
    if (!book) {
      req.flash('msg', 'Book not found.')
      return res.redirect('/admin/book')
    }
    const bookTitle = book.title
    removeImage(book.coverImagePath)
    await book.remove()
    await logAction(req.adminUser, 'DELETE_BOOK', 'Book', req.body.book_id, `Deleted book: "${bookTitle}"`, req.ip)
    req.flash('msg', `Book '${bookTitle}' has been deleted!`)
    res.redirect(`/admin/book`)
  } catch(err) {
    console.log(err)
    res.redirect('/admin')
  }
}

exports.view_orders = async (req, res) => {
  try {
    let date = new Date()
    date.setDate(date.getDate() - 1)

    const updateStatus = await BorrowHistory.updateMany(
      { return_date: { $lte: date } },
      { $set: { status: "Returned" } }
    )

    BorrowHistory.find({ status: "Returned", book_returned: false })
      .then(returnedBook => {
        // console.log("returnedBook", returnedBook)
        returnedBook.forEach(async book => {
          // console.log("Book", book)
          await Book.updateMany(
            { _id: book.borrowed_book },
            { $inc: { stock: 1 } }
          )
        })
        return BorrowHistory.updateMany(
          { status: "Returned", book_returned: false }, 
          { $set: { book_returned: true } }
        )
      })
      .then(result => {
        return BorrowHistory.find()
          .populate({ path: 'borrowed_by', select: 'name' })
          .populate({ path: 'borrowed_book', select: 'title' })
          .sort({ created_at: -1 })
      })
      .then(borrowHistory => {
        res.render('admin/orders', { borrowHistory })
      })
      .catch(err => {
        console.log(err)
        res.redirect('/admin')
      })
  } catch(err) {
    console.log(err)
    res.redirect('/admin')
  }
}

exports.view_users = async (req, res) => {
  try {
    const users = await User.find()
    res.render('admin/view-users', { users })
  } catch(err) {
    console.log(err)
    res.redirect('/admin')
  }
}

exports.view_fines = async (req, res) => {
  try {
    const Settings = require('../models/Settings')
    const settings = await Settings.getGlobal()
    const fines = await BorrowHistory.find({ fine_amount: { $gt: 0 } })
      .populate({ path: 'borrowed_by', select: 'name email' })
      .populate({ path: 'borrowed_book', select: 'title' })
      .sort({ created_at: -1 })
    const totalUnpaid = fines
      .filter(f => !f.fine_paid)
      .reduce((sum, f) => sum + f.fine_amount, 0)
    res.render('admin/fines', { fines, totalUnpaid: totalUnpaid.toFixed(2), settings, msg: req.flash('msg') })
  } catch (err) {
    console.log(err)
    res.redirect('/admin')
  }
}

exports.mark_fine_paid = async (req, res) => {
  try {
    await BorrowHistory.updateOne({ _id: req.body.history_id }, { $set: { fine_paid: true } })
    await logAction(req.adminUser, 'MARK_FINE_PAID', 'BorrowHistory', req.body.history_id, 'Marked fine as paid', req.ip)
    req.flash('msg', 'Fine marked as paid.')
  } catch (err) {
    console.log(err)
    req.flash('msg', 'Failed to update fine.')
  }
  res.redirect('/admin/fines')
}

exports.view_reports = async (req, res) => {
  try {
    const Settings = require('../models/Settings')
    const settings = await Settings.getGlobal()
    const { status, from, to, user_name } = req.query

    const filter = {}
    if (status) filter.status = status
    if (from || to) {
      filter.borrow_date = {}
      if (from) filter.borrow_date.$gte = new Date(from)
      if (to) {
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        filter.borrow_date.$lte = toDate
      }
    }

    let records = await BorrowHistory.find(filter)
      .populate({ path: 'borrowed_by', select: 'name email' })
      .populate({ path: 'borrowed_book', select: 'title isbn' })
      .sort({ borrow_date: -1 })
      .limit(500)

    // Filter by user name (post-populate)
    if (user_name) {
      records = records.filter(r =>
        r.borrowed_by && r.borrowed_by.name.toLowerCase().includes(user_name.toLowerCase())
      )
    }

    const totalFines = records.reduce((sum, r) => sum + (r.fine_amount || 0), 0)
    const unpaidFines = records.filter(r => r.fine_amount > 0 && !r.fine_paid).reduce((sum, r) => sum + r.fine_amount, 0)

    res.render('admin/reports', {
      records,
      query: req.query,
      totalFines: totalFines.toFixed(2),
      unpaidFines: unpaidFines.toFixed(2),
      settings,
      msg: req.flash('msg')
    })
  } catch (err) {
    console.log(err)
    res.redirect('/admin')
  }
}

exports.export_csv = async (req, res) => {
  try {
    const Settings = require('../models/Settings')
    const settings = await Settings.getGlobal()
    const { status, from, to, user_name } = req.query

    const filter = {}
    if (status) filter.status = status
    if (from || to) {
      filter.borrow_date = {}
      if (from) filter.borrow_date.$gte = new Date(from)
      if (to) {
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        filter.borrow_date.$lte = toDate
      }
    }

    let records = await BorrowHistory.find(filter)
      .populate({ path: 'borrowed_by', select: 'name email' })
      .populate({ path: 'borrowed_book', select: 'title isbn' })
      .sort({ borrow_date: -1 })

    if (user_name) {
      records = records.filter(r =>
        r.borrowed_by && r.borrowed_by.name.toLowerCase().includes(user_name.toLowerCase())
      )
    }

    const escape = (val) => {
      if (val === null || val === undefined) return ''
      const str = String(val)
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str
    }

    const headers = ['User Name', 'User Email', 'Book Title', 'ISBN', 'Borrow Date', 'Due Date', 'Actual Return Date', 'Status', `Fine (${settings.currency_name})`, 'Fine Paid']
    const rows = records.map(r => [
      escape(r.borrowed_by?.name),
      escape(r.borrowed_by?.email),
      escape(r.borrowed_book?.title),
      escape(r.borrowed_book?.isbn),
      escape(r.borrow_date ? new Date(r.borrow_date).toLocaleDateString() : ''),
      escape(r.return_date ? new Date(r.return_date).toLocaleDateString() : ''),
      escape(r.actual_return_date ? new Date(r.actual_return_date).toLocaleDateString() : 'Not returned'),
      escape(r.status),
      escape(r.fine_amount ? r.fine_amount.toFixed(2) : '0.00'),
      escape(r.fine_paid ? 'Yes' : 'No'),
    ].join(','))

    const csv = [headers.join(','), ...rows].join('\n')
    const filename = `borrow-report-${new Date().toISOString().slice(0, 10)}.csv`

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(csv)
  } catch (err) {
    console.log(err)
    res.redirect('/admin/reports')
  }
}

exports.view_audit_logs = async (req, res) => {
  try {
    const { action, admin, from, to } = req.query
    const filter = {}
    if (action) filter.action = action
    if (admin) filter.admin_name = { $regex: admin, $options: 'i' }
    if (from || to) {
      filter.created_at = {}
      if (from) filter.created_at.$gte = new Date(from)
      if (to) {
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        filter.created_at.$lte = toDate
      }
    }

    const AuditLog = require('../models/AuditLog')
    const logs = await AuditLog.find(filter).sort({ created_at: -1 }).limit(200)
    const actions = await AuditLog.distinct('action')

    res.render('admin/audit-logs', { logs, actions, query: req.query, msg: req.flash('msg') })
  } catch (err) {
    console.log(err)
    res.redirect('/admin')
  }
}

exports.view_settings = async (req, res) => {
  try {
    const Settings = require('../models/Settings')
    const settings = await Settings.getGlobal()
    res.render('admin/settings', { settings, msg: req.flash('msg') })
  } catch (err) {
    console.log(err)
    res.redirect('/admin')
  }
}

exports.update_settings = async (req, res) => {
  try {
    const Settings = require('../models/Settings')
    const { fine_per_day, currency_symbol, currency_name } = req.body
    await Settings.findOneAndUpdate(
      { key: 'global' },
      { fine_per_day: parseFloat(fine_per_day) || 1.00, currency_symbol: currency_symbol || '$', currency_name: currency_name || 'USD' },
      { upsert: true }
    )
    await logAction(req.adminUser, 'UPDATE_SETTINGS', 'Settings', 'global', `Updated settings: fine=${fine_per_day} ${currency_symbol} ${currency_name}`, req.ip)
    req.flash('msg', 'Settings updated successfully.')
  } catch (err) {
    console.log(err)
    req.flash('msg', 'Failed to update settings.')
  }
  res.redirect('/admin/settings')
}

exports.send_reminders = async (req, res) => {
  try {
    const { sent, failed } = await sendDueReminders()
    req.flash('msg', `Reminders sent: ${sent} succeeded, ${failed} failed.`)
  } catch (err) {
    console.error('[AdminController] send_reminders error:', err.message)
    req.flash('msg', `Failed to send reminders: ${err.message}`)
  }
  res.redirect('/admin')
}

exports.import_books = async (req, res) => {
  const fs = require('fs')
  const { parseBookFile } = require('../utils/bookImport')
  let filePath
  try {
    if (!req.files || !req.files.csv_file) {
      req.flash('msg', 'Please upload a CSV or Excel (.xlsx) file.')
      return res.redirect('/admin/book')
    }
    filePath = req.files.csv_file[0].path
    const originalName = req.files.csv_file[0].originalname

    // Continue the synthetic-ISBN sequence past any previously imported batch so
    // re-importing never collides on the unique isbn index.
    const existing = await Book.find({ isbn: /^CSIT-\d+$/ }).select('isbn').lean()
    let isbnStart = 1
    for (const b of existing) {
      const n = parseInt(b.isbn.split('-')[1], 10)
      if (Number.isFinite(n) && n >= isbnStart) isbnStart = n + 1
    }

    const { books, skipped } = parseBookFile(filePath, { defaultStock: 1, isbnStart })

    if (!books.length) {
      req.flash('msg', 'No valid book rows were found in the uploaded file.')
      return res.redirect('/admin/book')
    }

    // ordered:false → a row that clashes with an existing isbn is skipped while
    // the rest still insert, instead of aborting the whole import.
    let inserted = 0
    try {
      const docs = await Book.insertMany(books, { ordered: false })
      inserted = docs.length
    } catch (err) {
      inserted = (err.insertedDocs && err.insertedDocs.length) || (err.result && err.result.nInserted) || 0
    }
    const failed = books.length - inserted

    await logAction(req.adminUser, 'IMPORT_BOOKS', 'Book', null, `Imported ${inserted} books from ${originalName}`, req.ip)

    let msg = `${inserted} book(s) imported successfully.`
    if (skipped) msg += ` ${skipped} duplicate row(s) skipped.`
    if (failed) msg += ` ${failed} row(s) failed (likely already in the catalogue).`
    req.flash('msg', msg)
    res.redirect('/admin/book')
  } catch (err) {
    console.error('[AdminController] import_books error:', err)
    req.flash('msg', `An error occurred during import: ${err.message}`)
    res.redirect('/admin/book')
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath) } catch (_) { /* best effort cleanup */ }
    }
  }
}