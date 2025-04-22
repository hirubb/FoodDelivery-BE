const VehicleWithUser = require('../Models/Driver');
const { uploadToCloudinary } = require('../Utils/Cloudinary');

exports.RegisterVehicleType = async (req, res) => {
    console.log('Received vehicle type:', req.body);
    try {
        if (!req.body.vehicleType) {
            return res.status(400).json({ message: "Vehicle type is required" });
        }

        let vehicle = await VehicleWithUser.findByIdAndUpdate(req.user._id, {
            'vehicle.vehicleType': req.body.vehicleType,
        }, { new: true });

        if (!vehicle) {
            return res.status(400).json({ message: "Unable to Update Transaction Details" });
        }

        return res.status(200).json({ message: "Vehicle Type Updated", data: vehicle });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};





// Get a vehicle details through the token
exports.getVehicle = async (req, res) => {
    try {
        const vehicle = await VehicleWithUser.findOne({ _id: req.user._id });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        res.json(vehicle.vehicle);
    } catch (error) {
        console.error('Error in getVehicle:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};





// Update vehicle details
exports.updateVehicle = async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const allowedUpdates = ['vehicleType', 'vehicleModel', 'manufactureYear', 'licensePlate'];

        // Check if updates are valid
        const isValidOperation = updates.every(update => allowedUpdates.includes(update));
        if (!isValidOperation) {
            return res.status(400).json({ message: 'Invalid updates' });
        }

        const vehicle = await VehicleWithUser.findOne({ driver: req.user._id });

        if (!vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        // Apply updates
        updates.forEach(update => vehicle[update] = req.body[update]);
        await vehicle.save();

        res.json({
            message: 'Vehicle updated successfully',
            vehicle
        });
    } catch (error) {
        console.error('Error in updateVehicle:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


exports.VehicleDetailsSignUp = async (req, res) => {
    try {
        // Get text fields from req.body
        const {
            vehicleModel,
            manufactureYear,
            licensePlate,
        } = req.body;

        console.log('req.files type:', typeof req.files);
        console.log('req.files structure:', req.files);

        // Find the vehicle document
        const vehiclewithuser = await VehicleWithUser.findOne({ _id: req.user._id });

        if (!vehiclewithuser) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        // Update vehicle details
        if (vehicleModel) vehiclewithuser.vehicle.vehicleModel = vehicleModel;
        if (manufactureYear) vehiclewithuser.vehicle.manufactureYear = manufactureYear;
        if (licensePlate) vehiclewithuser.vehicle.licensePlate = licensePlate;

        // Safer file access function that works with different req.files structures
        const getFile = (fieldname) => {
            if (!req.files) return null;

            // If req.files is an array
            if (Array.isArray(req.files)) {
                return req.files.find(f =>
                    f.fieldname === fieldname ||
                    f.fieldname === `${fieldname}`
                );
            }

            // If req.files is an object with field name keys
            if (req.files[fieldname]) {
                return Array.isArray(req.files[fieldname])
                    ? req.files[fieldname][0]
                    : req.files[fieldname];
            }

            // Check for tab-suffixed field name
            const tabFieldname = `${fieldname}`;
            if (req.files[tabFieldname]) {
                return Array.isArray(req.files[tabFieldname])
                    ? req.files[tabFieldname][0]
                    : req.files[tabFieldname];
            }

            return null;
        };

        // Upload files to Cloudinary
        const insuranceFile = getFile('insuranceFile');
        if (insuranceFile) {
            const insuranceUrl = await uploadToCloudinary(insuranceFile);
            vehiclewithuser.vehicle.documents.insurance.file = insuranceUrl;
        }

        const revenueLicenseFile = getFile('revenueLicenseFile');
        if (revenueLicenseFile) {
            const revenueLicenseUrl = await uploadToCloudinary(revenueLicenseFile);
            vehiclewithuser.vehicle.documents.revenueLicense.file = revenueLicenseUrl;
        }

        const driverLicenseFrontFile = getFile('driverLicenseFrontFile');
        const driverLicenseBackFile = getFile('driverLicenseBackFile');
        if (driverLicenseFrontFile && driverLicenseBackFile) {
            const driverLicenseFrontUrl = await uploadToCloudinary(driverLicenseFrontFile);
            const driverLicenseBackUrl = await uploadToCloudinary(driverLicenseBackFile);
            vehiclewithuser.vehicle.documents.driverLicense.frontFile = driverLicenseFrontUrl;
            vehiclewithuser.vehicle.documents.driverLicense.backFile = driverLicenseBackUrl;
        }

        const emissionCertificateFile = getFile('emissionCertificateFile');
        if (emissionCertificateFile) {
            const emissionCertificateUrl = await uploadToCloudinary(emissionCertificateFile);
            vehiclewithuser.vehicle.documents.emissionCertificate.file = emissionCertificateUrl;
        }

        const frontViewImage = getFile('frontViewImage');
        if (frontViewImage) {
            const frontViewUrl = await uploadToCloudinary(frontViewImage);
            vehiclewithuser.vehicle.images.frontView = frontViewUrl;
        }

        const sideViewImage = getFile('sideViewImage');
        if (sideViewImage) {
            const sideViewUrl = await uploadToCloudinary(sideViewImage);
            vehiclewithuser.vehicle.images.sideView = sideViewUrl;
        }

        // Save the updated document
        await vehiclewithuser.save();

        res.json({
            message: 'Documents uploaded successfully',
            vehicle: vehiclewithuser.vehicle
        });

    } catch (error) {
        console.error('Error in VehicleDetailsSignUp:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
