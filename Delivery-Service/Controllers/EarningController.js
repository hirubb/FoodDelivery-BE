// controllers/earnings.controller.js
const Earnings = require('../Models/Earning');

// Get driver's earnings
exports.getEarnings = async (req, res) => {
    try {
        const { period } = req.query;
        const currentDate = new Date();
        let startDate;

        // Define start date based on period
        if (period === 'day') {
            startDate = new Date(currentDate.setHours(0, 0, 0, 0));
        } else if (period === 'week') {
            startDate = new Date(currentDate.setDate(currentDate.getDate() - 7));
        } else if (period === 'month') {
            startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
        } else {
            // Default to all time
            startDate = new Date(0);
        }

        const earnings = await Earnings.find({
            driver: req.user._id,
            deliveryDate: { $gte: startDate }
        }).sort({ deliveryDate: -1 }).populate('order');

        res.json(earnings);
    } catch (error) {
        console.error('Error in getEarnings:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get earnings summary
exports.getEarningsSummary = async (req, res) => {
    try {
        const currentDate = new Date();

        // Start of current day
        const todayStart = new Date(currentDate.setHours(0, 0, 0, 0));

        // Start of current week (Sunday)
        const currentDay = currentDate.getDay();
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDay);
        weekStart.setHours(0, 0, 0, 0);

        // Start of current month
        const monthStart = new Date(currentDate);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        // Start of current year
        const yearStart = new Date(currentDate);
        yearStart.setMonth(0, 1);
        yearStart.setHours(0, 0, 0, 0);

        // Get daily earnings
        const dailyEarnings = await Earnings.aggregate([
            {
                $match: {
                    driver: req.user._id,
                    deliveryDate: { $gte: todayStart }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalTips: { $sum: '$tip' },
                    totalBonus: { $sum: '$bonus' },
                    totalEarnings: { $sum: '$totalEarning' },
                    ordersCount: { $sum: 1 }
                }
            }
        ]);

        // Get weekly earnings
        const weeklyEarnings = await Earnings.aggregate([
            {
                $match: {
                    driver: req.user._id,
                    deliveryDate: { $gte: weekStart }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalTips: { $sum: '$tip' },
                    totalBonus: { $sum: '$bonus' },
                    totalEarnings: { $sum: '$totalEarning' },
                    ordersCount: { $sum: 1 }
                }
            }
        ]);

        // Get monthly earnings
        const monthlyEarnings = await Earnings.aggregate([
            {
                $match: {
                    driver: req.user._id,
                    deliveryDate: { $gte: monthStart }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalTips: { $sum: '$tip' },
                    totalBonus: { $sum: '$bonus' },
                    totalEarnings: { $sum: '$totalEarning' },
                    ordersCount: { $sum: 1 }
                }
            }
        ]);

        // Get yearly earnings
        const yearlyEarnings = await Earnings.aggregate([
            {
                $match: {
                    driver: req.user._id,
                    deliveryDate: { $gte: yearStart }
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalTips: { $sum: '$tip' },
                    totalBonus: { $sum: '$bonus' },
                    totalEarnings: { $sum: '$totalEarning' },
                    ordersCount: { $sum: 1 }
                }
            }
        ]);

        // Get recent payments
        const recentPayments = await Earnings.find({
            driver: req.user._id,
            paymentStatus: 'completed'
        }).sort({ paymentDate: -1 }).limit(5);

        res.json({
            daily: dailyEarnings[0] || {
                totalAmount: 0,
                totalTips: 0,
                totalBonus: 0,
                totalEarnings: 0,
                ordersCount: 0
            },
            weekly: weeklyEarnings[0] || {
                totalAmount: 0,
                totalTips: 0,
                totalBonus: 0,
                totalEarnings: 0,
                ordersCount: 0
            },
            monthly: monthlyEarnings[0] || {
                totalAmount: 0,
                totalTips: 0,
                totalBonus: 0,
                totalEarnings: 0,
                ordersCount: 0
            },
            yearly: yearlyEarnings[0] || {
                totalAmount: 0,
                totalTips: 0,
                totalBonus: 0,
                totalEarnings: 0,
                ordersCount: 0
            },
            recentPayments
        });
    } catch (error) {
        console.error('Error in getEarningsSummary:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
