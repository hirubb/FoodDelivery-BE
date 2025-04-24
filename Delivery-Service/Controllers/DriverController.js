const VehicleWithUser = require('../Models/Driver');
const bcrypt = require('bcryptjs');
const { uploadToCloudinary } = require('../Utils/Cloudinary');




exports.getAllDrivers = async (req, res) => {
    try {
        // Fetch drivers and populate the 'user' and 'vehicle' fields
        const drivers = await VehicleWithUser.find()
            .populate('user')  // Populating user reference
            .populate('vehicle');  // Populating vehicle reference

        if (!drivers.length) {
            return res.status(404).json({ message: 'No drivers found' });
        }

        // Optionally, log the full driver data to ensure it's populated correctly
        console.log("Drivers Data:", JSON.stringify(drivers, null, 2));

        // Send back the populated drivers
        res.status(200).json({
            message: 'All drivers fetched successfully',
            drivers: drivers
        });

    } catch (err) {
        console.error('Error in getAllDrivers:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.getDriverById = async (req, res) => {
    try {

        const driver = await VehicleWithUser.findById(req.user._id);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        res.status(200).json({
            message: 'Driver fetched successfully',
            driver: driver.user
        });

    } catch (err) {
        console.error('Error in getDriverById:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// 4. Update a driver's details
exports.updateDriver = async (req, res) => {
    try {

        const {
            firstName, lastName, email, password, mobile, age, gender,
        } = req.body;

        // Find the driver by ID
        let driver = await VehicleWithUser.findById(req.user._id);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // Update the user details if provided
        if (firstName) driver.user.firstName = firstName;
        if (lastName) driver.user.lastName = lastName;
        if (email) driver.user.email = email;
        if (password) driver.user.password = await bcrypt.hash(password, 8);
        if (mobile) driver.user.mobile = mobile;
        if (age) driver.user.age = age;
        if (gender) driver.user.gender = gender;


        // Save the updated driver
        await driver.save();

        res.status(200).json({
            message: 'Driver updated successfully',
            driver: driver.user
        });

    } catch (err) {
        console.error('Error in updateDriver:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};



exports.UpdateDriverProfileImage = async (req, res) => {
    try {



        let driver = await VehicleWithUser.findById(req.user._id);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }


        const ProfileImage = req.files['ProfileImage'] ? req.files['ProfileImage'][0] : null;


        if (!ProfileImage) {
            return res.status(400).json({ message: 'Profile image is required' });
        }

        if (ProfileImage) {
            const ProfileImageUrl = await uploadToCloudinary(ProfileImage);
            driver.user.profileImage = ProfileImageUrl;
        };


        await driver.save();

        res.status(200).json({
            message: 'Driver Profile Image updated successfully',
            driver: driver.user
        });

    } catch (err) {
        console.error('Error in updateDriver Profile Image:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};




exports.deleteDriver = async (req, res) => {
    try {


        const driver = await VehicleWithUser.findById(req.user._id);


        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }


        await VehicleWithUser.deleteOne({ _id: req.user._id });


        res.status(200).json({
            message: 'Driver and associated vehicle deleted successfully'
        });

    } catch (err) {
        console.error('Error in deleteDriver:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
