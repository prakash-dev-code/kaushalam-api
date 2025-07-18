const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const Product = require("../models/mongo/productModel"); // MongoDB model
const prisma = new PrismaClient();

exports.createOrder = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const mongoProductIds = cartItems.map((item) => item.productId);

    const products = await Product.find({
      _id: { $in: mongoProductIds },
    });

    if (products.length !== cartItems.length) {
      return res.status(400).json({ message: "Some products not found" });
    }

    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + item.discountedPrice * item.quantity;
    }, 0);

    const order = await prisma.order.create({
      data: {
        userId,
        productIds: mongoProductIds,
        totalAmount,
        status: "processing",
        productDetails: products.map((p) => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          images: p.images,
        })),
      },
    });

    await prisma.cartItem.deleteMany({
      where: { userId },
    });

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
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

    const orders = await prisma.order.findMany({
      where: {
        userId: decoded.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      status: "success",
      results: orders.length,
      data: { doc: orders },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
      error: error.message,
    });
  }
};

exports.getAllUsersForAdmin = async (req, res) => {
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

    // 🔐 Check if the user is an admin
    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Forbidden: Admins only can access this resource" });
    }

    // ✅ Pagination & search query
    const { page = 1, limit = 10, name = "" } = req.query;

    const currentPage = parseInt(page);
    const pageSize = parseInt(limit);

    const filters = {};

    if (name) {
      filters.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    const totalCount = await prisma.order.count({
      where: filters,
    });

    const doc = await prisma.order.findMany({
      where: filters,
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      status: "success",
      totalCount,
      currentPage,
      totalPages: Math.ceil(totalCount / pageSize),
      data: { doc },
    });
  } catch (error) {
    console.error("Error fetching users for admin:", error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong",
      error: error.message,
    });
  }
};
