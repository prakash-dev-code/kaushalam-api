const Product = require("../models/mongo/productModel");
const Factory = require("./handleCrud");

exports.getAllProduct = Factory.getAll(Product);
exports.deleteProduct = Factory.deleteOne(Product);
exports.getProduct = Factory.getOne(Product);
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // Find the product first
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Update text fields
    const fieldsToUpdate = [
      "name",
      "description",
      "price",
      "discountedPrice",
      "category",
      "stock",
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    // Handle images if new ones are uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((file, i) => {
        const altText = req.body[`altText${i}`] || `Image ${i + 1}`;
        return {
          url: file.location,
          altText: altText,
        };
      });

      // If you want to replace all old images:
      product.images = newImages;

      // If you want to add to existing images instead:
      // product.images.push(...newImages);
    }

    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// In your controller
exports.createProduct = async (req, res) => {
  try {
    // Extract text fields
    const { name, description, price, discountedPrice, category, stock } =
      req.body;

    // Process variants safely

    // Process images
    const imageData = (req.files || []).map((file, i) => {
      // Get altText for this index
      const altText = req.body[`altText${i}`] || `Image ${i + 1}`;

      return {
        url: file.location, // S3 URL
        altText: altText,
      };
    });

    // Create product
    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      discountedPrice: parseFloat(discountedPrice),
      category,
      stock: parseInt(stock),
      // seller: req.user._id,
      images: imageData, // This will store S3 URLs in MongoDB
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
