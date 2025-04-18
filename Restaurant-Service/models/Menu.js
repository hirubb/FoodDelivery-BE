const mongoose = require("mongoose");

const MenuSchema = new mongoose.Schema(
  {
    restaurant_id: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true }, 
    description: { type: String }, 
    menu_items: [{ type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" }], // List of MenuItems
  },
  { timestamps: true }
);

module.exports = mongoose.model("Menu", MenuSchema);
