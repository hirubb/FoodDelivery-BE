const express = require('express');
const multer = require('multer');
const { body } = require('express-validator');
const vehicleController = require('../Controllers/VehicleController');
const authenticate = require('../middleware/auth');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



router.put(
    '/VehicleTypeRegister',
    [
        body('vehicleType').isIn(['motorbike', 'car/van', 'tuk/auto']).withMessage('Invalid vehicle type'),
    ],
    authenticate, vehicleController.RegisterVehicleType
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
    authenticate, vehicleController.VehicleDetailsSignUp
);



router.put('/EditVehicleDetails',
    upload.fields([
        { name: 'frontViewImage', maxCount: 1 },
        { name: 'sideViewImage', maxCount: 1 }
    ]),
    authenticate, vehicleController.updateVehicle
);


router.get('/Get', authenticate, vehicleController.getVehicle);


module.exports = router;


