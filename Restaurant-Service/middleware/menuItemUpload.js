const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../utils/cloudinary");

// Custom storage for menu item images
const menuItemStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "menu_items", // specific folder for menu item images
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  }),
});

// Allow multiple images under the "images" field
const uploadMenuItemImages = multer({ storage: menuItemStorage }).array("images", 10); // max 10 files

module.exports = uploadMenuItemImages;
