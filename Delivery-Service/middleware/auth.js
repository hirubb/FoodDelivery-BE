const jwt = require('jsonwebtoken');
const VehicleWithUser = require('../Models/Driver');

const auth = async (req, res, next) => {
    try {

        const token = req.header('Authorization')?.replace('Bearer ', '');


        if (!token) {
            return res.status(401).json({ message: 'Authorization token is required' });
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log('Decoded token:', decoded.id);


        const user = await VehicleWithUser.findOne({ _id: decoded.id });


        if (!user) {
            return res.status(401).json({ message: 'User not found, authentication failed' });
        }


        req.user = req.user || {};
        req.user._id = decoded.id;

        next();

    } catch (error) {

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Session expired, please login again' });
        }


        return res.status(401).json({ message: 'Invalid token, please authenticate' });
    }
};

module.exports = auth;
