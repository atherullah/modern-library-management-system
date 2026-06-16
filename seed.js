if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

// Real models so defaults/validation/collection names stay in sync with the app
const User = require('./models/User')
const BorrowHistory = require('./models/BorrowHistory')
const Cart = require('./models/Cart')
const Wishlist = require('./models/Wishlist')
const Reservation = require('./models/Reservation')
const Review = require('./models/Review')
const AuditLog = require('./models/AuditLog')
const Settings = require('./models/Settings')

// Minimal inline schema to avoid virtual getter issues during seeding
const bookSchema = new mongoose.Schema({
  isbn: { type: String, required: true, unique: true, trim: true },
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true },
  publish_year: { type: String, required: true },
  page_count: { type: Number, required: true },
  categories: { type: [String], required: true },
  description: { type: String, required: true },
  stock: { type: Number, required: true },
  cover_image: { type: String, required: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })

const Book = mongoose.model('book', bookSchema)

const books = [
  // Art
  {
    isbn: '9780714896526',
    title: 'The Story of Art',
    author: 'E.H. Gombrich',
    publish_year: '1950',
    page_count: 688,
    categories: ['Art'],
    description: 'One of the most famous and popular books on art ever written, The Story of Art has been a global bestseller for decades. Gombrich traces the history of art from ancient Egypt to the present day.',
    stock: 4,
    cover_image: 'cover_9780714896526.jpg',
  },
  // Science Fiction
  {
    isbn: '9780441013593',
    title: 'Dune',
    author: 'Frank Herbert',
    publish_year: '1965',
    page_count: 896,
    categories: ['Science Fiction'],
    description: 'Set in the distant future amidst a feudal interstellar society, Dune tells the story of young Paul Atreides as his family accepts stewardship of the desert planet Arrakis.',
    stock: 6,
    cover_image: 'cover_9780441013593.jpg',
  },
  {
    isbn: '9780743273565',
    title: 'The Hitchhiker\'s Guide to the Galaxy',
    author: 'Douglas Adams',
    publish_year: '1979',
    page_count: 224,
    categories: ['Science Fiction'],
    description: 'Seconds before Earth is demolished to make way for a hyperspace bypass, Arthur Dent is whisked off the planet by his friend Ford Prefect. A comedic sci-fi classic.',
    stock: 5,
    cover_image: 'cover_9780743273565.jpg',
  },
  // Fantasy
  {
    isbn: '9780261102354',
    title: 'The Fellowship of the Ring',
    author: 'J.R.R. Tolkien',
    publish_year: '1954',
    page_count: 432,
    categories: ['Fantasy'],
    description: 'The first part of Tolkien\'s epic masterpiece The Lord of the Rings. A young hobbit named Frodo Baggins inherits a mysterious ring and embarks on a perilous quest.',
    stock: 7,
    cover_image: 'cover_9780261102354.jpg',
  },
  {
    isbn: '9780439708180',
    title: 'Harry Potter and the Sorcerer\'s Stone',
    author: 'J.K. Rowling',
    publish_year: '1997',
    page_count: 309,
    categories: ['Fantasy', 'Children'],
    description: 'Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive. The magical world-building that started a generation.',
    stock: 10,
    cover_image: 'cover_9780439708180.jpg',
  },
  // Finance
  {
    isbn: '9781612680194',
    title: 'Rich Dad Poor Dad',
    author: 'Robert T. Kiyosaki',
    publish_year: '1997',
    page_count: 336,
    categories: ['Finance'],
    description: 'Rich Dad Poor Dad advocates financial independence and building wealth through investing, real estate, and starting businesses. A personal finance classic.',
    stock: 5,
    cover_image: 'cover_9781612680194.jpg',
  },
  {
    isbn: '9780062316110',
    title: 'The Psychology of Money',
    author: 'Morgan Housel',
    publish_year: '2020',
    page_count: 256,
    categories: ['Finance'],
    description: 'Timeless lessons on wealth, greed, and happiness. Housel shares 19 short stories exploring the strange ways people think about money.',
    stock: 8,
    cover_image: 'cover_9780062316110.jpg',
  },
  // Biographies
  {
    isbn: '9781451648539',
    title: 'Steve Jobs',
    author: 'Walter Isaacson',
    publish_year: '2011',
    page_count: 656,
    categories: ['Biographies'],
    description: 'Based on more than forty interviews with Jobs conducted over two years, as well as interviews with more than a hundred family members, friends, adversaries, competitors, and colleagues.',
    stock: 3,
    cover_image: 'cover_9781451648539.jpg',
  },
  // Recipes
  {
    isbn: '9781984825261',
    title: 'Salt, Fat, Acid, Heat',
    author: 'Samin Nosrat',
    publish_year: '2017',
    page_count: 480,
    categories: ['Recipes'],
    description: 'A visionary new master class in cooking that distills everything into just four elements. A New York Times bestseller and James Beard Award winner.',
    stock: 4,
    cover_image: 'cover_9781984825261.jpg',
  },
  // Romance
  {
    isbn: '9780141439518',
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    publish_year: '1813',
    page_count: 432,
    categories: ['Romance'],
    description: 'The story follows the main character Elizabeth Bennet as she deals with issues of manners, upbringing, morality, education, and marriage in the society of the landed gentry of early 19th-century England.',
    stock: 6,
    cover_image: 'cover_9780141439518.jpg',
  },
  // Children
  {
    isbn: '9780064404990',
    title: 'Charlotte\'s Web',
    author: 'E.B. White',
    publish_year: '1952',
    page_count: 192,
    categories: ['Children'],
    description: 'Some Pig. Humble. Radiant. These are the words in Charlotte\'s Web, high up in Zuckerman\'s barn. Charlotte\'s spiderweb tells of her feelings for a little pig named Wilbur.',
    stock: 5,
    cover_image: 'cover_9780064404990.jpg',
  },
  // History
  {
    isbn: '9780062316097',
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    publish_year: '2011',
    page_count: 443,
    categories: ['History', 'Science'],
    description: 'From a renowned historian comes a groundbreaking narrative of humanity\'s creation and evolution—a #1 international bestseller—that explores the ways in which biology and history have defined us.',
    stock: 9,
    cover_image: 'cover_9780062316097.jpg',
  },
  // Medicine
  {
    isbn: '9780312430856',
    title: 'The Emperor of All Maladies',
    author: 'Siddhartha Mukherjee',
    publish_year: '2010',
    page_count: 592,
    categories: ['Medicine', 'Science'],
    description: 'A biography of cancer—from its first documented appearances thousands of years ago through the modern era of chemotherapy, radiation, and targeted drugs.',
    stock: 3,
    cover_image: 'cover_9780312430856.jpg',
  },
  // Religion
  {
    isbn: '9780060929527',
    title: 'Mere Christianity',
    author: 'C.S. Lewis',
    publish_year: '1952',
    page_count: 227,
    categories: ['Religion'],
    description: 'In the classic Mere Christianity, C.S. Lewis, the most important Christian writer of the 20th century, explores the common ground upon which all of those of Christian faith stand together.',
    stock: 4,
    cover_image: 'cover_9780060929527.jpg',
  },
  // Mystery
  {
    isbn: '9780062073488',
    title: 'Gone Girl',
    author: 'Gillian Flynn',
    publish_year: '2012',
    page_count: 422,
    categories: ['Mystery'],
    description: 'On a warm summer morning in North Carthage, Missouri, it is Nick and Amy Dunne\'s fifth wedding anniversary. Presents are being wrapped and plans are being made when Nick\'s beautiful wife disappears.',
    stock: 5,
    cover_image: 'cover_9780062073488.jpg',
  },
  {
    isbn: '9780307474278',
    title: 'The Girl with the Dragon Tattoo',
    author: 'Stieg Larsson',
    publish_year: '2005',
    page_count: 672,
    categories: ['Mystery'],
    description: 'A gripping mystery involving a disgraced journalist and a brilliant hacker who investigate a decades-old disappearance within a wealthy Swedish family.',
    stock: 4,
    cover_image: 'cover_9780307474278.jpg',
  },
  // Music
  {
    isbn: '9781250301697',
    title: 'Just Kids',
    author: 'Patti Smith',
    publish_year: '2010',
    page_count: 304,
    categories: ['Music', 'Biographies'],
    description: 'An intimate memoir of Patti Smith\'s relationship with photographer Robert Mapplethorpe in New York City during the late 1960s and 1970s, set against the backdrop of the city\'s vibrant arts scene.',
    stock: 3,
    cover_image: 'cover_9781250301697.jpg',
  },
  // Science
  {
    isbn: '9780553380163',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    publish_year: '1988',
    page_count: 212,
    categories: ['Science'],
    description: 'A landmark volume in science writing by one of the great minds of our time, Stephen Hawking\'s book explores such profound questions as: How did the universe begin—and what made its start possible?',
    stock: 7,
    cover_image: 'cover_9780553380163.jpg',
  },
  // Out of stock (for testing reservation feature)
  {
    isbn: '9780525559474',
    title: 'The Midnight Library',
    author: 'Matt Haig',
    publish_year: '2020',
    page_count: 304,
    categories: ['Fantasy', 'Romance'],
    description: 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.',
    stock: 0,
    cover_image: 'cover_9780525559474.jpg',
  },
]

// ---------------------------------------------------------------------------
// Demo users — role 0 = admin, role 1 = customer. All pre-verified.
// ---------------------------------------------------------------------------
const ADMIN_PASSWORD = 'admin123'
const CUSTOMER_PASSWORD = 'customer123'

const users = [
  { name: 'Admin', email: 'admin@gmail.com', password: ADMIN_PASSWORD, role: 0 },
  { name: 'Customer', email: 'customer@gmail.com', password: CUSTOMER_PASSWORD, role: 1 },
  { name: 'Alice Johnson', email: 'alice@gmail.com', password: CUSTOMER_PASSWORD, role: 1 },
  { name: 'Bob Smith', email: 'bob@gmail.com', password: CUSTOMER_PASSWORD, role: 1 },
  { name: 'Carol White', email: 'carol@gmail.com', password: CUSTOMER_PASSWORD, role: 1 },
  { name: 'David Lee', email: 'david@gmail.com', password: CUSTOMER_PASSWORD, role: 1 },
]

// ---------------------------------------------------------------------------
// Borrow history — day offsets relative to seed time, 14-day loan period.
// No `returnedDaysAgo` => active loan ("In Progress", decrements book stock).
// Returned after the due date => fine of $1/day late (matches FINE_PER_DAY).
// Spread over ~50 days so the 30-day dashboard trend and reports have data.
// ---------------------------------------------------------------------------
const LOAN_DAYS = 14

const borrows = [
  // Active loans (due in the future)
  { user: 'customer@gmail.com', isbn: '9780441013593', borrowedDaysAgo: 3 },                            // Dune
  { user: 'customer@gmail.com', isbn: '9780439708180', borrowedDaysAgo: 1 },                            // Harry Potter
  { user: 'alice@gmail.com', isbn: '9780062316097', borrowedDaysAgo: 5 },                               // Sapiens
  { user: 'bob@gmail.com', isbn: '9781612680194', borrowedDaysAgo: 2 },                                 // Rich Dad Poor Dad
  { user: 'carol@gmail.com', isbn: '9780141439518', borrowedDaysAgo: 4 },                               // Pride and Prejudice
  { user: 'david@gmail.com', isbn: '9780714896526', borrowedDaysAgo: 6 },                               // The Story of Art
  // Returned on time
  { user: 'customer@gmail.com', isbn: '9780062316097', borrowedDaysAgo: 28, returnedDaysAgo: 16 },      // Sapiens
  { user: 'alice@gmail.com', isbn: '9780441013593', borrowedDaysAgo: 25, returnedDaysAgo: 12 },         // Dune
  { user: 'bob@gmail.com', isbn: '9780062073488', borrowedDaysAgo: 22, returnedDaysAgo: 9 },            // Gone Girl
  { user: 'carol@gmail.com', isbn: '9780064404990', borrowedDaysAgo: 20, returnedDaysAgo: 7 },          // Charlotte's Web
  { user: 'david@gmail.com', isbn: '9780553380163', borrowedDaysAgo: 18, returnedDaysAgo: 5 },          // A Brief History of Time
  { user: 'alice@gmail.com', isbn: '9780439708180', borrowedDaysAgo: 27, returnedDaysAgo: 14 },         // Harry Potter
  { user: 'bob@gmail.com', isbn: '9780743273565', borrowedDaysAgo: 24, returnedDaysAgo: 11 },           // Hitchhiker's Guide
  { user: 'bob@gmail.com', isbn: '9780062316097', borrowedDaysAgo: 17, returnedDaysAgo: 3 },            // Sapiens
  // Returned late — fine paid
  { user: 'customer@gmail.com', isbn: '9781451648539', borrowedDaysAgo: 29, returnedDaysAgo: 12, finePaid: true },  // Steve Jobs, 3 days late
  { user: 'alice@gmail.com', isbn: '9780312430856', borrowedDaysAgo: 26, returnedDaysAgo: 10, finePaid: true },     // Emperor of All Maladies, 2 days late
  // Returned late — fine unpaid
  { user: 'customer@gmail.com', isbn: '9781250301697', borrowedDaysAgo: 23, returnedDaysAgo: 5 },       // Just Kids, 4 days late
  { user: 'carol@gmail.com', isbn: '9780060929527', borrowedDaysAgo: 21, returnedDaysAgo: 2 },          // Mere Christianity, 5 days late
  { user: 'david@gmail.com', isbn: '9780307474278', borrowedDaysAgo: 19, returnedDaysAgo: 1 },          // Girl with the Dragon Tattoo, 4 days late
  // Older history (outside the 30-day trend, still counts for reports/top borrowed)
  { user: 'customer@gmail.com', isbn: '9780441013593', borrowedDaysAgo: 45, returnedDaysAgo: 32 },      // Dune
  { user: 'alice@gmail.com', isbn: '9780141439518', borrowedDaysAgo: 50, returnedDaysAgo: 36 },         // Pride and Prejudice
  { user: 'bob@gmail.com', isbn: '9780439708180', borrowedDaysAgo: 40, returnedDaysAgo: 27 },           // Harry Potter
]

// ---------------------------------------------------------------------------
// Reviews, wishlists, reservations, carts — keyed by email + ISBN
// ---------------------------------------------------------------------------
const reviews = [
  { user: 'alice@gmail.com', isbn: '9780441013593', rating: 5, comment: 'A masterpiece of world-building. The politics, ecology, and prophecy all weave together perfectly.' },
  { user: 'customer@gmail.com', isbn: '9780441013593', rating: 4, comment: 'Dense at first but absolutely worth it once the story gets going.' },
  { user: 'carol@gmail.com', isbn: '9780439708180', rating: 5, comment: 'Pure magic. Re-reading it as an adult is just as enjoyable as the first time.' },
  { user: 'bob@gmail.com', isbn: '9780439708180', rating: 4, comment: 'A great start to the series. My kids loved it too.' },
  { user: 'david@gmail.com', isbn: '9780062316097', rating: 5, comment: 'Changed how I think about human history. Every chapter has a mind-blowing idea.' },
  { user: 'alice@gmail.com', isbn: '9780062316097', rating: 4, comment: 'Thought-provoking, though some claims feel oversimplified. Still a must-read.' },
  { user: 'carol@gmail.com', isbn: '9780141439518', rating: 5, comment: 'Elizabeth Bennet remains the best heroine in English literature. Timeless.' },
  { user: 'bob@gmail.com', isbn: '9780062073488', rating: 4, comment: 'Twisty and dark. The unreliable narration kept me guessing until the end.' },
  { user: 'customer@gmail.com', isbn: '9781612680194', rating: 3, comment: 'Some useful mindset shifts, but quite repetitive in the second half.' },
  { user: 'david@gmail.com', isbn: '9780553380163', rating: 5, comment: 'Hawking makes cosmology genuinely accessible. Short but profound.' },
  { user: 'carol@gmail.com', isbn: '9781984825261', rating: 4, comment: 'Finally understand WHY recipes work. The illustrations are beautiful.' },
  { user: 'alice@gmail.com', isbn: '9780525559474', rating: 5, comment: 'Wept at the end. A beautiful meditation on regret and second chances.' },
]

const wishlists = [
  { user: 'customer@gmail.com', isbn: '9780525559474' },  // The Midnight Library
  { user: 'customer@gmail.com', isbn: '9781984825261' },  // Salt, Fat, Acid, Heat
  { user: 'alice@gmail.com', isbn: '9780062073488' },     // Gone Girl
  { user: 'bob@gmail.com', isbn: '9780553380163' },       // A Brief History of Time
  { user: 'carol@gmail.com', isbn: '9781250301697' },     // Just Kids
  { user: 'david@gmail.com', isbn: '9780312430856' },     // Emperor of All Maladies
]

const reservations = [
  { user: 'customer@gmail.com', isbn: '9780525559474', status: 'Pending' },   // out-of-stock book
  { user: 'alice@gmail.com', isbn: '9780525559474', status: 'Pending' },
  { user: 'bob@gmail.com', isbn: '9780441013593', status: 'Fulfilled' },
  { user: 'carol@gmail.com', isbn: '9781451648539', status: 'Cancelled' },
]

const carts = [
  { user: 'customer@gmail.com', isbn: '9780062073488' },  // Gone Girl
  { user: 'customer@gmail.com', isbn: '9780062316110' },  // The Psychology of Money
  { user: 'alice@gmail.com', isbn: '9780064404990' },     // Charlotte's Web
]

// ---------------------------------------------------------------------------
// Audit log entries (demo) — uses the same action names the admin panel logs
// ---------------------------------------------------------------------------
const auditLogs = [
  { action: 'IMPORT_BOOKS', entity: 'Book', isbn: null, description: 'Imported 19 books from seed catalog (CSV)', daysAgo: 10 },
  { action: 'ADD_BOOK', entity: 'Book', isbn: '9780525559474', description: 'Added book "The Midnight Library"', daysAgo: 8 },
  { action: 'UPDATE_BOOK', entity: 'Book', isbn: '9780441013593', description: 'Updated stock for "Dune" (4 → 6)', daysAgo: 6 },
  { action: 'UPDATE_SETTINGS', entity: 'Settings', isbn: null, description: 'Updated settings: fine $1.00/day, currency USD ($)', daysAgo: 4 },
  { action: 'MARK_FINE_PAID', entity: 'BorrowHistory', isbn: null, description: 'Marked fine as paid for "Steve Jobs"', daysAgo: 2 },
]

const FINE_PER_DAY = 1.00
const MS_PER_DAY = 1000 * 60 * 60 * 24

const now = new Date()
const daysAgo = (n) => new Date(now.getTime() - n * MS_PER_DAY)

async function seed() {
  try {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    })
    console.log('Connected to MongoDB')

    // Clean start: drop the entire database so it ends up containing exactly
    // this dataset — removes all collections, including any stray/legacy ones.
    await mongoose.connection.dropDatabase()
    console.log('Dropped database (clean slate)')

    // --- Books ---
    const insertedBooks = await Book.insertMany(books)
    const bookByIsbn = {}
    insertedBooks.forEach((book) => { bookByIsbn[book.isbn] = book })
    console.log(`✓ ${insertedBooks.length} books`)

    // --- Users (insertMany skips the pre-save hook, so hash here) ---
    const insertedUsers = await User.insertMany(await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10),
        isVerified: true,
      }))
    ))
    const userByEmail = {}
    insertedUsers.forEach((user) => { userByEmail[user.email] = user })
    console.log(`✓ ${insertedUsers.length} users`)

    // --- Borrow history ---
    const borrowDocs = borrows.map((entry) => {
      const borrowDate = daysAgo(entry.borrowedDaysAgo)
      const dueDate = daysAgo(entry.borrowedDaysAgo - LOAN_DAYS)
      const doc = {
        borrowed_by: userByEmail[entry.user]._id,
        borrowed_book: bookByIsbn[entry.isbn]._id,
        borrow_date: borrowDate,
        return_date: dueDate,
      }
      if (entry.returnedDaysAgo === undefined) {
        // Active loan
        doc.status = 'In Progress'
        doc.book_returned = false
      } else {
        const returnedOn = daysAgo(entry.returnedDaysAgo)
        const daysLate = Math.max(0, Math.ceil((returnedOn - dueDate) / MS_PER_DAY))
        doc.status = 'Returned'
        doc.book_returned = true
        doc.actual_return_date = returnedOn
        doc.fine_amount = daysLate * FINE_PER_DAY
        doc.fine_paid = entry.finePaid || false
      }
      return doc
    })
    const insertedBorrows = await BorrowHistory.insertMany(borrowDocs)

    // Active loans take a copy off the shelf
    const activeLoans = insertedBorrows.filter((b) => b.status === 'In Progress')
    await Book.bulkWrite(activeLoans.map((loan) => ({
      updateOne: {
        filter: { _id: loan.borrowed_book, stock: { $gt: 0 } },
        update: { $inc: { stock: -1 } },
      },
    })))
    const finesCount = insertedBorrows.filter((b) => b.fine_amount > 0).length
    console.log(`✓ ${insertedBorrows.length} borrow records (${activeLoans.length} active, ${finesCount} with fines)`)

    // --- Reviews ---
    await Review.insertMany(reviews.map((r) => ({
      user: userByEmail[r.user]._id,
      book: bookByIsbn[r.isbn]._id,
      rating: r.rating,
      comment: r.comment,
    })))
    console.log(`✓ ${reviews.length} reviews`)

    // --- Wishlists ---
    await Wishlist.insertMany(wishlists.map((w) => ({
      user: userByEmail[w.user]._id,
      book: bookByIsbn[w.isbn]._id,
    })))
    console.log(`✓ ${wishlists.length} wishlist items`)

    // --- Reservations ---
    await Reservation.insertMany(reservations.map((r) => ({
      user: userByEmail[r.user]._id,
      book: bookByIsbn[r.isbn]._id,
      status: r.status,
    })))
    console.log(`✓ ${reservations.length} reservations`)

    // --- Carts ---
    await Cart.insertMany(carts.map((c) => ({
      user: userByEmail[c.user]._id,
      book: bookByIsbn[c.isbn]._id,
    })))
    console.log(`✓ ${carts.length} cart items`)

    // --- Audit logs ---
    const admin = userByEmail['admin@gmail.com']
    await AuditLog.insertMany(auditLogs.map((entry) => ({
      admin: admin._id,
      admin_name: admin.name,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.isbn ? String(bookByIsbn[entry.isbn]._id) : '',
      description: entry.description,
      ip: '127.0.0.1',
      created_at: daysAgo(entry.daysAgo),
    })))
    console.log(`✓ ${auditLogs.length} audit log entries`)

    // --- Settings (single global document) ---
    await Settings.findOneAndUpdate(
      { key: 'global' },
      { $set: { fine_per_day: FINE_PER_DAY, currency_symbol: '$', currency_name: 'USD' } },
      { upsert: true }
    )
    console.log('✓ global settings')

    // dropDatabase() removed all indexes too — rebuild them now (unique email,
    // unique isbn, unique wishlist user+book) instead of waiting for app boot.
    await Promise.all(
      [Book, User, BorrowHistory, Cart, Wishlist, Reservation, Review, AuditLog, Settings]
        .map((model) => model.createIndexes())
    )
    console.log('✓ indexes rebuilt')

    console.log('\nDone! Demo accounts:')
    console.log(`  Admin:    admin@gmail.com / ${ADMIN_PASSWORD}`)
    console.log(`  Customer: customer@gmail.com / ${CUSTOMER_PASSWORD}`)
    console.log(`  (alice|bob|carol|david)@gmail.com / ${CUSTOMER_PASSWORD}`)
  } catch (err) {
    console.error('Seed error:', err.message)
    process.exitCode = 1
  } finally {
    await mongoose.disconnect()
  }
}

seed()
