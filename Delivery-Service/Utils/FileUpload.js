// utils/fileUpload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up storage for uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR);

        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|pdf)$/)) {
        return cb(new Error('Only JPG, JPEG, PNG and PDF files are allowed!'), false);
    }
    cb(null, true);
};

// Export multer middleware
exports.upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    fileFilter: fileFilter
});

// Get file URL
exports.getFileUrl = (filename) => {
    return `${process.env.APP_URL}/${process.env.UPLOAD_DIR}/${filename}`;
};
