// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Log to help debug
    console.log('Authorization header:', req.headers.authorization);
    
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication failed: No token provided' });
    }
    
    console.log('JWT Secret exists:', !!process.env.JWT_SECRET);
    console.log('Token being verified:', token.substring(0, 20) + '...');
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Successfully decoded token:', decoded);
      req.userData = decoded;
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