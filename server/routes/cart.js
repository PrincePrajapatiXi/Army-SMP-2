const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Load products for validation
const getProducts = () => {
    const filePath = path.join(__dirname, '../data/products.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
};

// Initialize cart in session if not exists
const initCart = (req) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    return req.session.cart;
};

// GET /api/cart - Get current cart
router.get('/', (req, res) => {
    const cart = initCart(req);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({
        items: cart,
        itemCount: cart.reduce((count, item) => count + item.quantity, 0),
        total: total,
        totalDisplay: `₹${total.toFixed(2)}`
    });
});

// POST /api/cart/add - Add item to cart
router.post('/add', (req, res) => {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
        return res.status(400).json({ error: 'Product ID is required' });
    }

    const products = getProducts();
    const product = products.find(p => p.id === parseInt(productId));

    if (!product) {
        return res.status(404).json({ error: 'Product not found' });
    }

    const cart = initCart(req);
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            priceDisplay: product.priceDisplay,
            image: product.image,
            color: product.color,
            quantity: quantity
        });
    }

    req.session.cart = cart;

    res.json({
        message: 'Item added to cart',
        cart: cart,
        itemCount: cart.reduce((count, item) => count + item.quantity, 0)
    });
});

// PUT /api/cart/update - Update item quantity
router.put('/update', (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
        return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    let cart = initCart(req);

    if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        cart = cart.filter(item => item.id !== parseInt(productId));
    } else {
        const item = cart.find(item => item.id === parseInt(productId));
        if (item) {
            item.quantity = quantity;
        } else {
            return res.status(404).json({ error: 'Item not in cart' });
        }
    }

    req.session.cart = cart;

    res.json({
        message: 'Cart updated',
        cart: cart,
        itemCount: cart.reduce((count, item) => count + item.quantity, 0)
    });
});

// DELETE /api/cart/remove/:id - Remove item from cart
router.delete('/remove/:id', (req, res) => {
    let cart = initCart(req);
    const productId = parseInt(req.params.id);

    cart = cart.filter(item => item.id !== productId);
    req.session.cart = cart;

    res.json({
        message: 'Item removed from cart',
        cart: cart,
        itemCount: cart.reduce((count, item) => count + item.quantity, 0)
    });
});

// DELETE /api/cart/clear - Clear entire cart
router.delete('/clear', (req, res) => {
    req.session.cart = [];

    res.json({
        message: 'Cart cleared',
        cart: [],
        itemCount: 0
    });
});

module.exports = router;
