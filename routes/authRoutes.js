const express = require('express')
const authController = require('../controllers/authController')
const { checkLogin } = require('../middlewares/authMiddleware')

const router = express.Router()

router.get('/register', checkLogin, authController.register_get)
router.post('/register', checkLogin, authController.register_post)

router.get('/login', checkLogin, authController.login_get)
router.post('/login', checkLogin, authController.login_post)

router.get('/logout', authController.logout)

// New Security Routes
router.get('/verify/:token', authController.verify_email_get)

router.get('/forgot-password', checkLogin, authController.forgot_password_get)
router.post('/forgot-password', checkLogin, authController.forgot_password_post)

router.get('/reset-password/:token', checkLogin, authController.reset_password_get)
router.post('/reset-password/:token', checkLogin, authController.reset_password_post)

module.exports = router