// routes/vehicle.routes.js
const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const vehicleController = require('../Controllers/VehicleController');
const auth = require('../middleware/auth');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.use(auth);


router.put(
    '/VehicleTypeRegister',
    [
        body('vehicleType').isIn(['motorbike', 'car/van', 'tuk/auto']).withMessage('Invalid vehicle type'),
    ],
    vehicleController.RegisterVehicleType
);


router.put('/VehicleDetailsSignUp',
    upload.fields([
        { name: 'insuranceFile', maxCount: 1 },
        { name: 'revenueLicenseFile', maxCount: 1 },
        { name: 'driverLicenseFrontFile', maxCount: 1 },
        { name: 'driverLicenseBackFile', maxCount: 1 },
        { name: 'emissionCertificateFile', maxCount: 1 },
        { name: 'frontViewImage', maxCount: 1 },
        { name: 'sideViewImage', maxCount: 1 }
    ]),
    vehicleController.VehicleDetailsSignUp
);




// Get one vehicle details
router.get('/Get', vehicleController.getVehicle);

// Update vehicle details
router.put('/Update', vehicleController.updateVehicle);



module.exports = router;


