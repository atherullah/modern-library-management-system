const Book = require('../models/Book')
const User = require('../models/User')
const Cart = require('../models/Cart')
const Review = require('../models/Review')
const BorrowHistory = require('../models/BorrowHistory')
const { validationResult } = require('express-validator')
const path = require('path')
const fs = require('fs')

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

// ── Catalog search/filter helpers ───────────────────────────────────────────

// Average rating + review count for a set of books → { '<bookId>': { avg, count } }
const getRatingsMap = async (bookIds) => {
  if (!bookIds || bookIds.length === 0) return {}
  const agg = await Review.aggregate([
    { $match: { book: { $in: bookIds } } },
    { $group: { _id: '$book', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ])
  const map = {}
  agg.forEach(r => { map[r._id.toString()] = { avg: Math.round(r.avg * 10) / 10, count: r.count } })
  return map
}

// Build a Mongo filter from query params: q (title/author/isbn), genre, availability.
const buildBookFilter = ({ q, genre, availability }) => {
  const filter = {}
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape regex metachars
    const rx = { $regex: safe, $options: 'i' }
    filter.$or = [{ title: rx }, { author: rx }, { isbn: rx }]
  }
  if (genre) filter.categories = genre
  if (availability === 'in') filter.stock = { $gt: 0 }
  return filter
}

const BOOK_SORTS = {
  title_asc: { title: 1 },
  title_desc: { title: -1 },
  newest: { created_at: -1 },
  oldest: { created_at: 1 }
}

// Query books with filter + sort (incl. "rating") + optional pagination.
// Returns Mongoose docs (preserves `.id` / `coverImagePath` virtuals the views rely on).
const queryBooks = async ({ filter = {}, sort = 'title_asc', page = 1, perPage = null }) => {
  if (sort === 'rating') {
    // Rating isn't a stored field — rank via aggregation, then re-fetch docs in order.
    const ranked = await Book.aggregate([
      { $match: filter },
      { $lookup: { from: 'reviews', localField: '_id', foreignField: 'book', as: 'r' } },
      { $addFields: {
          avgRating: { $cond: [{ $gt: [{ $size: '$r' }, 0] }, { $avg: '$r.rating' }, 0] },
          reviewCount: { $size: '$r' }
      } },
      { $sort: { avgRating: -1, reviewCount: -1, title: 1 } },
      { $project: { _id: 1 } }
    ])
    const ids = ranked.map(r => r._id)
    const total = ids.length
    const pageIds = perPage ? ids.slice((page - 1) * perPage, page * perPage) : ids
    const docs = await Book.find({ _id: { $in: pageIds } })
    const byId = {}
    docs.forEach(d => { byId[d.id] = d })
    const books = pageIds.map(id => byId[id.toString()]).filter(Boolean)
    return { books, total }
  }
  const total = await Book.countDocuments(filter)
  let q = Book.find(filter).sort(BOOK_SORTS[sort] || BOOK_SORTS.title_asc)
  if (perPage) q = q.skip((page - 1) * perPage).limit(perPage)
  const books = await q
  return { books, total }
}

const removeImage = (filePath) => {
  try {
    filePath = path.join(__dirname, '../', filePath)
    fs.unlink(filePath, err => {
      if(err) throw err
    })
  } catch(err) {
    console.log(err)
    res.redirect('/profile')
  }
}

exports.home = async (req, res) => {
  try {
    // for popular books — normalize to { book, count } and drop any deleted books
    const sortBorrowedBooksByCount = await BorrowHistory.aggregate([
      { $sortByCount: "$borrowed_book" }
    ]).limit(10)
    const populated = await Book.populate(sortBorrowedBooksByCount, { path: '_id' })
    const popularBooks = populated
      .filter(p => p._id)
      .map(p => ({ book: p._id, count: p.count }))

    // for recently added books
    const recentBooks = await Book.find().sort({ created_at: -1 }).limit(12)

    // ratings for every card on the page
    const ids = [...popularBooks.map(p => p.book._id), ...recentBooks.map(b => b._id)]
    const ratings = await getRatingsMap(ids)

    res.render('index', { popularBooks, recentBooks, ratings, msg: req.flash('msg') })
  } catch(err) {
    console.log(err)
    res.redirect('/')
  }
}

exports.allBooks = async (req, res) => {
  try {
    const currentPage = parseInt(req.params.page) || 1
    const perPage = parseInt(req.query.perPage) || 12
    const q = (req.query.q || '').trim()
    const genre = req.query.genre || ''
    const availability = req.query.availability || ''
    const sort = req.query.sort || 'title_asc'

    const filter = buildBookFilter({ q, genre, availability })
    const { books, total } = await queryBooks({ filter, sort, page: currentPage, perPage })
    const ratings = await getRatingsMap(books.map(b => b._id))

    // Preserve active filters across pagination links.
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (genre) params.set('genre', genre)
    if (availability) params.set('availability', availability)
    if (sort && sort !== 'title_asc') params.set('sort', sort)
    const filterQuery = params.toString() ? `?${params.toString()}` : ''

    res.render('customer/books', {
      books,
      ratings,
      q, genre, availability, sort, filterQuery,
      msg: req.flash('msg'),
      currentPage,
      perPage,
      totalBook: total,
      totalPage: Math.ceil(total / perPage),
    })
  } catch (err) {
    console.log(err)
    res.redirect('/')
  }
}

exports.searchBook = async (req, res) => {
  try {
    const q = (req.query.q || req.query.title || '').trim() // accept legacy ?title=
    const genre = req.query.genre || ''
    const availability = req.query.availability || ''
    const sort = req.query.sort || (q ? 'relevance' : 'title_asc')
    const sortKey = sort === 'relevance' ? 'title_asc' : sort

    const filter = buildBookFilter({ q, genre, availability })
    const { books } = await queryBooks({ filter, sort: sortKey })
    const ratings = await getRatingsMap(books.map(b => b._id))

    res.render('customer/search-book', {
      books,
      ratings,
      q, genre, availability, sort,
      resultCount: books.length,
      msg: req.flash('msg'),
    })
  } catch (err) {
    console.log(err)
    res.redirect('/')
  }
}

// JSON endpoint for navbar type-ahead suggestions.
exports.searchSuggest = async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    if (q.length < 2) return res.json([])
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const rx = { $regex: safe, $options: 'i' }
    const books = await Book.find({ $or: [{ title: rx }, { author: rx }, { isbn: rx }] })
      .select('title author cover_image')
      .sort({ title: 1 })
      .limit(8)
    res.json(books.map(b => ({ id: b.id, title: b.title, author: b.author, cover: b.coverImagePath })))
  } catch (err) {
    res.json([])
  }
}

exports.booksByGenre = async  (req, res) => {
  try {
    const { genre } = req.params
    const genreId = genre.split('genre-').pop()
    if(genreId > genres.length || genreId < 1) {  // if user change the params from the url
      res.redirect('/')
    } else {
      const genreName = genres[genreId - 1]
      const books = await Book.find({ categories: genreName })
      res.render('customer/books-genre', { books, genreName, genreParam: genre, msg: req.flash('msg') })
    }
  } catch(err) {
    console.log(err)
    res.redirect('/')
  }
}

exports.userProfile = async (req, res) => {
  try {
    const userId = res.locals.user.id
    const Reservation = require('../models/Reservation')
    const Wishlist = require('../models/Wishlist')

    let [reservations, currentLoans, allHistory, reviewCount, wishlistCount] = await Promise.all([
      Reservation.find({ user: userId }).populate('book', 'title cover_image').sort({ createdAt: -1 }),
      BorrowHistory.find({ borrowed_by: userId, status: 'In Progress' }).populate('borrowed_book').sort({ return_date: 1 }),
      BorrowHistory.find({ borrowed_by: userId }),
      Review.countDocuments({ user: userId }),
      Wishlist.countDocuments({ user: userId }),
    ])

    // Skip records whose book no longer exists (e.g. deleted/reseeded)
    reservations = reservations.filter(r => r.book)
    currentLoans = currentLoans.filter(h => h.borrowed_book)

    const returnedCount = allHistory.filter(h => h.status === 'Returned').length
    const outstandingFines = allHistory
      .filter(h => !h.fine_paid && h.fine_amount > 0)
      .reduce((sum, h) => sum + h.fine_amount, 0)

    res.render('customer/profile', {
      reservations,
      currentLoans,
      stats: {
        currentCount: currentLoans.length,
        totalBorrowed: allHistory.length,
        returnedCount,
        reviewCount,
        wishlistCount,
      },
      outstandingFines: parseFloat(outstandingFines.toFixed(2)),
      msg: req.flash('msg'),
    })
  } catch (err) {
    console.log(err)
    res.redirect('/')
  }
}

exports.editProfile = (req, res) => {
  res.render('customer/profile-edit')
}

exports.updateProfile = async (req, res) => {
  const { name, email } = req.body
  const errors = validationResult(req)
  if(!errors.isEmpty()) {
    try {
      if(req.files.profile_picture) removeImage(req.files.profile_picture[0].path)
      const user = await User.findById(req.body.id)
      res.render('customer/profile-edit', {
        errors: errors.array(),
        user,
      })
    } catch(err) {
      console.log(err)
      res.redirect('/')
    }
  } else {
    let profile_picture
    if(req.files.profile_picture) {
      User.findById(req.body.id)
        .then(user => {
          if(user.profile_picture !== 'default_user.svg') {
            removeImage(user.profilePicturePath)
          }
        })
        .catch(err => {
          console.log(err)
          res.redirect('/')
        })
      profile_picture = req.files.profile_picture[0].filename
    } else {
      try {
        const user = await User.findById(req.body.id)
        profile_picture = user.profile_picture
      } catch (err) {
        console.log(err)
        res.redirect('/')
      }
    }
    User.updateOne(
      { _id: req.body.id },
      { $set: { name, email, profile_picture } }
    )
      .then(result => {
        req.flash('msg', `Profile has been updated!`)
        res.redirect(`/profile`)
      })
      .catch(err => {
        console.log(err)
        res.redirect('/')
      })
  }
}

exports.cart = async (req, res) => {
  try {
    // Only the current user's items (was fetching every user's cart and filtering in the view)
    const cartItems = await Cart.find({ user: res.locals.user.id }).populate('book')
    const outOfStock = cartItems.some(item => !item.book || item.book.stock === 0)
    res.render('customer/cart', { cartItems, outOfStock, msg: req.flash('msg') })
  } catch (err) {
    console.log(err)
    res.redirect('/')
  }
}

exports.postToCart = async (req, res) => {
  const { user_id, book_id, prev_url } = req.body

  // Respond as JSON for AJAX callers (instant toast + badge), otherwise fall
  // back to the classic flash-message + redirect for no-JS clients.
  const respond = async (message, type = 'info') => {
    if (req.xhr) {
      const itemCount = await Cart.countDocuments({ user: user_id })
      return res.json({ ok: type === 'success', msg: message, type, itemCount })
    }
    req.flash('msg', message)
    res.redirect(prev_url || '/')
  }

  try {
    const inInventory = await BorrowHistory.find({
      borrowed_by: user_id,
      borrowed_book: book_id,
      status: "In Progress"
    })
    const existing = await Cart.find({ user: user_id, book: book_id })

    if (inInventory.length !== 0) {
      return respond('That book is already in your inventory...', 'info')
    }
    if (existing.length !== 0) {
      return respond('That book is already in your cart...', 'info')
    }
    await Cart.create({ user: user_id, book: book_id })
    return respond('Book has been added to your cart!', 'success')
  } catch(err) {
    console.log(err)
    if (req.xhr) return res.status(500).json({ ok: false, msg: 'Something went wrong.', type: 'danger' })
    res.redirect('/')
  }
}

exports.deleteCartItem = async (req, res) => {
  try {
    const cartItem = await Cart.findById(req.body.item_id).populate({ path: 'book', select: 'title' })
    const bookTitle = cartItem.book.title
    await cartItem.remove()
    req.flash('msg', `Book '${bookTitle}' has been removed from your cart!`)
    res.redirect('/cart')
  } catch(err) {
    console.log(err)
    res.redirect('/')
  }
}

exports.getBorrow = async (req, res) => {
  try {
    const cartItems = await Cart.find({ user: res.locals.user.id }).populate('book')
    res.render('customer/borrow', { cartItems })
  } catch (err) {
    console.log(err)
    res.redirect('/')
  }
}

exports.postBorrow = async (req, res) => {
  const { user_id, borrowDate, returnDate } = req.body
  const errors = validationResult(req)
  if(!errors.isEmpty()) {
    try {
      const user = await User.findById(user_id)
      const cart = await Cart.find({ user: user_id }).populate('book')
      res.render('customer/borrow', {
        errors: errors.array(),
        user,
        cartItems: cart
      })
    } catch(err) {
      console.log(err)
      res.redirect('/')
    }
  } else {
    try {
      const cartItems = await Cart.find({ user: user_id })
      cartItems.forEach(async (item) => {
        const borrow = await BorrowHistory.create({
          borrowed_by: user_id,
          borrowed_book: item.book,
          borrow_date: new Date(borrowDate),
          return_date: new Date(returnDate)
        })
        const book = await Book.updateMany(
          { _id: item.book },
          { $inc: { stock: -1 } }
        )
        const cart = await Cart.find({ user: user_id }).deleteMany()
        req.flash('msg', "Book successfully borrowed!")
        return res.redirect(`/inventory/${user_id}`)
      })
    } catch(err) {
      console.log(err)
      res.redirect('/')
    }
  }
}

exports.borrowedBooks = async (req, res) => {
  try {
    let date = new Date()
    date.setDate(date.getDate() - 1)  // decrement by 1 day so the borrowed books still appear at the return date.

    await BorrowHistory.updateMany(
      { return_date: { $lte: date }, borrowed_by: req.params.id },
      { $set: { status: "Returned" } }
    )

    BorrowHistory.find({ status: "Returned", book_returned: false })
      .then(returnedBook => {
        returnedBook.forEach(async book => {
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
        return BorrowHistory.find({
          borrowed_by: req.params.id,
          status: "In Progress"
        }).populate('borrowed_book')
      })
      .then(borrowedBook => {
        // Skip records whose book no longer exists (e.g. deleted/reseeded)
        borrowedBook = borrowedBook.filter(h => h.borrowed_book)
        res.render('customer/inventory', { url: req.params.id, borrowedBook, msg: req.flash('msg') })
      })
      .catch(err => {
        console.log(err)
        res.redirect('/')
      })
  } catch(err) {
    console.log(err)
    res.redirect('/')
  }
}

exports.readBook = (req, res) => {
  res.send('read book')
}

exports.returnBook = async (req, res) => {
  const { user_id, book_id, history_id } = req.body

  try {
    const Settings = require('../models/Settings')
    const settings = await Settings.getGlobal()

    const history = await BorrowHistory.findById(history_id)
    const now = new Date()
    const dueDate = new Date(history.return_date)
    const diffMs = now - dueDate
    const daysLate = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0
    const fine = parseFloat((daysLate * settings.fine_per_day).toFixed(2))

    await BorrowHistory.updateOne(
      { _id: history_id },
      { $set: { status: "Returned", book_returned: true, actual_return_date: now, fine_amount: fine } }
    )

    await Book.updateMany(
      { _id: book_id },
      { $inc: { stock: 1 } }
    )

    if (fine > 0) {
      req.flash('msg', `Book returned! You have a late fine of ${settings.currency_symbol}${fine.toFixed(2)} ${settings.currency_name}. Please pay at the library desk.`)
    } else {
      req.flash('msg', "You just returned a book! Thank you and happy reading!")
    }
    res.redirect(`/inventory/${user_id}`)
  } catch(err) {
    console.log(err)
    res.redirect('/')
  }
}

exports.borrowHistory = async (req, res) => {
  try {
    const borrowHistory = (await BorrowHistory.find({ borrowed_by: req.params.id })
      .populate('borrowed_book')
      .sort({ borrow_date: -1 }))
      .filter(h => h.borrowed_book) // skip records whose book no longer exists

    res.render('customer/borrow-history', { url: req.params.id, borrowHistory, msg: req.flash('msg') })
  } catch(err) {
    console.log(err)
    res.redirect('/')
  }
}

exports.bookDetail = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
    if (!book) return res.redirect('/')

    const reviews = await Review.find({ book: book._id }).populate('user', 'name profile_picture').sort({ createdAt: -1 })

    let averageRating = 0
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, current) => acc + current.rating, 0)
      averageRating = (sum / reviews.length).toFixed(1)
    }

    // ── Recommendations ──
    // More by this author
    const moreByAuthor = await Book.find({ author: book.author, _id: { $ne: book._id } }).limit(6)

    // "Readers also enjoyed": co-borrow ranking, falling back to same-genre books.
    let alsoBorrowed = []
    const borrowers = await BorrowHistory.distinct('borrowed_by', { borrowed_book: book._id })
    if (borrowers.length) {
      const coAgg = await BorrowHistory.aggregate([
        { $match: { borrowed_by: { $in: borrowers }, borrowed_book: { $ne: book._id } } },
        { $group: { _id: '$borrowed_book', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 }
      ])
      const ids = coAgg.map(c => c._id)
      const docs = await Book.find({ _id: { $in: ids } })
      const byId = {}
      docs.forEach(d => { byId[d.id] = d })
      alsoBorrowed = ids.map(id => byId[id.toString()]).filter(Boolean)
    }
    if (!alsoBorrowed.length && book.categories && book.categories.length) {
      alsoBorrowed = await Book.find({ categories: { $in: book.categories }, _id: { $ne: book._id } }).limit(6)
    }

    const recRatings = await getRatingsMap([
      ...moreByAuthor.map(b => b._id),
      ...alsoBorrowed.map(b => b._id)
    ])

    res.render('customer/book', { book, reviews, averageRating, moreByAuthor, alsoBorrowed, recRatings, msg: req.flash('msg') })
  } catch (err) {
    console.log(err)
    res.redirect('/')
  }
}

exports.addReview = async (req, res) => {
  try {
    const { rating, comment, user_id } = req.body
    const book_id = req.params.id

    if (!user_id) {
       req.flash('msg', 'You must be logged in to leave a review.')
       return res.redirect(`/book/${book_id}`)
    }

    const Review = require('../models/Review')
    
    // Check if user already reviewed
    const existingReview = await Review.findOne({ user: user_id, book: book_id })
    if (existingReview) {
       req.flash('msg', 'You have already reviewed this book.')
       return res.redirect(`/book/${book_id}`)
    }

    await Review.create({
      user: user_id,
      book: book_id,
      rating: parseInt(rating),
      comment
    })

    req.flash('msg', 'Review submitted successfully!')
    res.redirect(`/book/${book_id}`)
  } catch (err) {
    console.log(err)
    req.flash('msg', 'An error occurred while submitting your review.')
    res.redirect(`/book/${req.params.id}`)
  }
}

exports.reserveBook = async (req, res) => {
  try {
    const user_id = req.body.user_id
    if (!user_id) {
       req.flash('msg', 'You must be logged in to reserve a book.')
       return res.redirect(`/book/${req.params.id}`)
    }

    const Reservation = require('../models/Reservation')
    
    // Check if user already has an active reservation
    const existingRev = await Reservation.findOne({ user: user_id, book: req.params.id, status: 'Pending' })
    if (existingRev) {
       req.flash('msg', 'You already have a pending reservation for this book.')
       return res.redirect(`/book/${req.params.id}`)
    }

    await Reservation.create({ user: user_id, book: req.params.id })

    req.flash('msg', 'Book reserved successfully! You will be notified when it is available.')
    res.redirect(`/book/${req.params.id}`)
  } catch (err) {
    console.log(err)
    req.flash('msg', 'Failed to reserve the book.')
    res.redirect(`/book/${req.params.id}`)
  }
}

// ── Chatbot ───────────────────────────────────────────────────────────────────

exports.chat = async (req, res) => {
  try {
    const { getChatResponse } = require('../utils/chatbot')
    const { message, history } = req.body
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }
    const reply = await getChatResponse(message.trim(), history || [])
    res.json({ reply })
  } catch (err) {
    console.error('[Chatbot]', err.message)
    res.status(500).json({ error: 'Sorry, I could not process your request right now.' })
  }
}

exports.getWishlist = async (req, res) => {
  try {
    const Wishlist = require('../models/Wishlist')
    const items = (await Wishlist.find({ user: res.locals.user.id })
      .populate('book')
      .sort({ created_at: -1 }))
      .filter(item => item.book) // skip records whose book no longer exists
    res.render('customer/wishlist', { items, msg: req.flash('msg') })
  } catch (err) {
    console.log(err)
    res.redirect('/')
  }
}

exports.addToWishlist = async (req, res) => {
  const { user_id, book_id, prev_url } = req.body
  const Wishlist = require('../models/Wishlist')

  const respond = async (message, type = 'info') => {
    if (req.xhr) {
      const wishlistCount = await Wishlist.countDocuments({ user: user_id })
      return res.json({ ok: type === 'success', msg: message, type, wishlistCount })
    }
    req.flash('msg', message)
    res.redirect(prev_url || '/wishlist')
  }

  try {
    const existing = await Wishlist.findOne({ user: user_id, book: book_id })
    if (existing) {
      return respond('That book is already in your wishlist.', 'info')
    }
    await Wishlist.create({ user: user_id, book: book_id })
    return respond('Book added to your wishlist!', 'success')
  } catch (err) {
    console.log(err)
    if (req.xhr) return res.status(500).json({ ok: false, msg: 'Could not add book to wishlist.', type: 'danger' })
    req.flash('msg', 'Could not add book to wishlist.')
    res.redirect(prev_url || '/wishlist')
  }
}

exports.removeFromWishlist = async (req, res) => {
  try {
    const Wishlist = require('../models/Wishlist')
    const item = await Wishlist.findById(req.body.item_id).populate({ path: 'book', select: 'title' })
    if (!item) {
      req.flash('msg', 'Wishlist item not found.')
      return res.redirect('/wishlist')
    }
    const bookTitle = item.book.title
    await item.remove()
    req.flash('msg', `'${bookTitle}' removed from your wishlist.`)
    res.redirect('/wishlist')
  } catch (err) {
    console.log(err)
    res.redirect('/wishlist')
  }
}
