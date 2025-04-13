const MenuItem = require("../models/MenuItems");
const Menu = require("../models/Menu");

// Add a menu item
exports.createMenuItem = async (req, res) => {
  try {
    const { menu_id, name, description, portion, price, category, available } = req.body;

    const imageUrls = req.files.map(file => file.path);

    const menuItem = new MenuItem({
      menu_id,
      name,
      description,
      portion,
      price,
      category,
      images: imageUrls,
      available
    });

    await menuItem.save();

    // Add menu item to the corresponding menu
    await Menu.findByIdAndUpdate(menu_id, { $push: { menu_items: menuItem._id } });

    res.status(201).json(menuItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; 

// Get all menu items for a specific menu
exports.getMenuItemsByMenu = async (req, res) => {
  try {
    const { menuId } = req.params;
    const menuItems = await MenuItem.find({ menu_id: menuId });
    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a menu item
exports.updateMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;
    const updatedData = req.body;

    const menuItem = await MenuItem.findByIdAndUpdate(menuItemId, updatedData, { new: true });

    if (!menuItem) return res.status(404).json({ message: "Menu item not found" });

    res.status(200).json(menuItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;

    const menuItem = await MenuItem.findByIdAndDelete(menuItemId);
    
    if (!menuItem) return res.status(404).json({ message: "Menu item not found" });

    // Remove item from associated menu
    await Menu.findByIdAndUpdate(menuItem.menu_id, { $pull: { menu_items: menuItem._id } });

    res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
