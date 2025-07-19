const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/email");
const Product = require("./../models/mongo/productModel");

const prisma = new PrismaClient();

// Generate 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Signup with OTP
exports.registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing && !existing.isVerified) {
      await prisma.user.delete({ where: { email } }); // Remove old unverified user
    } else if (existing && existing.isVerified) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        otp,
        otpExpires,
        role,
      },
    });

    // const html = `<p>Your OTP is: <b>${otp}</b>. It expires in 10 minutes.</p>`; // Or use your HTML email
    const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>OTO Verify</title>

  <!-- Web Font / @font-face : BEGIN -->
  <!--[if mso]>
    <style>
      * {
        font-family: 'Roboto', sans-serif !important;
      }
    </style>
  <![endif]-->

  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css?family=Roboto:400,600" rel="stylesheet" type="text/css">
  <!--<![endif]-->

  <style>
    html,
    body {
      margin: 0 auto !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      font-family: 'Roboto', sans-serif !important;
      font-size: 14px;
      margin-bottom: 10px;
      line-height: 24px;
      color: #8094ae;
      font-weight: 400;
    }

    * {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
      margin: 0;
      padding: 0;
    }

    table,
    td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }

    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      margin: 0 auto !important;
    }

    table table table {
      table-layout: auto;
    }

    a {
      text-decoration: none;
    }

    img {
      -ms-interpolation-mode: bicubic;
    }
  </style>
</head>

<body width="100%" style="margin: 0; padding: 0 !important; background-color: #f5f6fa; mso-line-height-rule: exactly;">

  <!-- Start Preheader -->
  <div class="preheader"
    style="display: none; max-width: 0; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
    Verify OTP for sign-up.
  </div>
  <!-- End Preheader -->

  <center style="width: 100%; background-color: #f5f6fa;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f5f6fa">
      <tr>
        <td style="padding: 40px 0;">

          <!-- Logo Section -->
          <table style="width:100%;max-width:620px;margin:0 auto;">
            <tr>
              <td style="text-align: center; padding-bottom:25px">
                <a href="#">
                  <h2>eCommerce</h3>
                </a>
              </td>
            </tr>
          </table>

          <!-- Main Content Section -->
          <table style="width:100%;max-width:620px;margin:0 auto;background-color:#ffffff;">
            <tr>
              <td style="text-align:center;padding: 30px 30px 15px 30px;">
                <h2 style="font-size: 18px; color: #6576ff; font-weight: 600; margin: 0;">Verify your email</h2>
              </td>
            </tr>
            <tr>
              <td style="text-align:center;padding: 0 30px 20px">

                <p style="margin-bottom: 25px;">Copy the OTP below to complete your verification.</p>
               <p style="font-size: 24px; font-weight: 600; color: #6576ff;">${otp}</p>
              </td>
            </tr>
            <tr>
              <td style="text-align:center;padding: 20px 30px 40px">
                <p>If you did not request this, please contact us or ignore this message.</p>
                <p style="margin: 0; font-size: 13px; line-height: 22px; color:#9ea8bb;">
                  This is an automatically generated email. Please do not reply to this email. If you face any issues,
                  please contact us at
                  <a href="mailto:sahuprakash643@gmail.com" style="color: #6576ff;">sahuprakash643@gmail.com</a>
                </p>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <table style="width:100%;max-width:620px;margin:0 auto;">
            <tr>
              <td style="text-align: center; padding:25px 20px 0;">
                <p style="font-size: 13px;">
                  Copyright © 2025 eCommerce. All rights reserved.

                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </center>
</body>

</html>
`;

    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      html,
    });

    res.status(201).json({
      status: "success",
      message: "OTP sent to your email for verification",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error during registration", error: err });
  }
};

// Verify OTP
exports.verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const userDoc = await prisma.user.findFirst({
      where: {
        email,
        otp,
        otpExpires: { gt: new Date() },
      },
    });

    if (!userDoc) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userDoc.id },
      data: {
        isVerified: true,
        otp: null,
        otpExpires: null,
      },
    });

    const token = jwt.sign({ id: updatedUser.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Verification error", error: err });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check if user exists
    const userDoc = await prisma.user.findUnique({ where: { email } });

    if (!userDoc) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 2. Check if user is verified
    if (!userDoc.isVerified) {
      return res
        .status(401)
        .json({ message: "Please verify your email before logging in" });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, userDoc.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 4. Create JWT
    const token = jwt.sign({ id: userDoc.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // 5. Respond with user info and token
    res.status(200).json({
      status: "success",
      token,
      data: {
        user: userDoc,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed", error: err });
  }
};

// const prisma = require("../prisma"); // adjust path to your prisma client

exports.getMe = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    const userDoc = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        cart: true,
      },
    });

    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    //     data: {
    //   user: req.user, // user is already set in protect middleware
    // },

    // Step 2: Fetch MongoDB product details
    const productIds = userDoc.cart.map((item) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    // Step 3: Merge product details into cart items
    const enrichedCart = userDoc.cart.map((item) => {
      const product = products.find((p) => p._id.toString() === item.productId);
      return {
        ...item,
        product, // null if not found
        name: product.name,
      };
    });

    // Step 4: Return user with enriched cart
    res.status(200).json({
      status: "success",
      data: {
        user: {
          ...userDoc,
          cart: enrichedCart, // now includes product info
        },
      },
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
      error: error.message,
    });
  }
};
