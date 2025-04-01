const mongoose = require("mongoose");

const MenuSchema = new mongoose.Schema(
  {
    restaurant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true }, // Example: "Lunch Menu", "Dinner Menu"
    description: { type: String }, // Optional description of the menu
    menu_items: [{ type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" }], // List of MenuItems
  },
  { timestamps: true }
);

module.exports = mongoose.model("Menu", MenuSchema);
