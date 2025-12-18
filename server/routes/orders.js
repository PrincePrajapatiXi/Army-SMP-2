const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { sendOrderNotification } = require('../services/email');

const ordersFilePath = path.join(__dirname, '../data/orders.json');

// Load orders from file
const getOrders = () => {
    try {
        const data = fs.readFileSync(ordersFilePath, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
};

// Save orders to file
const saveOrders = (orders) => {
    fs.writeFileSync(ordersFilePath, JSON.stringify(orders, null, 2));
};

// POST /api/orders/create - Create a new order
router.post('/create', async (req, res) => {
    const { minecraftUsername, email } = req.body;

    if (!minecraftUsername) {
        return res.status(400).json({ error: 'Minecraft username is required' });
    }

    // Get cart from session
    const cart = req.session.cart || [];

    if (cart.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order
    const order = {
        id: uuidv4(),
        orderNumber: `ARMY-${Date.now().toString(36).toUpperCase()}`,
        minecraftUsername: minecraftUsername.trim(),
        email: email || null,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity
        })),
        total: total,
        totalDisplay: `₹${total.toFixed(2)}`,
        status: 'pending', // pending, processing, completed, cancelled
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    // Save order
    const orders = getOrders();
    orders.push(order);
    saveOrders(orders);

    // Clear cart after order
    req.session.cart = [];

    // Send email notification (async, don't wait for it)
    sendOrderNotification(order).then(result => {
        if (result.success) {
            console.log(`📧 Email sent for order ${order.orderNumber}`);
        } else {
            console.log(`⚠️ Email failed for order ${order.orderNumber}: ${result.error}`);
        }
    });

    res.status(201).json({
        message: 'Order created successfully!',
        order: {
            id: order.id,
            orderNumber: order.orderNumber,
            minecraftUsername: order.minecraftUsername,
            items: order.items,
            total: order.total,
            totalDisplay: order.totalDisplay,
            status: order.status,
            createdAt: order.createdAt
        }
    });
});

// GET /api/orders/:id - Get order by ID
router.get('/:id', (req, res) => {
    const orders = getOrders();
    const order = orders.find(o => o.id === req.params.id || o.orderNumber === req.params.id);

    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
});

// GET /api/orders/user/:username - Get orders by Minecraft username
router.get('/user/:username', (req, res) => {
    const orders = getOrders();
    const userOrders = orders.filter(
        o => o.minecraftUsername.toLowerCase() === req.params.username.toLowerCase()
    );

    res.json(userOrders);
});

module.exports = router;
