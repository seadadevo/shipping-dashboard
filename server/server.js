require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const weightSettingsRouter = require("./routes/weightSettingsRoute");
const orderRoutes = require("./routes/orderRoutes"); 
const locationRoutes = require("./routes/locationRoutes");
const shippingTypeRoutes = require("./routes/shippingTypeRoutes");
const driverRoutes = require("./routes/driverRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRoutes);
app.use("/api/v1/auth", authRoutes);

app.use("/api/weight-settings", weightSettingsRouter);
app.use("/api/orders", orderRoutes);
app.use("/api/locations", locationRoutes);  
 
app.use("/api/shipping-types", shippingTypeRoutes);
app.use("/api/drivers", driverRoutes);

// Global Error Handler (must be last middleware)
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
