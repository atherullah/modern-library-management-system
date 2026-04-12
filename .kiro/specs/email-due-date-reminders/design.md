# Design Document

## Overview

The feature adds a `utils/reminderService.js` module containing the core reminder logic, a `cron/reminderCron.js` script that schedules it via `setInterval`, and a manual-trigger route + controller action in the admin area. No new npm packages are required.

## Architecture

```
app.js  ──requires──►  cron/reminderCron.js
                              │
                              ▼
                   utils/reminderService.js
                    sendDueReminders()
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
             BorrowHistory           sendEmail()
             (mongoose)           (utils/sendEmail.js)

Admin Dashboard  ──POST /admin/reminders/send──►  adminController.send_reminders
                                                        │
                                                        ▼
                                             utils/reminderService.js
```

## Components

### `utils/reminderService.js`

Exports a single async function `sendDueReminders()`:

1. Compute `todayStart`, `todayEnd`, `tomorrowStart`, `tomorrowEnd` using plain `Date` arithmetic (no external library).
2. Query `BorrowHistory.find({ status: 'In Progress', return_date: { $gte: todayStart, $lte: tomorrowEnd } })` with `.populate('borrowed_by').populate('borrowed_book')`.
3. For each record determine whether it is Due_Today or Due_Tomorrow and call `sendEmail()` with the appropriate subject and HTML body.
4. Catch per-record errors, log them, and continue.
5. Return `{ sent, failed }` counts.

### `cron/reminderCron.js`

- Uses `setInterval` to fire `sendDueReminders()` every 24 hours.
- Runs once immediately on startup so the first check happens at launch.
- Designed to be `require()`d from `app.js`.

### Admin route & controller

- `POST /admin/reminders/send` → `adminController.send_reminders`
- Controller calls `sendDueReminders()`, flashes result, redirects to `/admin`.

### Admin dashboard view update

Adds a small form with a POST button to `views/admin/index.ejs`.

## Data Flow

```
setInterval (24h)
  └─► sendDueReminders()
        └─► BorrowHistory.find(status=InProgress, return_date in [today, tomorrow])
              └─► for each record
                    ├─► determine Due_Today / Due_Tomorrow
                    └─► sendEmail({ email, subject, html })
```

## Email Template

```html
<h2>Library Book Due Date Reminder</h2>
<p>Dear {name},</p>
<p>This is a reminder that the following book is due <strong>{today|tomorrow}</strong>:</p>
<ul>
  <li><strong>Title:</strong> {book.title}</li>
  <li><strong>Borrowed on:</strong> {borrow_date}</li>
  <li><strong>Due date:</strong> {return_date}</li>
</ul>
<p>Please return the book to avoid any late fees.</p>
```
