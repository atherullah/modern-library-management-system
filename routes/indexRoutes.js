const express = require('express')
const indexController = require('../controllers/indexController')
const { requireAuth } = require('../middlewares/authMiddleware')
const { editProfileValidator, borrowValidator } = require('../middlewares/userMiddleware')

const router = express.Router()

// Books
router.get('/', indexController.home)
router.get('/books/:page?', indexController.allBooks)
router.get('/search', indexController.searchBook)
router.get('/book/:id', indexController.bookDetail)
router.post('/book/:id/review', requireAuth, indexController.addReview)
router.post('/book/:id/reserve', requireAuth, indexController.reserveBook)

// User Profile
router.get('/profile', requireAuth, indexController.userProfile)
router.get('/profile/edit', requireAuth, indexController.editProfile)
router.put('/profile', requireAuth, editProfileValidator, indexController.updateProfile)

// Wishlist
router.get('/wishlist', requireAuth, indexController.getWishlist)
router.post('/wishlist', requireAuth, indexController.addToWishlist)
router.delete('/wishlist', requireAuth, indexController.removeFromWishlist)

// Cart
router.get('/cart', requireAuth, indexController.cart)
router.post('/cart', requireAuth, indexController.postToCart)
router.delete('/cart', requireAuth, indexController.deleteCartItem)

// Borrow
router.get('/borrow', requireAuth, indexController.getBorrow)
router.post('/borrow', requireAuth, borrowValidator, indexController.postBorrow)
router.get('/inventory/:id', requireAuth, indexController.borrowedBooks)
router.post('/read', requireAuth, indexController.readBook)
router.post('/return', requireAuth, indexController.returnBook)
router.get('/history/:id', requireAuth, indexController.borrowHistory)

// Chatbot
router.post('/api/chat', indexController.chat)

// Books by genre - Placed at the bottom to avoid interference with other routes
router.get('/:genre', indexController.booksByGenre)

module.exports = router