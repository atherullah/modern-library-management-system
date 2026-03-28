const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Use Ethereal for testing - creates a test account on the fly
  let testAccount = await nodemailer.createTestAccount();

  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  // Define email options
  const mailOptions = {
    from: 'Library Admin <noreply@library.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // Send the email
  const info = await transporter.sendMail(mailOptions);
  
  console.log('Message sent: %s', info.messageId);
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  
  return info;
};

module.exports = sendEmail;
