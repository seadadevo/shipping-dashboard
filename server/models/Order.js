
const mongoose = require("mongoose");
const validator = require("validator");

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, "Product name is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Product quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  weight: {
    type: Number,
    required: [true, "Product weight is required"],
  },
});

const orderSchema = new mongoose.Schema(
  {
    orderType: {
      type: String,
      required: [true, "Order type is required"],
      enum: ["استلام من المتجر", "من الباب للباب", "من المستودع"],
    },
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    customerPhone1: {
      type: String,
      required: [true, "Customer phone number is required"],
    },
    customerPhone2: {
      type: String,
    },
    customerEmail: {
      type: String,
      lowercase: true,
      validate: [validator.isEmail, "Invalid email format"],
    },

    governorate: {
      type: String,
      required: [true, "Governorate is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    village: {
      type: String,
    },
    street: {
      type: String,
      required: [true, "Street address is required"],
    },
    isVillageDelivery: {
      type: Boolean,
      default: false,
    },

    shippingType: {
      type: String,
      required: [true, "Shipping type is required"],
      enum: ["عادي", "شحن في 24 ساعة", "شحن خلال 15 يوم"],
    },
    paymentType: {
      type: String,
      required: [true, "Payment type is required"],
      enum: ["واجبة التحصيل", "دفع مقدم", "طرد مقابل طرد"],
    },
    branch: {
      type: String,
      required: [true, "Branch is required"],
      enum: ["القاهرة", "الجيزة", "الاسكندرية", "الشرقية", "اسوان"],
    },
    orderCost: {
      type: Number,
      required: [true, "Order cost is required"],
    },
    totalWeight: {
      type: Number,
      required: [true, "Total weight is required"],
    },
    notes: {
      type: String,
      trim: true,
    },

    products: {
      type: [productSchema],
      validate: [
        (val) => val.length > 0,
        "Order must have at least one product",
      ],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);