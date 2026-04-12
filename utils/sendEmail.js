const nodemailer = require('nodemailer')

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Library System <noreply@library.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  }

  const info = await transporter.sendMail(mailOptions)
  console.log('Email sent: %s', info.messageId)
  return info
}

module.exports = sendEmail
