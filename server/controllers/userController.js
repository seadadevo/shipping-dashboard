const User = require("../models/User");

// Strong password validator
const isStrongPassword = (password) => {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

// Add new user
exports.addUser = async (req, res) => {
  try {
    const {
      userType,
      fullName,
      email,
      password,
      phone,
      address,
      governorate,
      city,
      storeName,
    } = req.body;

    // Required fields check
    if (!userType || !fullName || !email || !password || !phone)
      return res.status(400).json({ message: "Required fields are missing" });

    // Validate strong password
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Weak password. Must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character.",
      });
    }

    // Check duplicates
    const existingUser = await User.findOne({ $or: [{ email }, { fullName }] });
    if (existingUser)
      return res.status(400).json({
        message: "Full name or email is already in use",
      });

    // Create new user
    const newUser = new User({
      userType,
      fullName,
      email,
      password,
      phone,
      address,
      governorate,
      city,
      storeName,
    });

    await newUser.save();
    res.status(201).json({
      message: "User added successfully",
      user: newUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
