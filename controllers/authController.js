const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/email"); // ⬅️ You need to create this utility
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
