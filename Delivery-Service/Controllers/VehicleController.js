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

        const {
            vehicleModel,
            vehicleType,
            manufactureYear,
            licensePlate,
        } = req.body;

        let Vehicle = await VehicleWithUser.findById(req.user._id);
        if (!Vehicle) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }

        if (vehicleModel) Vehicle.vehicle.vehicleModel = vehicleModel;
        if (vehicleType) Vehicle.vehicle.vehicleType = vehicleType;
        if (manufactureYear) Vehicle.vehicle.manufactureYear = manufactureYear;
        if (licensePlate) Vehicle.vehicle.licensePlate = licensePlate;


        const frontViewImage = req.files['frontViewImage'] ? req.files['frontViewImage'][0] : null;
        const sideViewImage = req.files['sideViewImage'] ? req.files['sideViewImage'][0] : null;


        if (!sideViewImage && !frontViewImage) {
            return res.status(400).json({ message: 'Vehicle both frontview and sideview is required' });
        }

        if (frontViewImage) {
            const frontViewImageUrl = await uploadToCloudinary(frontViewImage);
            Vehicle.vehicle.images.frontView = frontViewImageUrl;
        };
        if (sideViewImage) {
            const sideViewImageUrl = await uploadToCloudinary(sideViewImage);
            Vehicle.vehicle.images.sideView = sideViewImageUrl;
        };

        await Vehicle.save();

        res.status(200).json({
            message: 'Driver Details updated successfully',
            driver: Vehicle.vehicle
        });

    } catch (err) {
        console.error('Error in update Driver  Details :', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }

};





exports.VehicleDetailsSignUp = async (req, res) => {
    try {

        const {
            vehicleModel,
            manufactureYear,
            licensePlate,
        } = req.body;

        console.log('req.files type:', typeof req.files);
        console.log('req.files structure:', req.files);


        const vehiclewithuser = await VehicleWithUser.findOne({ _id: req.user._id });

        if (!vehiclewithuser) {
            return res.status(404).json({ message: 'Vehicle not found' });
        }


        if (vehicleModel) vehiclewithuser.vehicle.vehicleModel = vehicleModel;
        if (manufactureYear) vehiclewithuser.vehicle.manufactureYear = manufactureYear;
        if (licensePlate) vehiclewithuser.vehicle.licensePlate = licensePlate;


        const getFile = (fieldname) => {
            if (!req.files) return null;


            if (Array.isArray(req.files)) {
                return req.files.find(f =>
                    f.fieldname === fieldname ||
                    f.fieldname === `${fieldname}`
                );
            }


            if (req.files[fieldname]) {
                return Array.isArray(req.files[fieldname])
                    ? req.files[fieldname][0]
                    : req.files[fieldname];
            }


            const tabFieldname = `${fieldname}`;
            if (req.files[tabFieldname]) {
                return Array.isArray(req.files[tabFieldname])
                    ? req.files[tabFieldname][0]
                    : req.files[tabFieldname];
            }

            return null;
        };


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
