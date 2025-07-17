const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/email"); // ⬅️ You need to create this utility

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

    const html = `<p>Your OTP is: <b>${otp}</b>. It expires in 10 minutes.</p>`; // Or use your HTML email

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

    await prisma.user.update({
      where: { id: userDoc.id },
      data: {
        isVerified: true,
        otp: null,
        otpExpires: null,
      },
    });

    const token = jwt.sign({ id: userDoc.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    console.log(userDoc, "UD");

    res.status(200).json({
      status: "success",
      token,
      data: {
        user: userDoc,
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
