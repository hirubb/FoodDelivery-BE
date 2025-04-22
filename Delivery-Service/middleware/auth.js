const jwt = require('jsonwebtoken');
const VehicleWithUser = require('../Models/Driver');

const auth = async (req, res, next) => {
    try {
        // Extract token from the 'Authorization' header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        // Check if the token exists
        if (!token) {
            return res.status(401).json({ message: 'Authorization token is required' });
        }

        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log('Decoded token:', decoded.userId); // Debugging line

        // Find the user by userId from the token
        const user = await VehicleWithUser.findOne({ _id: decoded.userId });

        // If no user is found, return an error
        if (!user) {
            return res.status(401).json({ message: 'User not found, authentication failed' });
        }


        req.user = req.user || {};
        req.user._id = decoded.userId;

        next();

    } catch (error) {

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session expired, please login again' });
        }


        return res.status(401).json({ message: 'Invalid token, please authenticate' });
    }
};

module.exports = auth;
