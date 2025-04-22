// models/earnings.model.js
const mongoose = require('mongoose');

const earningsSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    tip: {
        type: Number,
        default: 0
    },
    bonus: {
        type: Number,
        default: 0
    },
    totalEarning: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    },
    paymentDate: {
        type: Date
    },
    deliveryDate: {
        type: Date,
        required: true,
        default: Date.now
    }
}, {
    timestamps: true
});

const Earnings = mongoose.model('Earnings', earningsSchema);

module.exports = Earnings;
