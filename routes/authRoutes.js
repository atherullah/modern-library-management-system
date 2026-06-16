const express = require('express')
const authController = require('../controllers/authController')
const { checkLogin } = require('../middlewares/authMiddleware')
const passport = require('../utils/passport')
const jwt = require('jsonwebtoken')

const router = express.Router()

router.get('/register', checkLogin, authController.register_get)
router.post('/register', checkLogin, authController.register_post)

router.get('/login', checkLogin, authController.login_get)
router.post('/login', checkLogin, authController.login_post)

router.get('/logout', authController.logout)

// Email verification & password reset
router.get('/verify/:token', authController.verify_email_get)
router.get('/forgot-password', checkLogin, authController.forgot_password_get)
router.post('/forgot-password', checkLogin, authController.forgot_password_post)
router.get('/reset-password/:token', checkLogin, authController.reset_password_get)
router.post('/reset-password/:token', checkLogin, authController.reset_password_post)

// Google OAuth — only live when credentials are configured (see utils/passport.js).
// Without them the strategy is never registered, so guard to avoid a 500.
const requireGoogle = (req, res, next) => {
  if (!passport.googleEnabled) return res.redirect('/login')
  next()
}

router.get('/auth/google',
  requireGoogle,
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

router.get('/auth/google/callback',
  requireGoogle,
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    // Issue JWT cookie same as regular login
    const maxAge = 7 * 24 * 60 * 60
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_PRIVATE_KEY, { expiresIn: maxAge })
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
    res.redirect('/')
  }
)

module.exports = router