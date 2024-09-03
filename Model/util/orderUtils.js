

const OrderModel = require('../Ordermodel'); // Adjust the path as necessary

// Function to get the next order number
async function getNextOrderNumber() {
    try {
        // Find the order with the highest Customer_OrderNumber
        const lastOrder = await OrderModel.findOne().sort({ Customer_OrderNumber: -1 });

        // If no orders exist, start from 100
        const lastOrderNumber = lastOrder ? lastOrder.Customer_OrderNumber : 100;

        // Return the next order number
        return lastOrderNumber + 1;
    } catch (error) {
        console.error('Error generating next order number:', error.message);
        throw new Error('Could not generate order number');
    }
}

module.exports = getNextOrderNumber;
