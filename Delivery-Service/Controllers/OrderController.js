const axios = require('axios');
const VehicleWithUser = require('../Models/Driver');
const Delivery = require('../Models/Delivery');
const haversineDistance = require('../Utils/DistanceCalculation');

const DriverAssign = async (req, res) => {
    try {

        const Payments = await axios.get('http://localhost:5002/api/payments/customer/GetAllPayments');

        const paidPayments = Payments.filter(Payments => Payments.Payments === "success");


        for (const payment of paidPayments) {

            const PaidorderId = payment.orderId;


            const response = await axios.get(`http://localhost:5001/orders/${PaidorderId}`);
            const orders = response.data.orders;



            for (const order of paidOrders) {
                const CustomerID = order.customerId;
                const RestaurantID = order.restaurantId;

                let restaurant;
                let customer;

                try {
                    const restaurantResponse = await axios.get(`http://localhost:4000/api/restaurant/${RestaurantID}`);
                    restaurant = restaurantResponse.data;

                    const customerResponse = await axios.get(`http://localhost:7000/api/customer/${CustomerID}`);
                    customer = customerResponse.data;
                } catch (err) {
                    console.error('Error fetching restaurant or customer data:', err.message);
                    continue; // Skip this iteration if fetching restaurant or customer data fails
                }

                const restaurantLat = restaurant.latitude;
                const restaurantLon = restaurant.longitude;

                const deliveryPersons = await VehicleWithUser.find({
                    'user.available': true,
                    'user.location.latitude': { $ne: null },
                    'user.location.longitude': { $ne: null }, // Fixed the typo here
                });

                let nearestDriver = null;
                let shortestDistance = Infinity;

                for (const driver of deliveryPersons) {
                    const driverLat = driver.user.location.latitude;
                    const driverLon = driver.user.location.longitude; // Fixed the typo here
                    const distance = haversineDistance(driverLat, driverLon, restaurantLat, restaurantLon);

                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        nearestDriver = driver;
                    }
                }

                if (nearestDriver) {
                    const deliveryData = {
                        orderid: order._id,
                        driverid: nearestDriver._id,
                        customerid: customer._id,
                        longitude: nearestDriver.user.location.longitude, // Fixed the typo here
                        latitude: nearestDriver.user.location.latitude,
                    };

                    const newDelivery = new Delivery(deliveryData);

                    try {
                        await newDelivery.save();
                        console.log(`Saved delivery for OrderID: ${order._id} with DriverID: ${nearestDriver._id}`);
                    } catch (err) {
                        console.error('Error saving delivery:', err.message);
                    }
                }
            }

            res.status(200).json({ message: 'Driver assignments processed successfully.' });
        } catch (error) {
            console.error('Error processing paid orders:', error.message);
            res.status(500).json({ message: 'Error processing paid orders' });
        }
    };

    exports.DriverAssign = DriverAssign;
