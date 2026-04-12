const express = require('express')
const adminController = require('../controllers/adminController')
const { bookValidator } = require('../middlewares/bookMiddleware')
const { checkUser } = require('../middlewares/authMiddleware')

const router = express.Router()

// Dashboard
router.get('/', adminController.admin_dashboard)

// Manage Book
router.get('/book/add', adminController.add_book_view)
router.post('/book/import', adminController.import_books)
router.get('/book/detail/:id', adminController.detail_book)
router.post('/book', checkUser, bookValidator, adminController.add_book)
router.get('/book/update/:id', adminController.update_book_view)
router.put('/book', checkUser, bookValidator, adminController.update_book)
router.delete('/book', adminController.delete_book)
router.get('/book/:page?', adminController.books)

// View Orders
router.get('/orders', adminController.view_orders)

// View Users
router.get('/users', adminController.view_users)

// View Fines
router.get('/fines', adminController.view_fines)
router.post('/fines/pay', adminController.mark_fine_paid)

// Reports
router.get('/reports', adminController.view_reports)
router.get('/reports/export/csv', adminController.export_csv)

// Audit Logs
router.get('/audit-logs', adminController.view_audit_logs)

// Settings
router.get('/settings', adminController.view_settings)
router.post('/settings', adminController.update_settings)

// Email Reminders
router.post('/reminders/send', adminController.send_reminders)

module.exports = router