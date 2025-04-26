const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
    orderid: {
        type: mongoose.Schema.Types.ObjectId,
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
    longitude: {
        type: Number,
        required: true
    },

    latitude: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['accepted', 'picked', 'delivered'],
        default: 'accepted',
    },

});

const Delivery = mongoose.model('Delivery', DeliverySchema);

module.exports = Delivery;
