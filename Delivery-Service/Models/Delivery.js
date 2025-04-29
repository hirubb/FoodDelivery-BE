const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
    orderid: {
        type: String,
        ref: 'Order',
        required: true,
    },
    driverid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VehicleWithUser',
        required: true
    },
    customerid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    Restuarentid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'Accepted', 'cancelled', 'picked', 'delivered'],
        default: 'pending',
    },
    totalDistance: {
        type: Number, // Store distance in kilometers
        required: true
    },
    Date: {
        type: Date,
        default: Date.now,
    },
});

const Delivery = mongoose.model('Delivery', DeliverySchema);

module.exports = Delivery;
