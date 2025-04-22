const express = require('express');
const router = express.Router();
const {
    getAllDrivers,
    getDriverById,
    updateDriver,
    deleteDriver
} = require('../Controllers/driverController');

const authenticate = require('../middleware/auth');



router.get('/getAll', authenticate, getAllDrivers);


router.get('/:driverId', authenticate, getDriverById);


router.put('/:driverId', authenticate, updateDriver);


router.delete('/:driverId', authenticate, deleteDriver);

module.exports = router;
