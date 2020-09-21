import nodemailer from "nodemailer";

// async..await is not allowed in global scope, must use a wrapper
export async function sendEmail() {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  let testAccount = await nodemailer.createTestAccount();

  console.log(testAccount)

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: "fzqe73jm7ncz2aqb@ethereal.email", // generated ethereal user
      pass: "Ps3AZQC7xgHXfFpcsA", // generated ethereal password
    },
  });

//   {
//     user: 'fzqe73jm7ncz2aqb@ethereal.email',
//     pass: 'Ps3AZQC7xgHXfFpcsA',
//     smtp: { host: 'smtp.ethereal.email', port: 587, secure: false },
//     imap: { host: 'imap.ethereal.email', port: 993, secure: true },
//     pop3: { host: 'pop3.ethereal.email', port: 995, secure: true },
//     web: 'https://ethereal.email'
//   }

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to: "n31disou@gmail.com, nyck951@yahoo.com.hk", // list of receivers
    subject: "Forget Password - OTL IOB App", // Subject line
    text: "Your new password is, please chnage the password after login", // plain text body
    html: "<b>This is your new password, please chnage the password after login</b>", // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}