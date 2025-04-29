const Menu = require("../models/Menu");
const MenuItem = require("../models/MenuItems");

// Create a new menu
exports.createMenu = async (req, res) => {
  try {
    const { restaurant_id, name, description } = req.body;
    
    const menu = new Menu({
      restaurant_id,
      name,
      description
    });

    await menu.save();
    res.status(201).json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all menus for a restaurant
exports.getMenusByRestaurant = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const menus = await Menu.find({ restaurant_id: restaurantId }).populate("menu_items");
    res.status(200).json(menus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a menu
exports.updateMenu = async (req, res) => {
  try {
    const { menuId } = req.params;
    const { name, description } = req.body;
    
    const menu = await Menu.findByIdAndUpdate(
      menuId,
      { name, description },
      
    );

    if (!menu) return res.status(404).json({ message: "Menu not found" });

    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a menu
exports.deleteMenu = async (req, res) => {
  try {
    const { menuId } = req.params;
    
    await MenuItem.deleteMany({ menu_id: menuId }); // Delete related menu items
    const menu = await Menu.findByIdAndDelete(menuId);

    if (!menu) return res.status(404).json({ message: "Menu not found" });

    res.status(200).json({ message: "Menu deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
