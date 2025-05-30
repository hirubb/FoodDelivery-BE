const express = require('express');
const multer = require('multer');
const router = express.Router();
const { getAllDrivers, getDriverById, updateDriver, UpdateDriverProfileImage, deleteDriver, GetDriverIDForMap } = require('../Controllers/DriverController');
const authenticate = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


router.get('/getAll', getAllDrivers);

router.get('/getdriver/:id', GetDriverIDForMap); // for the map


router.get('/getdriver', authenticate, getDriverById);


router.put('/updatedriver', authenticate, updateDriver);

router.put('/updatedriverprofileimage',
    upload.fields([
        { name: 'ProfileImage', maxCount: 1 }
    ]),
    authenticate, UpdateDriverProfileImage
);

router.delete('/deletedriver', authenticate, deleteDriver);

module.exports = router;
