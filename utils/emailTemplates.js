/**
 * Premium HTML Email Templates for Ather's Library Portal
 */

const getHtmlWrapper = (title, content, preheaderText = '') => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      background-color: #f8fafc;
      -webkit-font-smoothing: antialiased;
      -text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
      display: block;
    }
    p, h1, h2, h3 {
      margin: 0;
    }
    @media screen and (max-width: 600px) {
      .container {
        width: 100% !important;
        max-width: 100% !important;
        padding: 10px !important;
      }
      .content-body {
        padding: 24px 16px !important;
      }
    }
  </style>
</head>
<body style="background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; width: 100%;">
  <!-- Preheader text (hidden in body but shown in inbox preview) -->
  <div style="display: none; max-height: 0px; overflow: hidden;">
    ${preheaderText}
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; width: 100%;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="container" style="max-width: 600px; width: 100%;">
          
          <!-- BRAND LOGO / HEADER -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color: #0f172a; padding: 12px 24px; border-radius: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <span style="font-size: 20px; font-weight: 800; letter-spacing: 1px; color: #ffffff; text-transform: uppercase;">
                      📚 Library Portal
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD CONTENT -->
          <tr>
            <td class="content-body" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                
                <!-- Title Header -->
                <tr>
                  <td align="center" style="padding-bottom: 28px; border-bottom: 1px solid #f1f5f9;">
                    <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; line-height: 1.3; text-align: center;">
                      ${title}
                    </h1>
                  </td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding-top: 28px; color: #334155; font-size: 16px; line-height: 1.6;">
                    ${content}
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding-top: 32px; color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">
              <p style="margin-bottom: 8px;">
                This email was sent by the automated system at <strong>Ather's Library Portal</strong>.
              </p>
              <p style="margin-bottom: 16px;">
                &copy; ${new Date().getFullYear()} Ather's Library Portal. All rights reserved.
              </p>
              <p style="font-size: 11px; color: #94a3b8;">
                Please do not reply directly to this email as the inbox is unmonitored.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * Generates verification template HTML
 */
const getVerificationTemplate = (name, verifyUrl) => {
  const content = `
    <p style="margin-bottom: 16px;">Hello <strong style="color: #0f172a;">${name}</strong>,</p>
    <p style="margin-bottom: 20px;">
      Welcome to <strong>Ather's Library Portal</strong>! We are absolutely thrilled to have you join our reading community.
    </p>
    <p style="margin-bottom: 24px;">
      To complete your registration and start exploring, borrowing, and reviewing our vast catalog of books, please verify your email address by clicking the secure button below:
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
      <tr>
        <td align="center">
          <a href="${verifyUrl}" target="_blank" style="background-color: #4f46e5; border-radius: 8px; color: #ffffff; display: inline-block; font-size: 15px; font-weight: 600; line-height: 48px; text-align: center; text-decoration: none; width: 220px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1);">
            Verify Email Address
          </a>
        </td>
      </tr>
    </table>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="font-size: 13px; color: #64748b; margin-bottom: 8px; font-weight: 500;">
        Button not working? Copy and paste this URL into your browser:
      </p>
      <p style="font-size: 13px; margin: 0; word-break: break-all;">
        <a href="${verifyUrl}" target="_blank" style="color: #4f46e5; text-decoration: none;">${verifyUrl}</a>
      </p>
    </div>
    <p style="font-size: 14px; color: #64748b; margin: 0;">
      If you did not request this registration, you can safely ignore this email; no account will be activated without verification.
    </p>
  `;
  return getHtmlWrapper('Verify Your Email Address', content, 'Welcome to the Library Portal! Click to verify your email.');
};

/**
 * Generates password reset template HTML
 */
const getPasswordResetTemplate = (name, resetUrl) => {
  const content = `
    <p style="margin-bottom: 16px;">Hello <strong style="color: #0f172a;">${name}</strong>,</p>
    <p style="margin-bottom: 20px;">
      We received a request to reset the password for your account associated with this email address. 
    </p>
    <p style="margin-bottom: 24px;">
      Click the secure button below to choose a new password. Please note that this link is only valid for **10 minutes** for security purposes:
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
      <tr>
        <td align="center">
          <a href="${resetUrl}" target="_blank" style="background-color: #4f46e5; border-radius: 8px; color: #ffffff; display: inline-block; font-size: 15px; font-weight: 600; line-height: 48px; text-align: center; text-decoration: none; width: 220px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1);">
            Reset Password
          </a>
        </td>
      </tr>
    </table>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="font-size: 13px; color: #64748b; margin-bottom: 8px; font-weight: 500;">
        Button not working? Copy and paste this URL into your browser:
      </p>
      <p style="font-size: 13px; margin: 0; word-break: break-all;">
        <a href="${resetUrl}" target="_blank" style="color: #4f46e5; text-decoration: none;">${resetUrl}</a>
      </p>
    </div>
    <p style="font-size: 14px; color: #64748b; margin: 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
      ⚠️ <strong>Security Notice:</strong> If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged and secure.
    </p>
  `;
  return getHtmlWrapper('Reset Your Password', content, 'Request to reset your library portal password.');
};

/**
 * Generates book due date reminder template HTML
 */
const getDueReminderTemplate = (name, bookTitle, borrowDate, dueDate, when) => {
  const isDueToday = when === 'today';
  const alertColor = isDueToday ? '#dc2626' : '#d97706'; // Red for today, Amber for tomorrow
  const alertBg = isDueToday ? '#fef2f2' : '#fffbeb'; // Light red or light amber
  const alertBorder = isDueToday ? '#fecaca' : '#fef3c7';

  const content = `
    <p style="margin-bottom: 16px;">Hello <strong style="color: #0f172a;">${name}</strong>,</p>
    <p style="margin-bottom: 20px;">
      This is a friendly notification from <strong>Ather's Library Portal</strong> regarding a book you currently have borrowed.
    </p>
    
    <div style="background-color: ${alertBg}; border: 1px solid ${alertBorder}; border-left: 5px solid ${alertColor}; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <h3 style="color: ${alertColor}; font-size: 16px; font-weight: 700; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
        ⚠️ Book Due ${when.toUpperCase()}
      </h3>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; line-height: 1.5; color: #334155;">
        <tr>
          <td style="padding: 4px 0; font-weight: 600; width: 120px;" valign="top">Book Title:</td>
          <td style="padding: 4px 0; color: #0f172a;" valign="top"><strong>${bookTitle}</strong></td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-weight: 600;" valign="top">Borrowed On:</td>
          <td style="padding: 4px 0;" valign="top">${borrowDate}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-weight: 600; color: ${alertColor};" valign="top">Due Date:</td>
          <td style="padding: 4px 0; font-weight: 700; color: ${alertColor};" valign="top">${dueDate} (${when})</td>
        </tr>
      </table>
    </div>

    <p style="margin-bottom: 20px;">
      Please plan to return the book to the library desk ${when} during operating hours to avoid potential late fees or borrowing restrictions.
    </p>
    <p style="margin-bottom: 24px; font-size: 14px; color: #64748b;">
      If you require more time, you can log in to your portal account to see if this book is eligible for a renewal, or consult library staff.
    </p>
    <div style="border-top: 1px solid #f1f5f9; padding-top: 16px;">
      <p style="font-size: 14px; margin: 0; color: #64748b;">
        Thank you for helping us keep our books circulating for all readers!
      </p>
    </div>
  `;
  return getHtmlWrapper('Book Return Reminder', content, `Your borrowed book is due ${when}.`);
};

module.exports = {
  getVerificationTemplate,
  getPasswordResetTemplate,
  getDueReminderTemplate
};
