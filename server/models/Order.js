const mongoose = require("mongoose");
const validator = require("validator");


const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, "Product quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  weight: {
    type: Number,
    required: [true, "Product weight is required"],
    min: [0, "Weight must be a positive number"],
  },
});


const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    
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
      required: [true, "Customer phone is required"],
    },
    customerPhone2: String,
    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          // Allow empty string or valid email
          return !v || validator.isEmail(v);
        },
        message: "Invalid email format"
      }
    },

   
    governorate: {
      type: String,
      required: [true, "Governorate is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    village: String,
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
    },
    paymentType: {
      type: String,
      required: [true, "Payment type is required"],
      enum: ["واجبة التحصيل", "دفع مقدم", "طرد مقابل طرد"],
    },
    branch: {
      type: String,
      enum: ["القاهرة", "الجيزة", "الاسكندرية", "الشرقية", "اسوان"],
    },
    
  
    
  
    products: {
      type: [productSchema],
      required: [true, "At least one product is required"],
      validate: [v => Array.isArray(v) && v.length > 0, "Products array cannot be empty"]
    },
    
 
    totalWeight: {
        type: Number,
        required: [true, "Total weight is required"],
        min: [0.01, "Total weight must be greater than 0"]
    },

    
    orderCost: {
      type: Number,
      required: [true, "Order cost calculation failed or field is missing"],
    },
    
  
    status: {
      type: String,
      enum: ["Pending", "Processing", "On the Way", "Delivered", "Cancelled"],
      default: "Pending",
    },
    
    // Order state history for tracking changes
    stateHistory: [{
      previousState: { type: String },
      newState: { type: String },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      changeReason: { type: String },
      changedAt: { type: Date, default: Date.now }
    }],
    
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Driver assignment
    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    driverStatus: {
      type: String,
      enum: ['pending', 'picked-up', 'in-transit', 'delivered'],
      default: 'pending'
    }
  },
  {
    timestamps: true,
  }
);

// Generate unique order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);