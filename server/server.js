require("dotenv").config();
const express = require("express");
const mongoose = require('mongoose');
const cors = require("cors");
const cookieParser = require("cookie-parser"); 
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const weightSettingsRouter = require('./routes/weightSettingsRoute'); 


const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', 
  credentials: true, 
};

app.use(cors(corsOptions)); 

app.use(express.json()); 

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true, 
            useUnifiedTopology: true, 
            serverSelectionTimeoutMS: 20000, 
            socketTimeoutMS: 45000,
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); 
    }
}

connectDB(); 

// User routes
app.use("/api/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use('/api', weightSettingsRouter); 
const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));