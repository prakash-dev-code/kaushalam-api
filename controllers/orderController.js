const Order = require("../models/mongo/orderModel");
const User = require("../models/mongo/userModel");
const Factory = require("./handleCrud");

// exports.getAllOrdersAdmin = Factory.getAll(Order);
exports.updateOrder = Factory.updateOne(Order);
exports.deleteOrder = Factory.deleteOne(Order);
exports.getOrder = Factory.getOne(Order);

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, status, price } = req.body;

    // Validate
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order items are required" });
    }

    if (
      !shippingAddress ||
      !shippingAddress.address ||
      !shippingAddress.phone
    ) {
      return res.status(400).json({ message: "Shipping address is required" });
    }

    const newOrder = await Order.create({
      user: req.user._id,
      items,
      shippingAddress,
      status,
      price,
    });

    res.status(201).json({
      status: "success",
      data: newOrder,
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// const Order = require("../models/orderModel");
// const User = require("../models/userModel");

exports.getAllOrders = async (req, res) => {
  try {
    // req.user is set from your protect middleware (auth)
    const userId = req.user.id;

    // Get user to check role
    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "User not found",
      });
    }

    let orders;

    if (user.role === "admin") {
      // Admin gets all orders
      orders = await Order.find({})
        .populate("user", "name email photo")
        .populate("items.product", "name images");
    } else {
      // Normal user gets only their orders
      orders = await Order.find({ user: userId })
        .populate("user", "name email photo")
        .populate("items.product", "name images");
    }

    res.status(200).json({
      status: "success",
      result: orders.length,
      data: {
        doc: orders,
      },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};
