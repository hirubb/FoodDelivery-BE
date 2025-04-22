const VehicleWithUser = require('../Models/Driver');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


exports.RegisterDriver = async (req, res) => {
    try {
        const {
            firstName, lastName, age, gender, mobile, email, password
        } = req.body;


        const existingUser = await VehicleWithUser.findOne({ 'user.email': email });
        if (existingUser) {
            return res.status(400).json({ message: 'Driver already exists with this email' });
        }


        const newDriver = new VehicleWithUser({
            user: {
                firstName,
                lastName,
                age,
                gender,
                mobile,
                email,
                password
            },

        });


        await newDriver.save();

        // Create a JWT token
        const token = jwt.sign(
            { userId: newDriver._id, },
            process.env.JWT_SECRET, // This should be an environment variable
            { expiresIn: '1h' } // Token expiration time
        );


        res.status(201).json({
            message: 'Driver registered successfully',
            driver: newDriver.user,
            token
        });

    } catch (err) {
        console.error('Error in createDriver:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};