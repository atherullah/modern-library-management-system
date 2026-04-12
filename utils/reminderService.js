const BorrowHistory = require('../models/BorrowHistory');
const sendEmail = require('./sendEmail');

/**
 * Sends due-date reminder emails for books due today and tomorrow.
 * @returns {{ sent: number, failed: number }}
 */
const sendDueReminders = async () => {
  // Build date ranges for today and tomorrow (midnight-to-midnight)
  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  let sent = 0;
  let failed = 0;

  try {
    const borrows = await BorrowHistory.find({
      status: 'In Progress',
      return_date: { $gte: todayStart, $lte: tomorrowEnd },
    })
      .populate('borrowed_by')
      .populate('borrowed_book');

    for (const borrow of borrows) {
      // Guard against orphaned references
      if (!borrow.borrowed_by || !borrow.borrowed_book) continue;

      const returnDate = new Date(borrow.return_date);
      const isDueToday = returnDate >= todayStart && returnDate <= todayEnd;

      const when = isDueToday ? 'today' : 'tomorrow';
      const subject = isDueToday
        ? 'Reminder: Your borrowed book is due today'
        : 'Reminder: Your borrowed book is due tomorrow';

      const borrowDateStr  = borrow.borrow_date.toDateString();
      const returnDateStr  = borrow.return_date.toDateString();
      const userName       = borrow.borrowed_by.name;
      const bookTitle      = borrow.borrowed_book.title;
      const userEmail      = borrow.borrowed_by.email;

      const html = `
        <h2>Library Book Due Date Reminder</h2>
        <p>Dear ${userName},</p>
        <p>This is a reminder that the following book is due <strong>${when}</strong>:</p>
        <ul>
          <li><strong>Title:</strong> ${bookTitle}</li>
          <li><strong>Borrowed on:</strong> ${borrowDateStr}</li>
          <li><strong>Due date:</strong> ${returnDateStr}</li>
        </ul>
        <p>Please return the book to avoid any late fees.</p>
        <p>Thank you,<br/>Library Management Team</p>
      `;

      const message = `Dear ${userName},\n\nThis is a reminder that "${bookTitle}" is due ${when}.\nBorrowed on: ${borrowDateStr}\nDue date: ${returnDateStr}\n\nPlease return the book to avoid any late fees.\n\nThank you,\nLibrary Management Team`;

      try {
        await sendEmail({ email: userEmail, subject, message, html });
        sent++;
        console.log(`[ReminderService] Email sent to ${userEmail} for "${bookTitle}" (due ${when})`);
      } catch (emailErr) {
        failed++;
        console.error(`[ReminderService] Failed to send email to ${userEmail}:`, emailErr.message);
      }
    }
  } catch (err) {
    console.error('[ReminderService] Error querying borrow records:', err.message);
  }

  console.log(`[ReminderService] Done — sent: ${sent}, failed: ${failed}`);
  return { sent, failed };
};

module.exports = { sendDueReminders };
