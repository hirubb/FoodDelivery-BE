const mongoose = require("mongoose");

const MenuItemSchema = new mongoose.Schema(
  {
    menu_id: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true }, // Reference to Menu
    name: { type: String, required: true }, // Item name (e.g., "Pasta", "Burger")
    description: { type: String }, // Item description
    portion: { type: String, enum: ["S", "M", "L"], required: true },
    price: { type: Number, required: true }, // Item price
    category: { type: String, required: true }, // Category (e.g., "Appetizer", "Main Course")
    images: [{ type: String }], // URL or path to image for the menu item
    available: { type: Boolean, default: true }, // If the item is available for ordering
  },
  { timestamps: true }
);

module.exports = mongoose.model("MenuItem", MenuItemSchema);
