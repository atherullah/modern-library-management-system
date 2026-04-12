# Requirements Document

## Introduction

The Email Due Date Reminders feature automatically notifies library members via email when their borrowed books are approaching or have reached their return date. A scheduled job runs daily to send reminders for books due tomorrow and books due today. Admins can also trigger reminders manually from the dashboard.

## Glossary

- **Reminder_Service**: The scheduled job responsible for querying overdue/upcoming borrows and dispatching reminder emails.
- **BorrowHistory**: The MongoDB document tracking a single borrow transaction, including the borrower, book, borrow date, return date, and status.
- **Active_Borrow**: A BorrowHistory record with `status` equal to `"In Progress"`.
- **Due_Tomorrow**: An Active_Borrow whose `return_date` falls on the calendar day after the current date.
- **Due_Today**: An Active_Borrow whose `return_date` falls on the current calendar day.
- **Admin**: A user with `role` equal to `0` who has access to the admin dashboard.

## Requirements

### Requirement 1: Daily Reminder Schedule

**User Story:** As a library administrator, I want the system to automatically send due date reminder emails every day, so that members are notified without manual intervention.

#### Acceptance Criteria

1. THE Reminder_Service SHALL execute once every 24 hours at a configurable time (default: 08:00 AM server time).
2. WHEN the Reminder_Service executes, THE Reminder_Service SHALL query all Active_Borrows whose `return_date` falls on Due_Tomorrow or Due_Today.
3. WHILE the Reminder_Service is running, THE Reminder_Service SHALL process each qualifying BorrowHistory record and send one email per record.

### Requirement 2: Due-Tomorrow Email

**User Story:** As a library member, I want to receive an email reminder the day before my book is due, so that I have time to return it on time.

#### Acceptance Criteria

1. WHEN a Due_Tomorrow Active_Borrow is found, THE Reminder_Service SHALL send an email to the borrower's registered email address.
2. THE Reminder_Service SHALL include the book title, borrow date, and return date in the Due_Tomorrow email body.
3. THE Reminder_Service SHALL use the subject line "Reminder: Your borrowed book is due tomorrow" for Due_Tomorrow emails.

### Requirement 3: Due-Today Email

**User Story:** As a library member, I want to receive an email reminder on the day my book is due, so that I remember to return it before the library closes.

#### Acceptance Criteria

1. WHEN a Due_Today Active_Borrow is found, THE Reminder_Service SHALL send an email to the borrower's registered email address.
2. THE Reminder_Service SHALL include the book title, borrow date, and return date in the Due_Today email body.
3. THE Reminder_Service SHALL use the subject line "Reminder: Your borrowed book is due today" for Due_Today emails.

### Requirement 4: Admin Manual Trigger

**User Story:** As an admin, I want to manually trigger the reminder job from the dashboard, so that I can send reminders outside the scheduled window if needed.

#### Acceptance Criteria

1. THE Admin dashboard SHALL display a "Send Due Date Reminders" button.
2. WHEN the Admin clicks the "Send Due Date Reminders" button, THE Reminder_Service SHALL execute the same reminder logic as the scheduled job.
3. WHEN the manual trigger completes, THE Admin dashboard SHALL display a flash message indicating how many reminder emails were sent.
4. IF an error occurs during the manual trigger, THEN THE Admin dashboard SHALL display a flash message describing the failure.

### Requirement 5: Error Handling

**User Story:** As a library administrator, I want email failures to be logged without stopping the entire job, so that one bad address does not prevent other members from receiving reminders.

#### Acceptance Criteria

1. IF sending an individual reminder email fails, THEN THE Reminder_Service SHALL log the error and continue processing remaining records.
2. THE Reminder_Service SHALL log a summary of sent and failed emails after each execution.
