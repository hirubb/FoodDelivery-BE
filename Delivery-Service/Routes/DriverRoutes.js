const express = require('express');
const router = express.Router();
const {
    getAllDrivers,
    getDriverById,
    updateDriver,
    deleteDriver,
    getAllUsers
} = require('../Controllers/driverController');

const authenticate = require('../middleware/auth');



router.get('/getAll', authenticate, getAllDrivers);


router.get('/:driverId', authenticate, getDriverById);


router.put('/:driverId', authenticate, updateDriver);


router.delete('/:driverId', authenticate, deleteDriver);

router.get("/",getAllUsers);

module.exports = router;
