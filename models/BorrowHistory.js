const mongoose = require('mongoose')

const FINE_PER_DAY = 1.00 // $1 per day overdue

const borrowHistorySchema = new mongoose.Schema({
  borrowed_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  borrowed_book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'book'
  },
  borrow_date: {
    type: Date,
    required: true
  },
  return_date: {
    type: Date,
    required: true
  },
  actual_return_date: {
    type: Date,
  },
  status: {
    type: String,
    default: 'In Progress'
  },
  book_returned: {
    type: Boolean,
    default: false
  },
  fine_amount: {
    type: Number,
    default: 0
  },
  fine_paid: {
    type: Boolean,
    default: false
  }
},
{
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
})

// Virtual: calculate fine based on actual_return_date or now
borrowHistorySchema.virtual('calculated_fine').get(function() {
  const returnedOn = this.actual_return_date || new Date()
  const dueDate = new Date(this.return_date)
  const diffMs = returnedOn - dueDate
  if (diffMs <= 0) return 0
  const daysLate = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return parseFloat((daysLate * FINE_PER_DAY).toFixed(2))
})

module.exports = mongoose.model('BorrowHistory', borrowHistorySchema)
module.exports.FINE_PER_DAY = FINE_PER_DAY