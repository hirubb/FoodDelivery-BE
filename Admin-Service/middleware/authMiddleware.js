const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

// Middleware to authenticate user
const authenticate = async (req, res, next) => {
  // Retrieve the token from the Authorization header
  const token = req.header("Authorization")?.replace("Bearer ", "");

  // If no token is found, deny access
  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    // Verify the token using the JWT secret from environment variables
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user information to the request object
    req.userId = decoded.userId;
    req.role = decoded.role;
    

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    // If the token is invalid or expired, send an error response
    return res.status(400).json({ message: "Invalid or expired token." });
  }
};

// Export the middleware
module.exports = authenticate;
