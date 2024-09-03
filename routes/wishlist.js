const express = require('express');
const WishlistModel = require('../Model/Wishlistmodel');
const ItemModel = require('../Model/Itemmodel');
const router = express.Router();

// Create wishlist
router.post('/addtowishlist', async (req, res) => {
    const { token, user_id, items } = req.body;

    // Check if required fields are missing
    if (!token || !user_id || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: 'Please provide all required fields and items array' });
    }
    try {
        // Find the wishlist document or create a new one if it doesn't exist
        let wishlist = await WishlistModel.findOne({ user_id });
        if (!wishlist) {
            wishlist = new WishlistModel({
                token,
                user_id,
                items: [],
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

            // Create a wishlist item object
            const wishlistItem = {
                item_id,
                category_id,
                id_laundrytype,
                quantity,
                price: laundryType.price // Include price
            };

            // Check if item already exists in the wishlist
            const existingItemIndex = wishlist.items.findIndex(
                item =>
                    item.item_id.toString() === item_id.toString() &&
                    item.category_id.toString() === category_id.toString() &&
                    item.id_laundrytype.toString() === id_laundrytype.toString()
            );

            if (existingItemIndex > -1) {
                // If the item already exists, update the quantity
                wishlist.items[existingItemIndex].quantity += quantity;
            } else {
                // If the item doesn't exist, push new item
                wishlist.items.push(wishlistItem);
            }
        }
        // Save the wishlist
        await wishlist.save();
        // Return success response with updated wishlist details
        res.status(201).json({
            message: 'Items added to wishlist successfully',
            wishlist
        });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ message: 'Error adding to wishlist', error: error.message });
    }
});
// //remove from wishlist 
router.post('/removefromwishlist', async (req, res) => {
    const { user_id, item_id } = req.body;

    // Check if required fields are missing
    if (!user_id || !item_id) {
        return res.status(400).json({ message: 'Please provide both user_id and item_id' });
    }

    try {
        // Find the wishlist document for the user
        let wishlist = await WishlistModel.findOne({ user_id });
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found for the user' });
        }

        // Find the index of the item to be removed
        const itemIndex = wishlist.items.findIndex(item => item.item_id.toString() === item_id.toString());

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in the wishlist' });
        }

        // Remove the item from the wishlist
        wishlist.items.splice(itemIndex, 1);

        // Save the updated wishlist
        await wishlist.save();

        // Return success response with updated wishlist details
        res.status(200).json({
            message: 'Item removed from wishlist successfully',
            wishlist
        });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ message: 'Error removing from wishlist', error: error.message });
    }
});

module.exports = router;