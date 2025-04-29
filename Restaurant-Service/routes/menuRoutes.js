const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menuController");

// Routes for Menu
router.post("/create", menuController.createMenu); // Create menu
router.get("/:restaurantId", menuController.getMenusByRestaurant); // Get menus for a restaurant
router.put("/:menuId", menuController.updateMenu); // Update menu
router.delete("/:menuId", menuController.deleteMenu); // Delete menu

module.exports = router;
