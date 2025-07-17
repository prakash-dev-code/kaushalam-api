const nodemailer = require("nodemailer");

const sendEmail = async (props) => {

  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    // process.env.NODE_ENV === "production"
    //   ? "sandbox.smtp.mailtrap.io"
    //   : "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.SMTP_USER_NAME, // Update this for puction
      pass: process.env.SMTP_USER_PASSWORD, // Update this for production
    },
    secure: false,
    tls: {
      rejectUnauthorized: false, // Do not reject unauthorized TLS certificates
    },
    connectionTimeout: 100000,
  });

  const mailOptions = {
    // from: "<sahuprakash643@gmail.com>",
    from: "<sahuprakash643@gmail.com>",
    to: props.to,
    // to: props.email,
    subject: props.subject,
    text: props.text,
    html: props.html,
  };

  try {
    // console.log(process.env.NODE_ENV, "E");
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.response); // Log the response from the SMTP server
    return info;
  } catch (error) {
    console.log("Error sending email: " + error);
    throw error;
  }
};

module.exports = sendEmail;
