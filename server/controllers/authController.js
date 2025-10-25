const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const sendToken = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.userType },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

  res.cookie("token", token, {
    expires: new Date(
      Date.now() +
        process.env.JWT_EXPIRES_IN.replace("d", "") * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  });

  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    const allowedTypes = ["admin", "employee", "merchant"];
    if (!allowedTypes.includes(user.userType)) {
      return res.status(403).json({
        message: "Your user type is not authorized to access this dashboard.",
      });
    }

    sendToken(user, 200, res);
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
};
