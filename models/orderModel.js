const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order must belong to a user"],
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
      },
    ],
    shippingAddress: {
      type: {
        address: String,
        phone: String,
        name: String,
      },
      required: true,
    },

    status: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled", "returned"],
      default: "processing",
    },
    price: {
      total: Number,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ createdAt: -1 });



// Virtual populate with reviews
orderSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "order",
  localField: "_id",
});

// Query middleware
orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name email photo",
  }).populate({
    path: "items.product",
    select: "name images",
  });
  next();
});

orderSchema.post("save", async function (doc, next) {
  await mongoose.model("User").findByIdAndUpdate(doc.user, {
    $push: { orders: doc._id },
  });
  next();
});

module.exports = mongoose.model("Order", orderSchema);
