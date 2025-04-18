const express = require("express");
const router = express.Router();
const menuItemController = require("../controllers/menuItemController");
const uploadMenuItemImages = require("../middleware/menuItemUpload");

// Routes for MenuItem
router.post("/create", uploadMenuItemImages,menuItemController.createMenuItem); // Add a menu item
router.get("/:menuId", menuItemController.getMenuItemsByMenu); // Get menu items by menu
router.put("/:menuItemId", menuItemController.updateMenuItem); // Update menu item
router.delete("/:menuItemId", menuItemController.deleteMenuItem); // Delete menu item

module.exports = router;
