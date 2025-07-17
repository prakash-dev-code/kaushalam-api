// const User = require("../models/mongo/userModel");
const Factory = require("./handleCrud");
const Product = require("../models/mongo/productModel");
const mongoose = require("mongoose");
// here
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const prisma = new PrismaClient();
const User = prisma.user;

exports.getAllUsers = async (req, res) => {
  try {
    const doc = await prisma.user.findMany();

    res.status(200).json({
      status: "success",
      totalCount: doc.length,
      data: {
        doc,
      },
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch users",
      error: err.message,
    });
  }
};

// exports.updateUser = Factory.updateOne(User);
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;
  console.log(userId, "ID");

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }, // 👈 convert to number if id is Int in PostgreSQL
    });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to delete user",
      error: err.message,
    });
  }
};

// exports.getUser = Factory.getOne(User);

exports.addToCart = async (req, res) => {
  try {
    // const { productId, quantity, discountedPrice } = req.body;

    const { productId } = req.body;
    const quantity = Number(req.body.quantity);
    const discountedPrice = Number(req.body.discountedPrice);

    if (!productId || isNaN(quantity) || isNaN(discountedPrice)) {
      return res.status(400).json({ message: "Missing or invalid fields" });
    }

    const user = await User.findById(req.user._id);

    const existingIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingIndex !== -1) {
      user.cart[existingIndex].quantity += quantity;
      user.cart[existingIndex].discountedPrice = discountedPrice; // ✅ Fix
    } else {
      if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      user.cart.push({
        product: new mongoose.Types.ObjectId(productId),
        quantity,
        discountedPrice,
      });
    }

    await user.save();

    await user.populate({
      path: "cart.product",
      select: "name price images stock",
    });

    res.status(200).json({ message: "Cart updated", cart: user.cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid or missing product ID" });
    }

    const user = await User.findById(req.user._id);

    const initialCartLength = user.cart.length;

    // Filter out the item to be removed
    user.cart = user.cart.filter(
      (item) => item.product.toString() !== productId
    );

    if (user.cart.length === initialCartLength) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    await user.save();

    await user.populate({
      path: "cart.product",
      select: "name price images stock",
    });

    res
      .status(200)
      .json({ message: "Item removed from cart", cart: user.cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.cart = []; // Clear all items

    await user.save();

    res.status(200).json({ message: "Cart cleared", cart: user.cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  const { userId } = req.params;
  const { name, shippingLocation, shippingPhone } = req.body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        shippingLocation,
        shippingPhone,
      },
    });

    res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({
      status: "error",
      message: "Failed to update user",
      error: err.message,
    });
  }
};
