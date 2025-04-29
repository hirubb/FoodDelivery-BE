// models/order.model.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    customer: {
        name: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    restaurant: {
        name: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        }
    },
    pickup: {
        latitude: {
            type: String,
            required: true
        },
        longitude: {
            type: String,
            required: true
        },

    },
    dropoff: {
        latitude: {
            type: String,
            required: true
        },
        longitude: {
            type: String,
            required: true
        },
    },

    DriverLocation: {
        latitude: {
            type: String,
            required: true
        },
        longitude: {
            type: String,
            required: true
        },
    },

    items: [{
        name: String,
        quantity: Number,
        price: Number
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'picked', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },

    // statusHistory: [{
    //     status: {
    //         type: String,
    //         enum: ['pending', 'accepted', 'picked', 'in-progress', 'completed', 'cancelled']
    //     },
    //     timestamp: {
    //         type: Date,
    //         default: Date.now
    //     }
    // }]

}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
