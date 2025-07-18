const express = require("express");

const { signToken } = require("../utils/jwtToken");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");

const userRouter = express.Router();

userRouter.get("/me", authController.getMe);

userRouter.route("/sign-in").post(authController.loginUser);
userRouter.route("/sign-up").post(authController.registerUser);
userRouter.route("/verify-email").post(authController.verifyEmail);
userRouter.get("/", userController.getAllUsers);
userRouter.delete("/:userId", userController.deleteUser);
userRouter.patch("/:userId", userController.updateUser);

// userRouter
//   .route("/change-password")
//   .patch(authController.protect, authController.changePassword);

userRouter.patch("/cart/add", userController.addToCart);
userRouter.delete("/cart/remove", userController.removeFromCart);

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
