const express = require("express");
// const passport = require("passport");
const { signToken } = require("../utils/jwtToken");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
// require("../middleware/passport");

const userRouter = express.Router();

// userRouter.get("/me", authController.protect, authController.getMe);

userRouter.route("/sign-in").post(authController.loginUser);
userRouter.route("/sign-up").post(authController.registerUser);
userRouter.route("/verify-email").post(authController.verifyEmail);
userRouter.get("/", userController.getAllUsers);
// userRouter.route("/forget-password").post(authController.forgetPassword);
// userRouter.route("/reset-password/:token").patch(authController.resetPassword);

// userRouter
//   .route("/change-password")
//   .patch(authController.protect, authController.changePassword);

// userRouter.patch("/cart/add", authController.protect, userController.addToCart);
// userRouter.delete(
//   "/cart/remove",
//   authController.protect,
//   userController.removeFromCart
// );

// userRouter.delete(
//   "/cart/clear",
//   authController.protect,
//   userController.clearCart
// );

// userRouter
//   .route("/:id")
//   .get(userController.getUser)
//   .patch(userController.updateUser)
//   .delete(
//     authController.protect,
//     authController.restrictTo("admin"),
//     userController.deleteUser
//   );

module.exports = userRouter;
