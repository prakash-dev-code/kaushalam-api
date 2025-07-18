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
    const { page = 1, limit = 10, name = "" } = req.query;

    const currentPage = parseInt(page);
    const pageSize = parseInt(limit);

    const filters = {};

    // If name query exists, add filter using "contains" for case-insensitive search
    if (name) {
      filters.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    // Get total count of users matching the filter
    const totalCount = await prisma.user.count({
      where: filters,
    });

    const doc = await prisma.user.findMany({
      where: filters,
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      orderBy: {
        joinedAt: "desc",
      },
    });

    res.status(200).json({
      status: "success",
      totalCount,
      currentPage,
      totalPages: Math.ceil(totalCount / pageSize),
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

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity, discountedPrice } = req.body;
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
      // remove `select` to get all fields
    });

    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }
    const userId = userDoc.id; // assuming `req.user` is populated by auth middleware

    if (!productId || isNaN(quantity) || isNaN(discountedPrice)) {
      return res.status(400).json({ message: "Missing or invalid fields" });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    let updatedItem;
    if (existingItem) {
      updatedItem = await prisma.cartItem.update({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
        data: {
          quantity: existingItem.quantity + Number(quantity),
          discountedPrice: Number(discountedPrice),
        },
      });
    } else {
      // Create new cart item
      updatedItem = await prisma.cartItem.create({
        data: {
          userId,
          productId,
          quantity: Number(quantity),
          discountedPrice: Number(discountedPrice),
        },
      });
    }

    res.status(200).json({
      message: "Cart updated successfully",
      cartItem: updatedItem,
    });
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Missing productId" });
    }

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

    const userId = decoded.id;

    // Check if cart item exists
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (!existingItem) {
      return res.status(404).json({
        message: "Item not found in cart",
      });
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    res.status(200).json({
      message: "Item removed from cart successfully",
      removedProductId: productId,
    });
  } catch (err) {
    console.error("Error removing item from cart:", err);
    res.status(500).json({ message: "Server error", error: err.message });
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
