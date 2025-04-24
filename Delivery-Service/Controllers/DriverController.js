const VehicleWithUser = require('../Models/Driver');
const bcrypt = require('bcryptjs');



exports.getAllDrivers = async (req, res) => {
    try {

        const drivers = await VehicleWithUser.find();
        if (!drivers.length) {
            return res.status(404).json({ message: 'No drivers found' });
        }

        res.status(200).json({
            message: 'All drivers fetched successfully',
            drivers: drivers.map(driver => driver.user)
        });

    } catch (err) {
        console.error('Error in getAllDrivers:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


exports.getDriverById = async (req, res) => {
    try {
        const { driverId } = req.params;

        const driver = await VehicleWithUser.findById(driverId);
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
        const { driverId } = req.params;
        const {
            firstName, lastName, email, password, mobile, age, gender,
        } = req.body;

        // Find the driver by ID
        let driver = await VehicleWithUser.findById(driverId);
        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // Update the user details if provided
        if (firstName) driver.user.firstName = firstName;
        if (lastName) driver.user.lastName = lastName;
        if (email) driver.user.email = email;
        if (password) driver.user.password = await bcrypt.hash(password, 8);  // Hash the password if updated
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


exports.deleteDriver = async (req, res) => {
    try {
        const { driverId } = req.params;


        const driver = await VehicleWithUser.findById(driverId);


        if (!driver) {
            return res.status(404).json({ message: 'Driver not found' });
        }


        await VehicleWithUser.deleteOne({ _id: driverId });


        res.status(200).json({
            message: 'Driver and associated vehicle deleted successfully'
        });

    } catch (err) {
        console.error('Error in deleteDriver:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
      const users = await VehicleWithUser.find();
      if (!users || users.length === 0) {
        return res.status(404).json({ message: "No users found." });
      }
  
      return res.status(200).json({ users });
    } catch (error) {
      console.error("Error fetching all users:", error);
      return res.status(500).json({ message: "Server error while fetching users." });
    }
  };
  