const express = require("express");
const orderController = require("../controllers/orderController");

const orderRouter = express.Router();

orderRouter.route("/admin").get(orderController.getAllUsersForAdmin);
orderRouter
  .route("/")
  .get(orderController.getAllOrders)
  .post(orderController.createOrder);

module.exports = orderRouter;
