// middleware/authenticateRestaurant.js
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

// Middleware to authenticate Restaurant Owner
const authenticateRestaurant = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("🔐 Restaurant Token:", token);
    console.log("🪪 Decoded Restaurant Token:", decoded);

    // Check if decoded contains either id or userId property
    const userId = decoded.id || decoded._id;
    
    if (!userId) {
      return res.status(400).json({ message: "Invalid token structure." });
    }

    if (decoded.role !== "RestaurantOwner") {
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

module.exports = authenticateRestaurant;