const mongoose = require('mongoose')
const { isEmail } = require('validator')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const path = require('path')

const profilePictureBasePath = 'public/user_images'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'This field is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'This field is required'],
    validate: [isEmail, 'This field must be a valid email'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'This field is required'],
    minlength: [6, 'The minimum password length is 6 characters'],
    trim: true,
  },
  profile_picture: {
    type: String,
    default: 'default_user.svg'
  },
  role: {
    type: Number,
    default: 1  // customer
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date
},
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
})

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt()
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email })
  if(user) {
    if(!user.isVerified) {
      throw Error('Email not verified');
    }
    const auth = await bcrypt.compare(password, user.password)
    if(auth) {
      return user
    }
    throw Error('Incorrect password')
  }
  throw Error('Incorrect email')
}

// Generate email verification token
userSchema.methods.getVerificationToken = function() {
  const token = crypto.randomBytes(20).toString('hex');
  this.verificationToken = crypto.createHash('sha256').update(token).digest('hex');
  return token;
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  // Set expire to 10 minutes
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.virtual('profilePicturePath').get(function() {
  if (this.profile_picture !== null) {
    return path.join('/', profilePictureBasePath, this.profile_picture)
  }
})

module.exports = mongoose.model('user', userSchema)