const mongoose = require("mongoose");

const RestaurantSchema = new mongoose.Schema(
  {
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "RestaurantOwner", required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true,unique: true},

    street:{ type: String, required: true },
    city:{ type: String, required: true },
    state:{ type: String, required: true },
    postal_code:{ type: String, required: true },
    country: { type: String, required: true ,default:"Sri Lanka"},
    latitude: { type: Number },
    longitude: { type: Number },

    logo: { type: String },
    banner_image: { type: String },

    cuisine_type: { type: [String], required: true },
    license:{type: String, required: true} ,
    opDays:{type: [String], required: true},
    opHrs:{ type: [String], required: true },
    availability : {
      type: Boolean,
      default:true
    },
    ratings: [
      {
        // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // or Customer model
        rating: { type: Number, required: true, min: 1, max: 5 },
        review: { type: String },
        ratedAt: { type: Date, default: Date.now }
      }
    ],
    averageRating: {
      type: Number,
      default: 0
    },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", RestaurantSchema);
