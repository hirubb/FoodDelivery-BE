// middleware/authenticateCustomerFlexible.js
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

// Middleware to authenticate Customer with flexibility for testing
const authenticateCustomerFlexible = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  // If no token is provided during testing, assign a dummy user ID
  if (!token) {
    console.log("⚠️ No token provided. Using test customer ID.");
    req.userId = "65f1d7b8c30f1a7e9cbdef12"; // Test customer ID
    req.role = "Customer";
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔐 Customer Token:", token);
    console.log("🪪 Decoded Customer Token:", decoded);

    // Check if decoded contains either id or userId property
    const userId = decoded.id || decoded._id;
    
    if (!userId) {
      return res.status(400).json({ message: "Invalid token structure." });
    }

    if (decoded.role !== "Customer") {
      return res.status(403).json({ message: "Access denied. Invalid role." });
    }

    // Set userId consistently
    req.userId = userId;
    req.role = decoded.role;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(400).json({ message: "Invalid or expired token." });
  }
};

module.exports = authenticateCustomerFlexible;