if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const mongoose = require('mongoose')
const path = require('path')

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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
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
    cover_image: 'default_cover.jpg',
  },
]

async function seed() {
  try {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    })
    console.log('Connected to MongoDB')

    let inserted = 0
    let skipped = 0

    for (const book of books) {
      try {
        await Book.create(book)
        console.log(`  ✓ Added: ${book.title}`)
        inserted++
      } catch (err) {
        if (err.code === 11000) {
          console.log(`  – Skipped (already exists): ${book.title}`)
          skipped++
        } else {
          throw err
        }
      }
    }

    console.log(`\nDone! ${inserted} books added, ${skipped} skipped.`)
  } catch (err) {
    console.error('Seed error:', err.message)
  } finally {
    await mongoose.disconnect()
  }
}

seed()
