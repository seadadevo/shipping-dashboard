const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const ALLOWED_TYPES = ["admin", "employee", "merchant", "courier"];

const getExpiryDays = () => {
  const raw = process.env.JWT_EXPIRES_IN || "7d";
  const days = Number(String(raw).replace("d", ""));
  return Number.isFinite(days) && days > 0 ? days : 7;
};

const sendToken = (user, statusCode, res) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  const token = jwt.sign(
    { id: user._id, role: user.userType },
    secret,
    { expiresIn }
  );

  const expiresDays = getExpiryDays();
  res.cookie("token", token, {
    expires: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
  });

  // Return a safe user payload without the password
  const plainUser = typeof user.toObject === "function" ? user.toObject() : { ...user };
  delete plainUser.password;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user: plainUser,
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

    if (!ALLOWED_TYPES.includes(user.userType)) {
      return res.status(403).json({
        message: "Your user type is not authorized to access this dashboard.",
      });
    }

    sendToken(user, 200, res);
  } catch (error) {
    console.error("!!! LOGIN CRASHED !!!", error)
    res.status(500).json({ message: "Server error during login" });
  }
};