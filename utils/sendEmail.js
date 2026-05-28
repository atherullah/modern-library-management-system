const nodemailer = require('nodemailer')

/**
 * Utility to send emails via SMTP or automatic Ethereal Sandbox fallback.
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Text version of email
 * @param {string} options.html - HTML version of email (recommended)
 */
const sendEmail = async (options) => {
  // Check if standard SMTP settings are configured in environment variables
  const isConfigured = 
    process.env.EMAIL_USER && 
    process.env.EMAIL_USER !== 'your@gmail.com' &&
    process.env.EMAIL_PASS && 
    process.env.EMAIL_PASS !== 'your-gmail-app-password';

  let transporter;

  if (isConfigured) {
    const port = parseInt(process.env.EMAIL_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: port,
      secure: port === 465, // SSL (port 465) needs secure: true. TLS (port 587) needs secure: false.
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        // Prevent connection failures due to self-signed certificates
        rejectUnauthorized: false
      }
    });
  } else {
    // Dynamic fallback to Ethereal sandbox (100% free, zero-config test mailboxes)
    console.log('\n\x1b[33m%s\x1b[0m', '[Email] No custom SMTP credentials configured in .env. Creating a temporary Ethereal.email sandbox account...');
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (testAccountErr) {
      console.error('\x1b[31m%s\x1b[0m', '[Email] Failed to create Ethereal test account (Check internet connection):', testAccountErr.message);
      throw testAccountErr;
    }
  }

  // Construct mail parameters
  const mailOptions = {
    from: isConfigured 
      ? (process.env.EMAIL_FROM || `Library Portal <${process.env.EMAIL_USER}>`)
      : 'Library Portal Sandbox <noreply@library.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  }

  // Send the email
  const info = await transporter.sendMail(mailOptions);

  // Print results
  if (isConfigured) {
    console.log('\x1b[32m%s\x1b[0m', `[Email] Success! Real email delivered to <${options.email}> via SMTP. (ID: ${info.messageId})`);
  } else {
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('\x1b[36m%s\x1b[0m', `[Email] Sandbox success! Sent email to <${options.email}>.`);
    if (previewUrl) {
      console.log('\x1b[36m%s\x1b[0m', `👉 CLICK TO VIEW STYLED EMAIL PREVIEW: ${previewUrl}`);
    }
  }

  return info;
}

module.exports = sendEmail
