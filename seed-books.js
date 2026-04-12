if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const mongoose = require('mongoose')
const path = require('path')
const https = require('https')
const fs = require('fs')

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

// Download cover image from Open Library
const downloadCover = (isbn) => {
  return new Promise((resolve) => {
    const url = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
    const filename = `cover_${isbn}.jpg`
    const filepath = path.join(__dirname, 'public', 'images', filename)

    if (fs.existsSync(filepath)) return resolve(filename)

    const file = fs.createWriteStream(filepath)
    https.get(url, (response) => {
      // Open Library returns a 1x1 gif if no cover exists
      if (response.headers['content-type'] === 'image/gif') {
        file.close()
        fs.unlink(filepath, () => {})
        return resolve('default_cover.jpg')
      }
      response.pipe(file)
      file.on('finish', () => { file.close(); resolve(filename) })
    }).on('error', () => {
      fs.unlink(filepath, () => {})
      resolve('default_cover.jpg')
    })
  })
}

const books = [
  // Art
  { isbn: '9780714896526', title: 'The Story of Art', author: 'E.H. Gombrich', publish_year: '1950', page_count: 688, categories: ['Art'], description: 'One of the most famous and popular books on art ever written. Gombrich traces the history of art from ancient Egypt to the present day.', stock: 4 },
  { isbn: '9780500204238', title: 'Ways of Seeing', author: 'John Berger', publish_year: '1972', page_count: 166, categories: ['Art'], description: 'A groundbreaking work on how we look at art, exploring the relationship between images and the ideologies of power.', stock: 3 },
  { isbn: '9780316017923', title: 'The $12 Million Stuffed Shark', author: 'Don Thompson', publish_year: '2008', page_count: 274, categories: ['Art'], description: 'A fascinating look at the economics of contemporary art and why some works sell for extraordinary prices.', stock: 2 },

  // Science Fiction
  { isbn: '9780441013593', title: 'Dune', author: 'Frank Herbert', publish_year: '1965', page_count: 896, categories: ['Science Fiction'], description: 'Set in the distant future, Dune tells the story of young Paul Atreides as his family accepts stewardship of the desert planet Arrakis.', stock: 6 },
  { isbn: '9780743273565', title: "The Hitchhiker's Guide to the Galaxy", author: 'Douglas Adams', publish_year: '1979', page_count: 224, categories: ['Science Fiction'], description: 'Seconds before Earth is demolished to make way for a hyperspace bypass, Arthur Dent is whisked off the planet by his friend Ford Prefect.', stock: 5 },
  { isbn: '9780062301239', title: 'Ender\'s Game', author: 'Orson Scott Card', publish_year: '1985', page_count: 352, categories: ['Science Fiction'], description: 'Andrew "Ender" Wiggin is trained from childhood to be Earth\'s supreme military commander in a future war against an alien race.', stock: 4 },
  { isbn: '9780451524935', title: '1984', author: 'George Orwell', publish_year: '1949', page_count: 328, categories: ['Science Fiction'], description: 'A dystopian novel set in a totalitarian society ruled by Big Brother, exploring themes of surveillance and psychological manipulation.', stock: 7 },
  { isbn: '9780060850524', title: 'Brave New World', author: 'Aldous Huxley', publish_year: '1932', page_count: 311, categories: ['Science Fiction'], description: 'A futuristic society where humans are genetically engineered and conditioned for their roles in a rigid class system.', stock: 5 },

  // Fantasy
  { isbn: '9780261102354', title: 'The Fellowship of the Ring', author: 'J.R.R. Tolkien', publish_year: '1954', page_count: 432, categories: ['Fantasy'], description: 'A young hobbit named Frodo Baggins inherits a mysterious ring and embarks on a perilous quest to destroy it.', stock: 7 },
  { isbn: '9780439708180', title: "Harry Potter and the Sorcerer's Stone", author: 'J.K. Rowling', publish_year: '1997', page_count: 309, categories: ['Fantasy', 'Children'], description: 'Harry Potter discovers he is a wizard and begins his education at Hogwarts School of Witchcraft and Wizardry.', stock: 10 },
  { isbn: '9780060512675', title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', publish_year: '1968', page_count: 197, categories: ['Fantasy'], description: 'A young boy with extraordinary magical gifts attends a school for wizards and must confront a terrible shadow creature.', stock: 3 },
  { isbn: '9780525559474', title: 'The Midnight Library', author: 'Matt Haig', publish_year: '2020', page_count: 304, categories: ['Fantasy', 'Romance'], description: 'Between life and death there is a library where every book provides a chance to try another life you could have lived.', stock: 0 },
  { isbn: '9780765326355', title: 'The Name of the Wind', author: 'Patrick Rothfuss', publish_year: '2007', page_count: 662, categories: ['Fantasy'], description: 'The tale of Kvothe, a legendary figure who recounts his life story to a chronicler over three days.', stock: 4 },

  // Finance
  { isbn: '9781612680194', title: 'Rich Dad Poor Dad', author: 'Robert T. Kiyosaki', publish_year: '1997', page_count: 336, categories: ['Finance'], description: 'Advocates financial independence and building wealth through investing, real estate, and starting businesses.', stock: 5 },
  { isbn: '9780062316110', title: 'The Psychology of Money', author: 'Morgan Housel', publish_year: '2020', page_count: 256, categories: ['Finance'], description: 'Timeless lessons on wealth, greed, and happiness exploring the strange ways people think about money.', stock: 8 },
  { isbn: '9780385737951', title: 'The Intelligent Investor', author: 'Benjamin Graham', publish_year: '1949', page_count: 640, categories: ['Finance'], description: 'The definitive book on value investing, teaching readers to develop long-term strategies and avoid common mistakes.', stock: 4 },
  { isbn: '9781591847816', title: 'Think and Grow Rich', author: 'Napoleon Hill', publish_year: '1937', page_count: 320, categories: ['Finance'], description: 'A personal development and self-improvement book based on Hill\'s study of successful individuals.', stock: 3 },

  // Biographies
  { isbn: '9781451648539', title: 'Steve Jobs', author: 'Walter Isaacson', publish_year: '2011', page_count: 656, categories: ['Biographies'], description: 'Based on more than forty interviews with Jobs, this biography covers his extraordinary career and personal life.', stock: 3 },
  { isbn: '9780743247535', title: 'Leonardo da Vinci', author: 'Walter Isaacson', publish_year: '2017', page_count: 624, categories: ['Biographies', 'Art'], description: 'A biography of history\'s most creative genius, drawing on thousands of pages from his notebooks.', stock: 2 },
  { isbn: '9780307277671', title: 'The Diary of a Young Girl', author: 'Anne Frank', publish_year: '1947', page_count: 283, categories: ['Biographies', 'History'], description: 'The diary kept by Anne Frank while in hiding with her family during the Nazi occupation of the Netherlands.', stock: 5 },
  { isbn: '9780743297332', title: 'Long Walk to Freedom', author: 'Nelson Mandela', publish_year: '1994', page_count: 656, categories: ['Biographies', 'History'], description: 'The autobiography of Nelson Mandela, from his childhood in rural South Africa to his presidency.', stock: 3 },

  // Recipes
  { isbn: '9781984825261', title: 'Salt, Fat, Acid, Heat', author: 'Samin Nosrat', publish_year: '2017', page_count: 480, categories: ['Recipes'], description: 'A visionary new master class in cooking that distills everything into just four elements.', stock: 4 },
  { isbn: '9780307476531', title: 'The Joy of Cooking', author: 'Irma S. Rombauer', publish_year: '1931', page_count: 1152, categories: ['Recipes'], description: 'An American institution and beloved cookbook with over 4,500 recipes for every occasion.', stock: 3 },
  { isbn: '9781607747109', title: 'Jerusalem', author: 'Yotam Ottolenghi', publish_year: '2012', page_count: 320, categories: ['Recipes'], description: 'A celebration of the culinary traditions of Jerusalem, featuring over 120 recipes from the city\'s diverse communities.', stock: 2 },

  // Romance
  { isbn: '9780141439518', title: 'Pride and Prejudice', author: 'Jane Austen', publish_year: '1813', page_count: 432, categories: ['Romance'], description: 'Elizabeth Bennet navigates issues of manners, upbringing, morality, and marriage in early 19th-century England.', stock: 6 },
  { isbn: '9780743273564', title: 'The Notebook', author: 'Nicholas Sparks', publish_year: '1996', page_count: 214, categories: ['Romance'], description: 'A story of enduring love between Noah and Allie, told through a notebook read to an elderly woman with dementia.', stock: 4 },
  { isbn: '9780316769174', title: 'The Catcher in the Rye', author: 'J.D. Salinger', publish_year: '1951', page_count: 277, categories: ['Romance'], description: 'Holden Caulfield\'s story of alienation and loss of innocence in New York City.', stock: 5 },
  { isbn: '9780385333481', title: 'Me Before You', author: 'Jojo Moyes', publish_year: '2012', page_count: 369, categories: ['Romance'], description: 'Louisa Clark takes a job caring for Will Traynor, a wealthy young banker left paralyzed after an accident.', stock: 4 },

  // Children
  { isbn: '9780064404990', title: "Charlotte's Web", author: 'E.B. White', publish_year: '1952', page_count: 192, categories: ['Children'], description: 'A spider named Charlotte saves her friend Wilbur the pig from being slaughtered by spinning words in her web.', stock: 5 },
  { isbn: '9780142410370', title: 'Matilda', author: 'Roald Dahl', publish_year: '1988', page_count: 240, categories: ['Children'], description: 'Matilda is a brilliant girl with telekinetic powers who must deal with her horrible parents and a tyrannical headmistress.', stock: 6 },
  { isbn: '9780060935467', title: 'Where the Wild Things Are', author: 'Maurice Sendak', publish_year: '1963', page_count: 48, categories: ['Children'], description: 'Max is sent to bed without supper and imagines sailing to a land of wild creatures where he becomes their king.', stock: 4 },
  { isbn: '9780439023481', title: 'The Hunger Games', author: 'Suzanne Collins', publish_year: '2008', page_count: 374, categories: ['Children', 'Science Fiction'], description: 'In a dystopian future, teenagers are forced to compete in a televised death match called the Hunger Games.', stock: 7 },

  // History
  { isbn: '9780062316097', title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', publish_year: '2011', page_count: 443, categories: ['History', 'Science'], description: 'A groundbreaking narrative of humanity\'s creation and evolution exploring the ways biology and history have defined us.', stock: 9 },
  { isbn: '9780143127741', title: 'Guns, Germs, and Steel', author: 'Jared Diamond', publish_year: '1997', page_count: 480, categories: ['History', 'Science'], description: 'An examination of why some civilizations came to dominate others, focusing on environmental and geographical factors.', stock: 4 },
  { isbn: '9780385490818', title: 'The Rise and Fall of the Third Reich', author: 'William L. Shirer', publish_year: '1960', page_count: 1280, categories: ['History'], description: 'A comprehensive history of Nazi Germany from its origins to its defeat in World War II.', stock: 2 },
  { isbn: '9780679720201', title: 'A People\'s History of the United States', author: 'Howard Zinn', publish_year: '1980', page_count: 729, categories: ['History'], description: 'American history told from the perspective of ordinary people rather than political and military leaders.', stock: 3 },

  // Medicine
  { isbn: '9780312430856', title: 'The Emperor of All Maladies', author: 'Siddhartha Mukherjee', publish_year: '2010', page_count: 592, categories: ['Medicine', 'Science'], description: 'A biography of cancer from its first documented appearances thousands of years ago through modern treatments.', stock: 3 },
  { isbn: '9780805073690', title: 'Being Mortal', author: 'Atul Gawande', publish_year: '2014', page_count: 282, categories: ['Medicine'], description: 'A surgeon examines how medicine can not only improve life but also the process of its ending.', stock: 4 },
  { isbn: '9781250301697', title: 'When Breath Becomes Air', author: 'Paul Kalanithi', publish_year: '2016', page_count: 228, categories: ['Medicine', 'Biographies'], description: 'A neurosurgeon\'s memoir written after being diagnosed with terminal lung cancer at age 36.', stock: 3 },

  // Religion
  { isbn: '9780060929527', title: 'Mere Christianity', author: 'C.S. Lewis', publish_year: '1952', page_count: 227, categories: ['Religion'], description: 'C.S. Lewis explores the common ground upon which all Christians stand together.', stock: 4 },
  { isbn: '9780060596316', title: 'The Power of Now', author: 'Eckhart Tolle', publish_year: '1997', page_count: 236, categories: ['Religion'], description: 'A guide to spiritual enlightenment that emphasizes the importance of living in the present moment.', stock: 5 },
  { isbn: '9780062515216', title: 'The Alchemist', author: 'Paulo Coelho', publish_year: '1988', page_count: 197, categories: ['Religion', 'Fantasy'], description: 'A young shepherd travels from Spain to Egypt in search of treasure and discovers the meaning of life.', stock: 8 },

  // Mystery
  { isbn: '9780062073488', title: 'Gone Girl', author: 'Gillian Flynn', publish_year: '2012', page_count: 422, categories: ['Mystery'], description: 'On their fifth wedding anniversary, Nick Dunne\'s wife Amy disappears, and he becomes the prime suspect.', stock: 5 },
  { isbn: '9780307474278', title: 'The Girl with the Dragon Tattoo', author: 'Stieg Larsson', publish_year: '2005', page_count: 672, categories: ['Mystery'], description: 'A disgraced journalist and a brilliant hacker investigate a decades-old disappearance within a wealthy Swedish family.', stock: 4 },
  { isbn: '9780425163498', title: 'In the Woods', author: 'Tana French', publish_year: '2007', page_count: 429, categories: ['Mystery'], description: 'A Dublin detective investigates a murder near the woods where he survived a childhood tragedy he cannot remember.', stock: 3 },
  { isbn: '9780316346627', title: 'Big Little Lies', author: 'Liane Moriarty', publish_year: '2014', page_count: 460, categories: ['Mystery', 'Romance'], description: 'Three women\'s lives unravel to the point of murder in this darkly comic tale of school politics and domestic abuse.', stock: 4 },

  // Music
  { isbn: '9781250301697', title: 'Just Kids', author: 'Patti Smith', publish_year: '2010', page_count: 304, categories: ['Music', 'Biographies'], description: 'Patti Smith\'s memoir of her relationship with photographer Robert Mapplethorpe in New York City.', stock: 3 },
  { isbn: '9780306821820', title: 'This Is Your Brain on Music', author: 'Daniel J. Levitin', publish_year: '2006', page_count: 322, categories: ['Music', 'Science'], description: 'A neuroscientist and record producer explores the relationship between music and the human brain.', stock: 3 },

  // Science
  { isbn: '9780553380163', title: 'A Brief History of Time', author: 'Stephen Hawking', publish_year: '1988', page_count: 212, categories: ['Science'], description: 'Stephen Hawking explores profound questions about the universe, from the Big Bang to black holes.', stock: 7 },
  { isbn: '9780393354492', title: 'The Gene: An Intimate History', author: 'Siddhartha Mukherjee', publish_year: '2016', page_count: 608, categories: ['Science', 'Medicine'], description: 'A sweeping history of the gene and genetic science, from Mendel\'s peas to CRISPR.', stock: 3 },
  { isbn: '9780393351590', title: 'The Sixth Extinction', author: 'Elizabeth Kolbert', publish_year: '2014', page_count: 319, categories: ['Science'], description: 'An account of the ongoing mass extinction of species caused by human activity.', stock: 4 },
  { isbn: '9780385472579', title: 'Cosmos', author: 'Carl Sagan', publish_year: '1980', page_count: 365, categories: ['Science'], description: 'Carl Sagan\'s personal voyage through the universe, exploring the origins of life and the nature of the cosmos.', stock: 5 },
]

async function downloadAllCovers(books) {
  console.log('Downloading cover images...')
  const results = []
  for (const book of books) {
    process.stdout.write(`  Downloading cover for "${book.title}"... `)
    const filename = await downloadCover(book.isbn)
    console.log(filename === 'default_cover.jpg' ? '(no cover, using default)' : '✓')
    results.push({ ...book, cover_image: filename })
  }
  return results
}

async function seed() {
  try {
    await mongoose.connect(process.env.DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    })
    console.log('Connected to MongoDB\n')

    // Ensure images directory exists
    const imagesDir = path.join(__dirname, 'public', 'images')
    if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true })

    const booksWithCovers = await downloadAllCovers(books)

    console.log('\nInserting books...')
    let inserted = 0
    let skipped = 0

    for (const book of booksWithCovers) {
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
