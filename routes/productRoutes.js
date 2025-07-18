const express = require("express");
const upload = require("../config/s3");
const productController = require("../controllers/productControlller");

const productRouter = express.Router();

// Load auth page (optional)
productRouter.route("/").get(productController.getAllProduct);

productRouter
  .route("/")
  .post(upload.array("images"), productController.createProduct);

productRouter
  .route("/:id")
  .get(productController.getProduct)
  .patch(upload.array("images"), productController.updateProduct)
  .delete(productController.deleteProduct);

module.exports = productRouter;
