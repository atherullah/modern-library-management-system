const mongoose = require('mongoose')

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'book',
    required: true,
  },
},
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
})

// Prevent duplicate user+book combinations at the DB level
wishlistSchema.index({ user: 1, book: 1 }, { unique: true })

module.exports = mongoose.model('Wishlist', wishlistSchema)
