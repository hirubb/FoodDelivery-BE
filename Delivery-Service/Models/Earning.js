const mongoose = require('mongoose');

const EarningSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VehicleWithUser',
        required: true
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    totalEarning: {
        type: Number,
        required: true
    },
    totalDistance: {
        type: Number, // Store total distance in kilometers (from Delivery schema)
        required: true
    },
    deliveryDate: {
        type: Date,
        default: Date.now
    },
    paymentStatus: {
        type: String,
        enum: ['completed', 'pending', 'failed'],
        default: 'pending'
    },
    paymentDate: {
        type: Date
    }
});

const Earnings = mongoose.model('Earnings', EarningSchema);

module.exports = Earnings;
