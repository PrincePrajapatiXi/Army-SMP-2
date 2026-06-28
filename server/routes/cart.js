const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { optionalAuth } = require('../middleware/authMiddleware');

// Initialize cart in session if not exists
const initCart = (req) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    return req.session.cart;
};

// Helper to calculate total
const calculateTotal = (cart) => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

// Helper to get cart from DB or Session
const getCart = async (req) => {
    if (req.user) {
        let dbCart = await Cart.findOne({ userId: req.userId });
        if (!dbCart) {
            dbCart = new Cart({ userId: req.userId, items: [] });
            await dbCart.save();
        }
        return dbCart.items;
    }
    return initCart(req);
};

// Helper to save cart to DB or Session
const saveCart = async (req, items) => {
    if (req.user) {
        await Cart.findOneAndUpdate(
            { userId: req.userId },
            { items: items, updatedAt: Date.now() },
            { upsert: true, new: true }
        );
    } else {
        req.session.cart = items;
    }
};

// GET /api/cart - Get current cart
router.get('/', optionalAuth, async (req, res) => {
    try {
        const cartItems = await getCart(req);
        const total = calculateTotal(cartItems);

        res.json({
            items: cartItems,
            itemCount: cartItems.reduce((count, item) => count + item.quantity, 0),
            total: total,
            totalDisplay: `₹${total.toFixed(2)}`
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// POST /api/cart/add - Add item to cart
router.post('/add', optionalAuth, async (req, res) => {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
    }

    try {
        const product = await Product.findOne({ id: parseInt(productId) });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const cartItems = await getCart(req);
        const existingItem = cartItems.find(item => item.id == product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cartItems.push({
                id: product.id.toString(),
                name: product.name,
                price: product.price,
                priceDisplay: product.priceDisplay,
                image: product.image,
                quantity: quantity
            });
        }

        await saveCart(req, cartItems);

        res.json({
            message: 'Item added to cart',
            cart: cartItems,
            itemCount: cartItems.reduce((count, item) => count + item.quantity, 0)
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: 'Failed to add item to cart' });
    }
});

// PUT /api/cart/update - Update item quantity
router.put('/update', optionalAuth, async (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
        return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    try {
        let cartItems = await getCart(req);

        if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            cartItems = cartItems.filter(item => item.id != productId);
        } else {
            const item = cartItems.find(item => item.id == productId);
            if (item) {
                item.quantity = quantity;
            } else {
                return res.status(404).json({ error: 'Item not in cart' });
            }
        }

        await saveCart(req, cartItems);

        res.json({
            message: 'Cart updated',
            cart: cartItems,
            itemCount: cartItems.reduce((count, item) => count + item.quantity, 0)
        });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

// DELETE /api/cart/remove/:id - Remove item from cart
router.delete('/remove/:id', optionalAuth, async (req, res) => {
    try {
        let cartItems = await getCart(req);
        const productId = req.params.id;

        cartItems = cartItems.filter(item => item.id != productId);
        await saveCart(req, cartItems);

        res.json({
            message: 'Item removed from cart',
            cart: cartItems,
            itemCount: cartItems.reduce((count, item) => count + item.quantity, 0)
        });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ error: 'Failed to remove from cart' });
    }
});

// DELETE /api/cart/clear - Clear entire cart
router.delete('/clear', optionalAuth, async (req, res) => {
    try {
        await saveCart(req, []);

        res.json({
            message: 'Cart cleared',
            cart: [],
            itemCount: 0
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});

module.exports = router;
