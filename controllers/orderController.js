const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");
const Product = require("../models/mongo/productModel"); // MongoDB model
const prisma = new PrismaClient();

exports.createOrder = async (req, res) => {
  try {
    // 1. Verify token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // 2. Get cart items from PostgreSQL
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
    });

    if (cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 3. Extract MongoDB product IDs
    const mongoProductIds = cartItems.map((item) => item.productId);

    // 4. Fetch product details from MongoDB
    const products = await Product.find({
      _id: { $in: mongoProductIds },
    });

    if (products.length !== cartItems.length) {
      return res.status(400).json({ message: "Some products not found" });
    }

    // 5. Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => {
      return sum + item.discountedPrice * item.quantity;
    }, 0);

    // 6. Create the order in PostgreSQL
    const order = await prisma.order.create({
      data: {
        userId,
        productIds: mongoProductIds,
        totalAmount,
        productDetails: products.map((p) => ({
          _id: p._id,
          name: p.name,
          price: p.price,
          images: p.images,
        })),
      },
    });

    // 7. Clear the cart
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
