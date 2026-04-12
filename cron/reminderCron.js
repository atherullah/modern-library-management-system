const { sendDueReminders } = require('../utils/reminderService');

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

const startReminderCron = () => {
  console.log('[ReminderCron] Starting due-date reminder scheduler (every 24 hours)');

  // Run once immediately on startup
  sendDueReminders().catch(err =>
    console.error('[ReminderCron] Initial run error:', err.message)
  );

  // Then repeat every 24 hours
  setInterval(() => {
    sendDueReminders().catch(err =>
      console.error('[ReminderCron] Scheduled run error:', err.message)
    );
  }, INTERVAL_MS);
};

module.exports = { startReminderCron };
