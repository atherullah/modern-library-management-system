const AuditLog = require('../models/AuditLog')

/**
 * Log an admin action.
 * @param {Object} adminUser - The admin user object (must have _id/id and name)
 * @param {string} action    - Action code e.g. 'ADD_BOOK'
 * @param {string} entity    - Entity type e.g. 'Book'
 * @param {string} entity_id - ID of affected document (optional)
 * @param {string} description - Human-readable summary
 * @param {string} ip        - Request IP (optional)
 */
const logAction = async (adminUser, action, entity, entity_id, description, ip) => {
  try {
    if (!adminUser) return
    await AuditLog.create({
      admin: adminUser._id || adminUser.id,
      admin_name: adminUser.name,
      action,
      entity,
      entity_id: entity_id ? String(entity_id) : undefined,
      description,
      ip,
    })
  } catch (err) {
    console.error('[Audit] Failed to log action:', err.message)
  }
}

module.exports = { logAction }
