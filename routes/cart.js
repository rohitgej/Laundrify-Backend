const express = require('express');
const CartModel = require('../Model/Cartmodel');
const OrderModel=require('../Model/Ordermodel')
const mongoose = require('mongoose');
const ItemModel=require('../Model/Itemmodel')
const CouponcodeModel = require('../Model/Couponcode');

const router = express.Router(); 
// Adding item to cart 
router.post('/addtocart', async (req, res) => {
    const { token, user_id, items } = req.body;

    // Check if required fields are missing
    if (!token || !user_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Please provide all required fields and items array' });
    }
    try {
        // Find the cart document or create a new one if it doesn't exist
        let cart = await CartModel.findOne({ user_id });

        if (!cart) {
            cart = new CartModel({
                token,
                user_id,
                items: [],
                total_price: 0,
                total_weight: 0
            });
        }

        for (const item of items) {
            const { item_id, category_id, id_laundrytype, quantity } = item;

            if (!item_id || !category_id || !id_laundrytype || !quantity) {
                return res.status(400).json({ message: 'Missing required fields for item' });
            }

            // Fetch product details from the database
            const product = await ItemModel.findOne({
                _id: item_id,
                category_id: category_id,
                'id_laundrytype.id': id_laundrytype
            });

            if (!product) {
                return res.status(404).json({ message: `Product not found for item_id ${item_id}` });
            }

            // Find the matching laundry type in the product
            const laundryType = product.id_laundrytype.find(type => type.id.toString() === id_laundrytype);

            if (!laundryType) {
                return res.status(404).json({ message: `Laundry type not found for id_laundrytype ${id_laundrytype}` });
            }

            // Calculate total price and weight
            const totalPrice = laundryType.price * quantity;
            const totalWeight = product.item_weight * quantity;

            if (isNaN(totalWeight)) {
                return res.status(400).json({ message: 'Invalid weight calculation' });
            }

            // Create a cart item object
            const cartItem = {
                item_id,
                category_id,
                id_laundrytype,
                quantity,
                price: totalPrice,
                weight: totalWeight
            };

            // Check if item already exists in the cart
            const existingItemIndex = cart.items.findIndex(
                item =>
                    item.item_id === item_id &&
                    item.category_id === category_id &&
                    item.id_laundrytype === id_laundrytype
            );

            if (existingItemIndex >= 0) {
                // If item exists, update the quantity, price, and weight
                cart.items[existingItemIndex].quantity += quantity;
                cart.items[existingItemIndex].price += totalPrice;
                cart.items[existingItemIndex].weight += totalWeight;
            } else {
                // If item doesn't exist, push new item
                cart.items.push({
                    ...cartItem,
                    token
                });
            }

            // Update total price and weight of the cart
            cart.total_price += totalPrice;
            cart.total_weight += totalWeight;
        }

        // Save the cart
        await cart.save();

        // Return success response with updated cart details
        res.status(201).json({
            message: 'Items added to cart successfully',
            cart
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ message: 'Error adding to cart', error: error.message });
    }
});

// Incrementing the existing item count by one 
router.put('/incrementcart', async (req, res) => {
    const { user_id, _id } = req.body;

    // Check if required fields are missing
    if (!user_id || !_id) {
        return res.status(400).json({ message: 'Please provide user_id and _id' });
    }

    try {
        // Find the cart document for the specified user_id
        const cart = await CartModel.findOne({ user_id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find the index of the item in the cart using _id
        const itemIndex = cart.items.findIndex(cartItem =>
            cartItem._id.toString() === _id.toString()
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Get the current item from the cart
        const currentItem = cart.items[itemIndex];

        // Fetch the item details from the database
        const item = await ItemModel.findById(currentItem.item_id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found in ItemModel' });
        }

        // Find the price of the specific laundry type
        const laundryType = item.id_laundrytype.find(type => type.id.toString() === currentItem.id_laundrytype.toString());

        if (!laundryType) {
            return res.status(404).json({ message: 'Laundry type not found' });
        }

        const pricePerUnit = laundryType.price;
        const itemWeight = item.item_weight || 0;

        // Increment quantity by 1
        currentItem.quantity += 1;
        currentItem.price = pricePerUnit * currentItem.quantity;
        currentItem.weight = itemWeight * currentItem.quantity;

        // Recalculate total price and weight for the entire cart
        cart.total_price = cart.items.reduce((sum, item) => sum + item.price, 0);
        cart.total_weight = cart.items.reduce((sum, item) => sum + item.weight, 0);

        // Calculate delivery charge based on the total weight
        const delivery_charge = Math.ceil(cart.total_weight / 1000) * 100;

        // Calculate total after adding delivery charge
        const total = cart.total_price + delivery_charge;

        // Update the cart with new values
        cart.delivery_charge = delivery_charge;
        cart.total = total;

        // Update pay_after_discount based on coupon applied status
        cart.pay_after_discount = cart.couponApplied ? cart.total_price - (cart.discount || 0) : cart.total_price;

        // Save the updated cart
        await cart.save();

        // Return success response with updated cart details
        res.status(200).json({ message: 'Cart updated successfully', cart });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ message: 'Error updating cart', error: error.message });
    }
});



// Decrementing the existing item count by one 

router.put('/decrementcart', async (req, res) => {
    const { user_id, _id } = req.body;

    // Check if required fields are missing
    if (!user_id || !_id) {
        return res.status(400).json({ message: 'Please provide user_id and _id' });
    }

    try {
        // Find the cart document for the specified user_id
        const cart = await CartModel.findOne({ user_id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find the index of the item in the cart using _id
        const itemIndex = cart.items.findIndex(cartItem =>
            cartItem._id.toString() === _id.toString()
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Get the current item from the cart
        const currentItem = cart.items[itemIndex];

        // Fetch the item details from the database
        const item = await ItemModel.findById(currentItem.item_id);

        if (!item) {
            return res.status(404).json({ message: 'Item not found in ItemModel' });
        }

        // Find the price of the specific laundry type
        const laundryType = item.id_laundrytype.find(type => type.id.toString() === currentItem.id_laundrytype.toString());

        if (!laundryType) {
            return res.status(404).json({ message: 'Laundry type not found' });
        }

        const pricePerUnit = laundryType.price;
        const itemWeight = item.item_weight || 0;

        // Decrement quantity by 1
        currentItem.quantity -= 1;

        // Ensure quantity does not go below zero
        if (currentItem.quantity < 0) {
            currentItem.quantity = 0;
        }

        currentItem.price = pricePerUnit * currentItem.quantity;
        currentItem.weight = itemWeight * currentItem.quantity;

        // Recalculate total price and weight for the entire cart
        cart.total_price = cart.items.reduce((sum, item) => sum + item.price, 0);
        cart.total_weight = cart.items.reduce((sum, item) => sum + item.weight, 0);

        // Calculate delivery charge based on the total weight
        const delivery_charge = Math.ceil(cart.total_weight / 1000) * 100;

        // Calculate total after adding delivery charge
        const total = cart.total_price + delivery_charge;

        // Update the cart with new values
        cart.delivery_charge = delivery_charge;
        cart.total = total;

        // Update pay_after_discount based on coupon applied status
        cart.pay_after_discount = cart.couponApplied ? cart.total_price - (cart.discount || 0) : cart.total_price;

        // Save the updated cart
        await cart.save();

        // Return success response with updated cart details
        res.status(200).json({ message: 'Cart updated successfully', cart });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ message: 'Error updating cart', error: error.message });
    }
});


// router.put('/decrementcart', async (req, res) => {
//     const { user_id, _id, distance } = req.body;

//     // Check if required fields are missing
//     if (!user_id || !_id || typeof distance !== 'number') {
//         return res.status(400).json({ message: 'Please provide user_id, _id, and distance' });
//     }

//     try {
//         // Find the cart document for the specified user_id
//         const cart = await CartModel.findOne({ user_id });
//         if (!cart) {
//             return res.status(404).json({ message: 'Cart not found' });
//         }

//         // Find the index of the item in the cart using _id
//         const itemIndex = cart.items.findIndex(cartItem =>
//             cartItem._id.toString() === _id.toString()
//         );

//         if (itemIndex === -1) {
//             return res.status(404).json({ message: 'Item not found in cart' });
//         }

//         // Get the current item from the cart
//         const currentItem = cart.items[itemIndex];

//         // Fetch the item details from the database
//         const item = await ItemModel.findById(currentItem.item_id);

//         if (!item) {
//             return res.status(404).json({ message: 'Item not found in ItemModel' });
//         }

//         // Find the price of the specific laundry type
//         const laundryType = item.id_laundrytype.find(type => type.id.toString() === currentItem.id_laundrytype.toString());

//         if (!laundryType) {
//             return res.status(404).json({ message: 'Laundry type not found' });
//         }

//         const pricePerUnit = laundryType.price;
//         const itemWeight = item.item_weight || 0;

//         // Decrement quantity by 1
//         currentItem.quantity -= 1;

//         // Ensure quantity does not go below zero
//         if (currentItem.quantity < 0) {
//             currentItem.quantity = 0;
//         }

//         currentItem.price = pricePerUnit * currentItem.quantity;
//         currentItem.weight = itemWeight * currentItem.quantity;

//         // Recalculate total price and weight for the entire cart
//         cart.total_price = cart.items.reduce((sum, item) => sum + item.price, 0);
//         cart.total_weight = cart.items.reduce((sum, item) => sum + item.weight, 0);

//         // Calculate delivery charge based on the total weight (100 INR per kg)
//         const weight_charge = Math.ceil(cart.total_weight / 1000) * 100;

//         // Calculate delivery charge based on the distance (7 INR per km)
//         const distance_charge = Math.ceil(distance) * 7;

//         // Combine the weight-based and distance-based charges
//         const delivery_charge = weight_charge + distance_charge;

//         // Calculate total after adding delivery charge
//         const total = cart.total_price + delivery_charge;

//         // Update the cart with new values
//         cart.delivery_charge = delivery_charge;
//         cart.total = total;

//         // Update pay_after_discount based on coupon applied status
//         cart.pay_after_discount = cart.couponApplied ? cart.total_price - (cart.discount || 0) : cart.total_price;

//         // Save the updated cart
//         await cart.save();

//         // Return success response with updated cart details
//         res.status(200).json({ message: 'Cart updated successfully', cart });
//     } catch (error) {
//         console.error('Error updating cart:', error);
//         res.status(500).json({ message: 'Error updating cart', error: error.message });
//     }
// });

//Feching all the items in cart 

router.post('/getCart', async (req, res) => {
    const { user_id } = req.body; // Use request body for POST requests
    if (!user_id) {
        return res.status(400).json({ message: 'Please provide a user_id' });
    }
    try {
        // Fetch the cart for the specific user_id
        const cart = await CartModel.findOne({ user_id });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found for the given user_id' });
        }
        // Calculate pay_after_discount, delivery_charge, and total
        const discount = cart.discount || 0; // Ensure discount is not undefined
        const pay_after_discount = cart.total_price - discount;
        
        const delivery_charge = Math.ceil(cart.total_weight / 1000) * 100; // Calculate based on total weight in grams
        const total = pay_after_discount + delivery_charge;

        // Update the cart with calculated values
        cart.pay_after_discount = pay_after_discount;
        cart.delivery_charge = delivery_charge;
        cart.total = total; // Ensure `total` is added to the schema if it doesn't exist

        // Save the updated cart
        await cart.save();

        // Return the items and other details from the cart
        return res.status(200).json({
            message: 'Items found',
            token:cart.token,
            items: cart.items,
            total_price: cart.total_price,
            total_weight: cart.total_weight,
            discount: discount,
            pay_after_discount: pay_after_discount,
            delivery_charge: delivery_charge,
            total: total
        });
    } catch (error) {
        console.error('Error fetching cart:', error.message);
        res.status(500).json({ message: 'Error fetching cart', error: error.message });
    }
});

// router.post('/getCart', async (req, res) => {
//     const { user_id, distance } = req.body; // Use request body for POST requests
//     if (!user_id || typeof distance !== 'number') {
//         return res.status(400).json({ message: 'Please provide a user_id and distance' });
//     }

//     try {
//         // Fetch the cart for the specific user_id
//         const cart = await CartModel.findOne({ user_id });

//         if (!cart) {
//             return res.status(404).json({ message: 'Cart not found for the given user_id' });
//         }

//         // Calculate pay_after_discount, delivery_charge, and total
//         const discount = cart.discount || 0; // Ensure discount is not undefined
//         const pay_after_discount = cart.total_price - discount;
        
//         // Calculate delivery charges
//         const weight_charge = Math.ceil(cart.total_weight / 1000) * 100; // Based on total weight in grams
//         const distance_charge = Math.ceil(distance) * 7; // Based on distance in kilometers

//         // Combine both charges
//         const delivery_charge = weight_charge + distance_charge;
//         const total = pay_after_discount + delivery_charge;

//         // Update the cart with calculated values
//         cart.pay_after_discount = pay_after_discount;
//         cart.delivery_charge = delivery_charge;
//         cart.total = total; // Ensure `total` is added to the schema if it doesn't exist

//         // Save the updated cart
//         await cart.save();

//         // Return the items and other details from the cart
//         return res.status(200).json({
//             message: 'Items found',
//             token: cart.token,
//             items: cart.items,
//             total_price: cart.total_price,
//             total_weight: cart.total_weight,
//             discount: discount,
//             pay_after_discount: pay_after_discount,
//             delivery_charge: delivery_charge,
//             total: total
//         });
//     } catch (error) {
//         console.error('Error fetching cart:', error.message);
//         res.status(500).json({ message: 'Error fetching cart', error: error.message });
//     }
// });


// Removing an item from cart 
router.put('/removefromcart', async (req, res) => {
    const { user_id, _id } = req.body;

    // Check if required fields are missing
    if (!user_id || !_id) {
        return res.status(400).json({ message: 'Please provide user_id and _id of the item' });
    }

    try {
        // Find the cart document for the specified user_id
        let cart = await CartModel.findOne({ user_id });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Find the index of the item in the cart using _id
        const itemIndex = cart.items.findIndex(cartItem =>
            cartItem._id.toString() === _id.toString()
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Remove the item from the cart
        const removedItem = cart.items[itemIndex];
        cart.items.splice(itemIndex, 1);

        // Recalculate total price and weight for the entire cart
        cart.total_price -= removedItem.price;
        cart.total_weight -= removedItem.weight;

        // Save the updated cart
        await cart.save();

        // Return success response with updated cart details
        res.status(200).json({ message: 'Item removed successfully', cart });
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).json({ message: 'Error removing item from cart', error: error.message });
    }
});
// Applying coupon 
router.post('/apply-coupon', async (req, res) => {
    try {
        const { user_id, code } = req.body;

        // Find the user's cart
        const cart = await CartModel.findOne({ user_id });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found for the user' });
        }

        // Check if a coupon has already been applied
        if (cart.couponApplied) {
            return res.status(400).json({ message: 'A coupon has already been applied to this cart' });
        }

        // Find the coupon
        const coupon = await CouponcodeModel.findOne({ 
            code,
            isActive: true,
            expiryDate: { $gt: new Date() } // Ensure coupon is not expired
        });

        // Check if the coupon is valid
        if (!coupon) {
            return res.status(400).json({ message: 'Coupon not valid' });
        }

        // Check if the coupon usage limit has been reached
        if (coupon.usageLimit <= 0) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        // Calculate the new total price after discount
        cart.discount = coupon.discount;

        // Mark the coupon as applied
        cart.couponApplied = true;

        // Save the updated cart
        await cart.save();

        // Decrement the usage limit of the coupon
        coupon.usageLimit -= 1;
        await coupon.save();

        // Respond with the user_id, discount amount, and totalPriceAfterDiscount
        res.status(200).json({
            message: 'Coupon applied successfully',
            user_id,
            discount: cart.discount,
        });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
// Removing the Applied coupon 
router.post('/remove-coupon', async (req, res) => {
    try {
        const { user_id } = req.body;

        // Find the user's cart in CartModel
        const cart = await CartModel.findOne({ user_id });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found for the user' });
        }

        // Check if a coupon is applied
        if (!cart.couponApplied) {
            return res.status(400).json({ message: 'No coupon applied to the cart' });
        }

        // Reset the discount
        cart.discount = 0;
        cart.couponApplied = false;

        // Save the updated cart
        await cart.save();

        // Respond with the updated cart details
        res.status(200).json({
            message: 'Coupon removed successfully',
            user_id: user_id,
            discount: cart.discount,
            couponApplied: cart.couponApplied
        });
    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;