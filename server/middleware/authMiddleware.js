const jwt = require("jsonwebtoken");
const User = require("../models/User");


exports.protect = async (req, res, next) => {
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.token) {
    token = req.cookies.token; 
  }

  if (!token) {
    return res.status(401).json({ message: "You are not logged in. Please log in to get access." });
  }

  try {
  
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

   
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({ message: "The user belonging to this token no longer exists." });
    }

 
    req.user = currentUser;
    next();

  } catch (error) {
    return res.status(401).json({ message: "Invalid token." });
  }
};


exports.restrictTo = (...roles) => {
 
  return (req, res, next) => {
    
    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({ 
        message: "You do not have permission to perform this action." 
      });
    }
    next();
  };
};