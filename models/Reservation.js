const mongoose = require('mongoose')

const reservationSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['Pending', 'Fulfilled', 'Cancelled'],
    default: 'Pending'
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('reservation', reservationSchema)
