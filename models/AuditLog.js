const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  admin_name: { type: String, required: true },  // denormalized for display even if user deleted
  action: { type: String, required: true },       // e.g. 'ADD_BOOK', 'DELETE_BOOK'
  entity: { type: String },                       // e.g. 'Book', 'User', 'Settings'
  entity_id: { type: String },                    // ID of affected document
  description: { type: String },                  // human-readable summary
  ip: { type: String },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
})

module.exports = mongoose.model('AuditLog', auditLogSchema)
