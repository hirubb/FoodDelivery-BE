// Utils/Cloudinary.js
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
require('dotenv').config();


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (fileObject) => {
    try {

        if (fileObject && fileObject.buffer) {

            const result = await new Promise((resolve, reject) => {
                const uploadOptions = {
                    resource_type: 'auto',
                    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_API_SECRET
                };

                const uploadStream = cloudinary.uploader.upload_stream(
                    uploadOptions,
                    (error, result) => {
                        if (error) return reject(error);
                        resolve(result);
                    }
                );


                const bufferStream = new Readable();
                bufferStream.push(fileObject.buffer);
                bufferStream.push(null);
                bufferStream.pipe(uploadStream);
            });

            return result.secure_url;
        }
        else {
            throw new Error('Invalid file object or missing buffer');
        }
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        throw new Error("File upload failed");
    }
};

module.exports = { uploadToCloudinary };
