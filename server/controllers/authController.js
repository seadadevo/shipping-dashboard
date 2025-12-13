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
        .json({ message: "يرجى إدخال البريد الإلكتروني وكلمة المرور" });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }

    const allowedTypes = ["admin", "employee", "merchant", "courier"];
    if (!allowedTypes.includes(user.userType)) {
      return res.status(403).json({
        message: "نوع المستخدم غير مصرح له بالوصول إلى لوحة التحكم",
      });
    }

    sendToken(user, 200, res);
  } catch (error) {
    console.error("!!! LOGIN CRASHED !!!", error)
    res.status(500).json({ message: "خطأ في الخادم أثناء تسجيل الدخول" });
  }
};