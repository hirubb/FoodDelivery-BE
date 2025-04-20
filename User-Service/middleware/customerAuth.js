const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

// Middleware to authenticate Customer
const authenticateCustomer = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔐 Customer Token:", token);
    console.log("🪪 Decoded Customer Token:", decoded);

    if (decoded.role !== "Customer") {
      return res.status(403).json({ message: "Access denied. Invalid role." });
    }

    req.userId = decoded.id;
    req.role = decoded.role;

    next();
  } catch (error) {
    return res.status(400).json({ message: "Invalid or expired token." });
  }
};

module.exports = authenticateCustomer;
