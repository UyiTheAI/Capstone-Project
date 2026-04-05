const jwt  = require("jsonwebtoken");
const User = require("../models/User");

// Protect — verify JWT
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token)
    return res.status(401).json({ success:false, message:"Not authorized – no token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user      = await User.findById(decoded.id).select("-password");
    if (!req.user)
      return res.status(401).json({ success:false, message:"User no longer exists" });
    if (req.user.isActive === false)
      return res.status(401).json({ success:false, message:"Account deactivated" });
    next();
  } catch {
    return res.status(401).json({ success:false, message:"Token invalid or expired" });
  }
};

// Authorize — restrict to roles
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ success:false, message:`Role '${req.user.role}' not authorized` });
  next();
};

// Generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "7d" });

module.exports = { protect, authorize, generateToken };