const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'book',
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: {
    type: String,
    trim: true,
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('review', reviewSchema)
