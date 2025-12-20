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
    const { minecraftUsername, email, items, platform, couponInfo } = req.body;

    if (!minecraftUsername) {
        return res.status(400).json({ error: 'Minecraft username is required' });
    }

    // Get cart from request body OR session (fallback)
    const cart = items && items.length > 0 ? items : (req.session.cart || []);

    if (cart.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
    }

    // Calculate subtotal (before discount)
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Apply discount if coupon provided
    const discount = couponInfo?.discount || 0;
    const finalTotal = couponInfo?.finalTotal || (subtotal - discount);

    // Create order
    const order = {
        id: uuidv4(),
        orderNumber: `ARMY-${Date.now().toString(36).toUpperCase()}`,
        minecraftUsername: minecraftUsername.trim(),
        email: email || null,
        platform: platform || 'Java', // Java or Bedrock
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity
        })),
        subtotal: subtotal,
        total: finalTotal,
        totalDisplay: `₹${finalTotal.toFixed(2)}`,
        couponInfo: couponInfo || null, // Store coupon info for Discord notification
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

    // Send email notification - ASYNC (don't wait, don't block order)
    // Note: Using fire-and-forget because SMTP may timeout on Render
    sendOrderNotification(order)
        .then(result => {
            if (result.success) {
                console.log(`📧 Email sent for order ${order.orderNumber}`);
            } else {
                console.log(`⚠️ Email failed for order ${order.orderNumber}: ${result.error}`);
            }
        })
        .catch(err => console.error('📧 Email error:', err.message));

    res.status(201).json({
        message: 'Order created successfully!',
        order: {
            id: order.id,
            orderNumber: order.orderNumber,
            minecraftUsername: order.minecraftUsername,
            items: order.items,
            subtotal: order.subtotal,
            discount: discount,
            total: order.total,
            totalDisplay: order.totalDisplay,
            couponApplied: couponInfo?.couponCode || null,
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
