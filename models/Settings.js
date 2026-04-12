const mongoose = require('mongoose')

// Single-document settings store — always upsert with key 'global'
const settingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },
  fine_per_day: { type: Number, default: 1.00 },
  currency_symbol: { type: String, default: '$' },
  currency_name: { type: String, default: 'USD' },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

settingsSchema.statics.getGlobal = async function () {
  let settings = await this.findOne({ key: 'global' })
  if (!settings) {
    settings = await this.create({ key: 'global' })
  }
  return settings
}

module.exports = mongoose.model('Settings', settingsSchema)
