const Book = require('../models/Book')
const User = require('../models/User')
const Cart = require('../models/Cart')
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
    // for popular books
    const sortBorrowedBooksByCount = await BorrowHistory.aggregate([
      { $sortByCount: "$borrowed_book" }
    ]).limit(10)
    const popularBooks = await Book.populate(sortBorrowedBooksByCount, { path: '_id' })

    // for recently added books
    const recentBooks = await Book.find().sort({ created_at: -1 }).limit(12)

    res.render('index', { popularBooks, recentBooks, msg: req.flash('msg') })
  } catch(err) {
    console.log(err)
    res.redirect('/')
  }
}

exports.allBooks = (req, res) => {
  let currentPage = req.params.page || 1
  let perPage = req.query.perPage || 12
  let totalBook

  Book.find()
    .countDocuments()
    .then(count => {
      totalBook = count
      return Book.find()
        .skip(parseInt(currentPage - 1) * parseInt(perPage))
        .limit(parseInt(perPage))
        .sort({ title: 1 })
    })
    .then(books => {
      res.render('customer/books', {
        books,
        msg: req.flash('msg'),
        currentPage: parseInt(currentPage),
        perPage: parseInt(perPage),
        totalBook: parseInt(totalBook),
        totalPage: Math.ceil(parseInt(totalBook) / parseInt(perPage)),
      })
    })
    .catch(err => {
      console.log(err)
      res.redirect('/')
    })
}

exports.searchBook = (req, res) => {
  Book.find({ title: { $regex: req.query.title || '', $options: 'i' } })
    .sort({ title: 1 })
    .then(books => {
      // console.log(books)
      res.render('customer/search-book', { books, msg: req.flash('msg') })
    })
    .catch(err => {
      console.log(err)
      res.redirect('/admin')
    })
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
    const Reservation = require('../models/Reservation')
    const reservations = await Reservation.find({ user: res.locals.user.id })
      .populate('book', 'title cover_image')
      .sort({ createdAt: -1 })
    res.render('customer/profile', { reservations, msg: req.flash('msg') })
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

exports.cart = (req, res) => {
  Cart.find().populate('user').populate('book')
    .then(result => {
      res.render('customer/cart', { cartItems: result, msg: req.flash('msg') })
    })
    .catch(err => {
      console.log(err)
      res.redirect('/')
    })
}

exports.postToCart = async (req, res) => {
  const { user_id, book_id, prev_url } = req.body

  try {
    const inInventory = await BorrowHistory.find({
      borrowed_by: user_id,
      borrowed_book: book_id,
      status: "In Progress"
    })
    Cart.find({ user: user_id, book: book_id })
      .then(result => {
        if(inInventory.length !== 0) {
          req.flash('msg', 'That book is already in your inventory...')
          res.redirect(prev_url)
        } else if(result.length !== 0) {
          req.flash('msg', 'That book is already in your cart...')
          res.redirect(prev_url)
        } else {
          Cart.create({ user: user_id, book: book_id })
          .then(result => {
            req.flash('msg', 'Book has been added to your cart!'),
            res.redirect(prev_url)
          })
          .catch(err => {
            console.log(err)
            res.redirect('/')
          })
        }
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

exports.getBorrow = (req, res) => {
  Cart.find().populate('user').populate('book')
    .then(result => {
      res.render('customer/borrow', { cartItems: result })
    })
    .catch(err => {
      console.log(err)
      res.redirect('/')
    })
}

exports.postBorrow = async (req, res) => {
  const { user_id, borrowDate, returnDate } = req.body
  const errors = validationResult(req)
  if(!errors.isEmpty()) {
    try {
      const user = await User.findById(user_id)
      const cart = await Cart.find().populate('user').populate('book')
      // console.log(cart)
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
    const borrowHistory = await BorrowHistory.find({ borrowed_by: req.params.id })
      .populate('borrowed_book')
      .sort({ borrow_date: -1 })

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
    
    // Require Review model here if not in top level
    const Review = require('../models/Review')
    const reviews = await Review.find({ book: book._id }).populate('user', 'name profile_picture').sort({ createdAt: -1 })
    
    let averageRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, current) => acc + current.rating, 0)
      averageRating = (sum / reviews.length).toFixed(1)
    }

    res.render('customer/book', { book, reviews, averageRating, msg: req.flash('msg') })
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
    const items = await Wishlist.find({ user: res.locals.user.id })
      .populate('book')
      .sort({ created_at: -1 })
    res.render('customer/wishlist', { items, msg: req.flash('msg') })
  } catch (err) {
    console.log(err)
    res.redirect('/')
  }
}

exports.addToWishlist = async (req, res) => {
  const { user_id, book_id, prev_url } = req.body
  try {
    const Wishlist = require('../models/Wishlist')
    const existing = await Wishlist.findOne({ user: user_id, book: book_id })
    if (existing) {
      req.flash('msg', 'That book is already in your wishlist.')
      return res.redirect(prev_url || '/wishlist')
    }
    await Wishlist.create({ user: user_id, book: book_id })
    req.flash('msg', 'Book added to your wishlist!')
    res.redirect(prev_url || '/wishlist')
  } catch (err) {
    console.log(err)
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
