const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const User = require('../models/User')
const jwt = require('jsonwebtoken')

const maxAge = 7 * 24 * 60 * 60

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.APP_URL}/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists by googleId or email
    let user = await User.findOne({ googleId: profile.id })

    if (!user) {
      // Check if email already registered (merge accounts)
      user = await User.findOne({ email: profile.emails[0].value })
      if (user) {
        // Link Google to existing account
        user.googleId = profile.id
        if (!user.profile_picture || user.profile_picture === 'default_user.svg') {
          user.googleAvatar = profile.photos[0]?.value
        }
        await user.save({ validateBeforeSave: false })
      } else {
        // Create new user from Google profile
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id,
          googleAvatar: profile.photos[0]?.value,
          isVerified: true,  // Google accounts are pre-verified
          password: require('crypto').randomBytes(32).toString('hex'), // random unusable password
        })
      }
    }

    return done(null, user)
  } catch (err) {
    return done(err, null)
  }
}))

passport.serializeUser((user, done) => done(null, user.id))
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (err) {
    done(err, null)
  }
})

module.exports = passport
