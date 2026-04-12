const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Cart = require('../models/Cart')
const Wishlist = require('../models/Wishlist')
const Settings = require('../models/Settings')

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt
  
  if(token) {
    jwt.verify(token, process.env.JWT_PRIVATE_KEY, (err, decodedToken) => {
      if(err) {
        console.log(err.message)
        res.redirect('/login')
      } else {
        next()
      }
    })
  } else {
    res.redirect('/login')
  }
}

const adminArea = async (req, res, next) => {
  const token = req.cookies.jwt

  if(token) {
    jwt.verify(token, process.env.JWT_PRIVATE_KEY, async (err, decodedToken) => {
      if(err) {
        console.log(err.message)
        res.redirect('/')
      } else {
        let user = await User.findById(decodedToken.id)
        if(user.role === 0) {
          req.adminUser = user  // attach for audit logging
          next()
        } else {
          res.redirect('/')
        }
      }
    })
  } else {
    res.redirect('/')
  }
}

const checkUser = (req, res, next) => {
  const token = req.cookies.jwt

  if(token) {
    jwt.verify(token, process.env.JWT_PRIVATE_KEY, async (err, decodedToken) => {
      if(err) {
        console.log(err.message)
        res.locals.user = null
        const settings = await Settings.getGlobal()
        res.locals.settings = settings
        next()
      } else {
        let user = await User.findById(decodedToken.id)
        let itemCount = await Cart.find({ user: user.id }).countDocuments()
        let wishlistCount = await Wishlist.find({ user: user.id }).countDocuments()
        const settings = await Settings.getGlobal()
        res.locals.user = user
        res.locals.itemCount = itemCount
        res.locals.wishlistCount = wishlistCount
        res.locals.settings = settings
        next()
      }
    })
  } else {
    res.locals.user = null
    Settings.getGlobal().then(settings => {
      res.locals.settings = settings
      next()
    }).catch(() => {
      res.locals.settings = { fine_per_day: 1.00, currency_symbol: '$', currency_name: 'USD' }
      next()
    })
  }
}

const checkLogin = (req, res, next) => {
  const token = req.cookies.jwt

  if(token) {
    jwt.verify(token, process.env.JWT_PRIVATE_KEY, (err, decodedToken) => {
      if(err) {
        console.log(err.message)
        next()
      } else {
        res.redirect('/')
      }
    })
  } else {
    next()
  }
}

module.exports = { requireAuth, adminArea, checkUser, checkLogin }