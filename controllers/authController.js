const User = require('../models/User')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const sendEmail = require('../utils/sendEmail')
const { getVerificationTemplate, getPasswordResetTemplate } = require('../utils/emailTemplates')

const handleErrors = (err) => {
  let errors = { email: '', password: '', general: '' }

  if(err.message === 'Incorrect email') {
    errors.email = 'This email is not registered'
  }
  
  if(err.message === 'Incorrect password') {
    errors.password = 'This password is incorrect'
  }

  if(err.message === 'Email not verified') {
    errors.email = 'Please verify your email address to log in.'
  }

  if(err.code === 11000) {
    errors.email = 'This email is already registered.'
    return errors
  }

  if(err.message.includes('user validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message
    })
  }

  return errors
}

const maxAge = 7 * 24 * 60 * 60 // equal to 7 days in seconds
const createJWT = (id) => {
  return jwt.sign({ id }, process.env.JWT_PRIVATE_KEY, {
    expiresIn: maxAge
  })
}

exports.register_get = (req, res) => {
  res.render('auth/register')
}

exports.login_get = (req, res) => {
  res.render('auth/login')
}

exports.register_post = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body

  if(password !== confirmPassword) {
    return res.status(400).json({
      errors: {
        password: `Password doesn't match!`,
        confirmPassword: `Password doesn't match!`,
      }
    })
  }

  try {
    const user = await User.create({ name, email, password })
    
    // Generate verification token
    const verificationToken = user.getVerificationToken()
    await user.save({ validateBeforeSave: false })

    // Create verify URL
    const verifyUrl = `${req.protocol}://${req.get('host')}/verify/${verificationToken}`
    const message = `Please verify your email by clicking the link: \n\n ${verifyUrl}`
    const html = getVerificationTemplate(user.name, verifyUrl)

    try {
      await sendEmail({
        email: user.email,
        subject: 'Email Verification',
        message,
        html
      })
      res.status(201).json({ success: true, message: 'Registration successful! Please check your email to verify your account.' })
    } catch(err) {
      console.error('[Auth] Verification email sending failed:', err.message)
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n\x1b[35m%s\x1b[0m', `👉 OFFLINE REGISTRATION LINK: ${verifyUrl}\n`)
        return res.status(201).json({ 
          success: true, 
          message: 'Registration successful! (Email sandbox fallback: Verification link has been logged to your server terminal console.)' 
        })
      }
      user.verificationToken = undefined
      await user.save({ validateBeforeSave: false })
      return res.status(500).json({ errors: { general: 'Email could not be sent. Please contact administration.' } })
    }
  } catch(err) {
    const errors = handleErrors(err)
    res.status(400).json({ errors })
  }
}

exports.verify_email_get = async (req, res) => {
  try {
    const verificationToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    
    const user = await User.findOne({ verificationToken })

    if (!user) {
      req.flash('error', 'Invalid or expired verification token')
      return res.redirect('/login')
    }

    user.isVerified = true
    user.verificationToken = undefined
    await user.save({ validateBeforeSave: false })
    
    // Automatically log them in
    const token = createJWT(user._id)
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
    
    req.flash('success', 'Email successfully verified! You are now logged in.')
    res.redirect('/')
  } catch (err) {
    console.error(err)
    req.flash('error', 'Something went wrong during verification')
    res.redirect('/login')
  }
}

exports.login_post = (req, res) => {
  const { email, password } = req.body

  User.login(email, password)
    .then(user => {
      const token = createJWT(user._id)
      res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 })
      res.status(200).json({ user: user._id, role: user.role })
    })
    .catch(err => {
      const errors = handleErrors(err)
      res.status(400).json({ errors })
    })
}

exports.logout = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 })
  res.redirect('/')
}

exports.forgot_password_get = (req, res) => {
  res.render('auth/forgot-password')
}

exports.forgot_password_post = async (req, res) => {
  const { email } = req.body
  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(404).json({ error: 'There is no user with that email' })
    }

    const resetToken = user.getResetPasswordToken()
    await user.save({ validateBeforeSave: false })

    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the link to reset your password: \n\n ${resetUrl}`
    const html = getPasswordResetTemplate(user.name, resetUrl)

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token',
        message,
        html
      })
      res.status(200).json({ success: true, message: 'Email sent successfully!' })
    } catch(err) {
      console.error('[Auth] Password reset email sending failed:', err.message)
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n\x1b[35m%s\x1b[0m', `👉 OFFLINE PASSWORD RESET LINK: ${resetUrl}\n`)
        return res.status(200).json({ 
          success: true, 
          message: 'Password reset link generated! (Email sandbox fallback: Link logged to your server terminal console.)' 
        })
      }
      user.resetPasswordToken = undefined
      user.resetPasswordExpire = undefined
      await user.save({ validateBeforeSave: false })
      return res.status(500).json({ error: 'Email could not be sent. Please contact administration.' })
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' })
  }
}

exports.reset_password_get = async (req, res) => {
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    })
    
    if (!user) {
      req.flash('error', 'Invalid token or token has expired')
      return res.redirect('/forgot-password')
    }
    
    res.render('auth/reset-password', { token: req.params.token })
  } catch (err) {
    console.error(err)
    res.redirect('/forgot-password')
  }
}

exports.reset_password_post = async (req, res) => {
  const { password, confirmPassword } = req.body
  
  if(password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords don't match!" })
  }

  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
  
  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    })
    
    if (!user) {
      return res.status(400).json({ error: 'Invalid token or token has expired' })
    }

    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined

    await user.save()

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now login.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server Error' })
  }
}