const Groq = require('groq-sdk')
const Book = require('../models/Book')

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const getChatResponse = async (userMessage, conversationHistory = []) => {
  // Fetch catalog snapshot to give the model context
  const books = await Book.find({}, 'title author categories stock isbn publish_year').limit(100)

  const catalogSummary = books.map(b =>
    `- "${b.title}" by ${b.author} | Genres: ${b.categories.join(', ')} | Stock: ${b.stock > 0 ? `${b.stock} available` : 'Out of stock'} | Year: ${b.publish_year}`
  ).join('\n')

  const systemPrompt = `You are a helpful library assistant for "My Library" — a library management system.
You help users find books, check availability, learn about genres, and understand library policies.

Current book catalog (${books.length} books):
${catalogSummary}

Library policies:
- Users must register and verify their email to borrow books
- Books can be reserved when out of stock
- Late returns incur a daily fine (configured by admin)
- Users can save books to their wishlist for later

Keep responses concise, friendly, and helpful. If asked about a book not in the catalog, say it's not currently available.
Do not make up book titles or authors that aren't in the catalog above.`

  // Build messages array for multi-turn conversation
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-10).map(msg => ({
      role: msg.role === 'model' ? 'assistant' : msg.role,
      content: msg.content
    })),
    { role: 'user', content: userMessage }
  ]

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    max_tokens: 512,
    temperature: 0.7,
  })

  return completion.choices[0].message.content
}

module.exports = { getChatResponse }
