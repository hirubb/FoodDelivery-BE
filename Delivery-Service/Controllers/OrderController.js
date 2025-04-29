const axios = require('axios');
const VehicleWithUser = require('../Models/Driver');
const Delivery = require('../Models/Delivery');
const haversineDistance = require('../Utils/DistanceCalculation');

const DriverAssign = async (req, res) => {
    try {
        console.log('Fetching Orders...');
        const OrdersResponse = await axios.get('http://localhost:5001/orders/DeliveryPerson/GetAllOrders');
        const PaidOrders = Array.isArray(OrdersResponse.data.status)
            ? OrdersResponse.data.status.filter(order => order.paymentStatus === "Paid" && order.status === "Confirmed")
            : [];

        console.log(`Found ${PaidOrders.length} successful Orders.`);

        for (const Order of PaidOrders) {
            const { customerId, restaurantId, deliveryLocation } = Order;
            const { latitude: customerLat, longitude: customerLon } = deliveryLocation;

            console.log(`Customer ID: ${customerId}`);
            console.log(`Customer Coordinates: Latitude: ${customerLat}, Longitude: ${customerLon}`);

            let restaurant;
            try {
                // Fetch restaurant data
                const restaurantResponse = await axios.get(`http://localhost:4000/api/restaurant/${restaurantId}`);
                restaurant = restaurantResponse.data;
                console.log('Successfully fetched restaurant data.');
            } catch (err) {
                console.error('Error fetching restaurant data:', err.message);
                continue; // Skip to the next order if fetching fails
            }

            const { latitude: restaurantLat, longitude: restaurantLon } = restaurant.data;
            console.log(`Restaurant Coordinates: Latitude: ${restaurantLat}, Longitude: ${restaurantLon}`);

            // Find available drivers with valid locations
            console.log('Finding available drivers...');
            const deliveryPersons = await VehicleWithUser.find({
                'user.available': true,
                'user.location.latitude': { $ne: null },
                'user.location.longitude': { $ne: null },
            });

            if (!deliveryPersons || deliveryPersons.length === 0) {
                console.log('No available drivers found.');
                continue; // Skip to the next order if no drivers are found
            }

            console.log(`Found ${deliveryPersons.length} available drivers.`);

            let nearestDriver = null;
            let shortestDistance = Infinity;

            for (const driver of deliveryPersons) {
                const { latitude: driverLat, longitude: driverLon } = driver.user.location;

                // Calculate distances
                const driverToRestaurant = haversineDistance(driverLat, driverLon, restaurantLat, restaurantLon);
                const driverToCustomer = haversineDistance(driverLat, driverLon, customerLat, customerLon);
                const restaurantToCustomer = haversineDistance(restaurantLat, restaurantLon, customerLat, customerLon);

                // Calculate total distance: driver to restaurant + driver to customer + restaurant to customer
                const totalDistance = driverToRestaurant + driverToCustomer + restaurantToCustomer;

                console.log(`Distance from driver ${driver._id} to restaurant: ${driverToRestaurant} km`);
                console.log(`Distance from driver ${driver._id} to customer: ${driverToCustomer} km`);
                console.log(`Distance from restaurant to customer: ${restaurantToCustomer} km`);

                if (totalDistance < shortestDistance) {
                    shortestDistance = totalDistance;
                    nearestDriver = driver;
                }
            }

            console.log("Nearest driver found:", nearestDriver);

            // Ensure nearestDriver is valid and assign delivery
            if (nearestDriver) {
                const deliveryData = {
                    orderid: Order._id,
                    driverid: nearestDriver._id,
                    customerid: customerId,
                    Restuarentid: restaurantId,
                    totalDistance: shortestDistance, // Save total distance
                };

                // nearestDriver.user.available = false; // Mark the driver as unavailable
                // try {
                //     await nearestDriver.save();
                //     console.log(`Driver ${nearestDriver._id} marked as unavailable.`);
                // } catch (err) {
                //     console.error('Error updating driver availability:', err.message);
                // }

                // Order status update

                try {
                    const OrderResponse = await axios.patch(`http://localhost:5001/orders/${Order._id}/status`, { status: "Driver Assigned" });
                    if (OrderResponse.status === 200) {
                        console.log(`Order ${Order._id} status updated to "Driver Assigned".`);
                    } else {
                        console.log(`Failed to update status for Order ${Order._id}`);
                    }
                } catch (err) {
                    console.error('Error updating order status:', err.message);
                }




                // Save the new delivery to the database
                try {
                    const newDelivery = new Delivery(deliveryData);
                    await newDelivery.save();
                    console.log(`Saved delivery for OrderID: ${Order._id} with DriverID: ${nearestDriver._id}`);
                } catch (err) {
                    console.error('Error saving delivery:', err.message);
                }
            } else {
                console.log('No available driver found for this order, skipping delivery assignment.');
            }
        }

        res.status(200).json({ message: 'Driver assignments processed successfully.' });

    } catch (error) {
        console.error('Error processing paid orders:', error.message);
        res.status(500).json({ message: 'Error processing paid orders' });
    }
};


const getDeliveryById = async (req, res) => {
    try {

        const delivery = await Delivery.findOne({ driverid: req.user._id });

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }

        // If the delivery is found, return it
        res.status(200).json(delivery);
    } catch (error) {
        console.error('Error fetching delivery:', error.message);
        res.status(500).json({ message: 'Error fetching delivery' });
    }
};



const updateDeliveryStatus = async (req, res) => {
    try {

        const { status } = req.body;

        let delivery = await Delivery.findOne({ driverid: req.user._id });

        if (!delivery) {
            return res.status(404).json({ message: 'Delivery not found' });
        }


        if (status) {
            delivery.status = status;
        }


        await delivery.save();

        res.status(200).json({
            message: 'Delivery Status updated successfully',
        });

    } catch (err) {
        console.error('Error in update Delivery Status:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


const getAllDeliveriesForDriver = async (req, res) => {
    try {
        const deliveries = await Delivery.find({ driverid: req.user._id });
        res.status(200).json(deliveries);
    } catch (error) {
        console.error('Error fetching deliveries:', error.message);
        res.status(500).json({ message: 'Error fetching deliveries' });
    }
};




exports.DriverAssign = DriverAssign;
exports.getDeliveryById = getDeliveryById;
exports.updateDeliveryStatus = updateDeliveryStatus;
exports.getAllDeliveriesForDriver = getAllDeliveriesForDriver;