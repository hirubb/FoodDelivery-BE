const Earnings = require('../Models/Earning');
const Delivery = require('../Models/Delivery');

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

        // Find deliveries for the driver within the specified period
        const deliveries = await Delivery.find({
            driverid: req.user._id,
            Date: { $gte: startDate }
        }).populate('order');

        let totalEarnings = 0;
        let totalDistance = 0;

        // Loop through deliveries and calculate earnings based on distance
        for (const delivery of deliveries) {
            // Assuming $5 per kilometer rate for earnings
            const earningsPerKm = 5;
            totalDistance += delivery.totalDistance;
            totalEarnings += delivery.totalDistance * earningsPerKm; // Total earnings from distance
        }

        res.json({
            totalEarnings,
            totalDistance,
            ordersCount: deliveries.length
        });
    } catch (error) {
        console.error('Error in getEarnings:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get earnings summary (Daily, Weekly, Monthly, Yearly)
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

        // Calculate earnings for each period
        const getEarningsByPeriod = async (startDate) => {
            const deliveries = await Delivery.find({
                driverid: req.user._id,
                Date: { $gte: startDate }
            }).populate('order');

            let totalEarnings = 0;
            let totalDistance = 0;

            for (const delivery of deliveries) {
                const earningsPerKm = 5;
                totalDistance += delivery.totalDistance;
                totalEarnings += delivery.totalDistance * earningsPerKm;
            }

            return { totalEarnings, totalDistance, ordersCount: deliveries.length };
        };

        const dailyEarnings = await getEarningsByPeriod(todayStart);
        const weeklyEarnings = await getEarningsByPeriod(weekStart);
        const monthlyEarnings = await getEarningsByPeriod(monthStart);
        const yearlyEarnings = await getEarningsByPeriod(yearStart);

        // Return the earnings summary
        res.json({
            daily: dailyEarnings,
            weekly: weeklyEarnings,
            monthly: monthlyEarnings,
            yearly: yearlyEarnings,
        });
    } catch (error) {
        console.error('Error in getEarningsSummary:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
