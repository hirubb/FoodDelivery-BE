// controllers/order.controller.js
const Order = require('../Models/Order');
const Earnings = require('../Models/Earning');

// Get available orders
exports.getAvailableOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            driver: null,
            status: 'pending'
        }).sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error('Error in getAvailableOrders:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get driver's orders with status filter
exports.getDriverOrders = async (req, res) => {
    try {
        const { status } = req.query;

        let query = { driver: req.user._id };

        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query).sort({ updatedAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error('Error in getDriverOrders:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if order belongs to this driver or is available
        if (order.driver && !order.driver.equals(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to access this order' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error in getOrderById:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['accepted', 'picked', 'in-progress', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // For accepting a pending order
        if (status === 'accepted' && order.status === 'pending') {
            if (order.driver) {
                return res.status(400).json({ message: 'Order already assigned to a driver' });
            }

            order.driver = req.user._id;
        }
        // For other status updates, check if order belongs to this driver
        else if (!order.driver || !order.driver.equals(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized to update this order' });
        }

        // Update status and add to history
        order.status = status;
        order.statusHistory.push({
            status,
            timestamp: new Date()
        });

        await order.save();

        // If order is completed, create earnings record
        if (status === 'completed') {
            const earnings = new Earnings({
                driver: req.user._id,
                order: order._id,
                amount: order.totalAmount * 0.8, // Example: driver gets 80% of order total
                tip: 0, // Can be updated later
                bonus: 0, // Can be updated later
                totalEarning: order.totalAmount * 0.8,
                deliveryDate: new Date()
            });

            await earnings.save();
        }

        res.json({
            message: 'Order status updated successfully',
            order
        });
    } catch (error) {
        console.error('Error in updateOrderStatus:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
