// Seeds demo data so the UI has something to show:
//   - a handful of verified customer accounts (reviewers)
//   - reviews across all books (so ratings appear on cards & detail pages)
//   - borrow history (so the Popular shelf ranks, and the account dashboard shows
//     current loans, due-date countdowns, and an outstanding fine)
//
// Safe to re-run: clears existing reviews & borrow history first, then reseeds.
// Demo accounts are find-or-created (never duplicated). Books/admin are untouched.
//
// Run:  docker compose exec app node seed-demo.js

if (process.env.NODE_ENV !== 'production') {
  try { require('dotenv').config() } catch (e) {}
}

const mongoose = require('mongoose')
const User = require('./models/User')
const Book = require('./models/Book')
const Review = require('./models/Review')
const BorrowHistory = require('./models/BorrowHistory')

const DEMO_USERS = [
  { name: 'Alice Reader', email: 'alice@library.test' },
  { name: 'Bilal Khan', email: 'bilal@library.test' },
  { name: 'Chen Wei', email: 'chen@library.test' },
  { name: 'Diana Cruz', email: 'diana@library.test' },
  { name: 'Omar Farooq', email: 'omar@library.test' },
  { name: 'Sara Malik', email: 'sara@library.test' },
]

const COMMENTS = [
  "Absolutely loved this one — couldn't put it down!",
  'A solid read, well worth the time.',
  'Beautifully written and thought-provoking.',
  'Enjoyable, though it dragged a little in the middle.',
  'A classic for a reason. Highly recommend.',
  'Great pacing and memorable characters.',
  'Informative and engaging throughout.',
  'Not bad, but I expected a bit more.',
  "One of the best books I've read this year.",
  'Insightful and beautifully detailed.',
]

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr, n) => {
  const copy = [...arr]
  const out = []
  while (out.length < n && copy.length) out.push(copy.splice(randInt(0, copy.length - 1), 1)[0])
  return out
}
const daysFromNow = (d) => { const t = new Date(); t.setDate(t.getDate() + d); return t }

async function run() {
  await mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true,
  })
  console.log('Connected to', process.env.DB_URL)

  // 1) Demo reviewer accounts (find-or-create; password hashed by the model hook)
  const reviewers = []
  for (const du of DEMO_USERS) {
    let u = await User.findOne({ email: du.email })
    if (!u) {
      u = new User({ name: du.name, email: du.email, password: 'password123', role: 1, isVerified: true })
      await u.save()
      console.log('  + created user', du.email)
    }
    reviewers.push(u)
  }

  const mainCustomer = await User.findOne({ email: 'customer@gmail.com' })
  const reviewerPool = [...reviewers]
  if (mainCustomer && !reviewerPool.find(u => u.id === mainCustomer.id)) reviewerPool.push(mainCustomer)

  const books = await Book.find()
  if (!books.length) { console.log('No books found — run seed-books first.'); await mongoose.disconnect(); return }

  // 2) Reviews (clear + reseed)
  await Review.deleteMany({})
  let reviewCount = 0
  for (const book of books) {
    const chosen = pick(reviewerPool, randInt(2, Math.min(5, reviewerPool.length)))
    for (const r of chosen) {
      await Review.create({
        user: r.id, book: book.id,
        rating: randInt(3, 5), // skew positive
        comment: COMMENTS[randInt(0, COMMENTS.length - 1)],
      })
      reviewCount++
    }
  }
  console.log(`  + ${reviewCount} reviews across ${books.length} books`)

  // 3) Borrow history (clear + reseed)
  await BorrowHistory.deleteMany({})
  let bhCount = 0

  // 3a) Popularity spread — first books borrowed (and returned) more often
  const spread = books.slice(0, Math.min(8, books.length))
  for (let i = 0; i < spread.length; i++) {
    const times = Math.max(1, spread.length - i) // earliest books = most borrowed
    for (let t = 0; t < times; t++) {
      const u = reviewerPool[randInt(0, reviewerPool.length - 1)]
      await BorrowHistory.create({
        borrowed_by: u.id, borrowed_book: spread[i].id,
        borrow_date: daysFromNow(-randInt(30, 90)),
        return_date: daysFromNow(-randInt(10, 25)),
        actual_return_date: daysFromNow(-randInt(10, 25)),
        status: 'Returned', book_returned: true, fine_amount: 0, fine_paid: true,
      })
      bhCount++
    }
  }

  // 3b) The main customer's dashboard: active loans + an outstanding fine
  if (mainCustomer) {
    const loanBooks = pick(books, 4)
    await BorrowHistory.create({ borrowed_by: mainCustomer.id, borrowed_book: loanBooks[0].id, borrow_date: daysFromNow(-4),  return_date: daysFromNow(10), status: 'In Progress' }); bhCount++
    await BorrowHistory.create({ borrowed_by: mainCustomer.id, borrowed_book: loanBooks[1].id, borrow_date: daysFromNow(-12), return_date: daysFromNow(2),  status: 'In Progress' }); bhCount++
    await BorrowHistory.create({ borrowed_by: mainCustomer.id, borrowed_book: loanBooks[2].id, borrow_date: daysFromNow(-20), return_date: daysFromNow(-3), status: 'In Progress' }); bhCount++
    await BorrowHistory.create({ borrowed_by: mainCustomer.id, borrowed_book: loanBooks[3].id, borrow_date: daysFromNow(-40), return_date: daysFromNow(-20), actual_return_date: daysFromNow(-15), status: 'Returned', book_returned: true, fine_amount: 5.00, fine_paid: false }); bhCount++
    console.log('  + active loans + 1 unpaid fine for customer@gmail.com')
  }
  console.log(`  + ${bhCount} borrow history records`)

  console.log('Demo seed complete.')
  await mongoose.disconnect()
}

run().catch(err => { console.error(err); process.exit(1) })
