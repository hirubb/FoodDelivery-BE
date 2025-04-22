// Payment-Service/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Get token from Authorization header (Bearer token)
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication failed: No token provided' });
    }
    
    try {
      // Verify token with the same JWT_SECRET used in Auth service
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Store the decoded token data
      req.userData = decoded;
      
      // Extract user ID from token (handle both 'id' and 'userId' formats)
      req.userId = decoded.id || decoded._id || decoded.userId;
      req.role = decoded.role;
      
      // Continue to the next middleware or route handler
      next();
    } catch (verifyError) {
      console.error('JWT verification error:', verifyError.message);
      return res.status(401).json({ 
        message: 'Authentication failed: ' + verifyError.message 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Authentication failed: Invalid token' });
  }
};