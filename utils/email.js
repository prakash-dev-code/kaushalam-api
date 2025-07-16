const nodemailer = require("nodemailer");

const sendEmail = async (props) => {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    // process.env.NODE_ENV === "production"
    //   ? "smtp-relay.brevo.com"
    //   : "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.SMTP_PROD_USER, // Update this for production
      pass: process.env.SMTP_PROD_PASS, // Update this for production
    },
    secure: false,
    tls: {
      rejectUnauthorized: false, // Do not reject unauthorized TLS certificates
    },
    connectionTimeout: 100000,
  });

  const mailOptions = {
    from: "sahuprakash643@gmail.com",
    to: props.email,
    subject: props.subject,
    text: props.text,
    html: props.html,
  };

  try {
    console.log(process.env.NODE_ENV, "E");
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.response); // Log the response from the SMTP server
    return info;
  } catch (error) {
    console.log("Error sending email: " + error);
    throw error;
  }
};

module.exports = sendEmail;
