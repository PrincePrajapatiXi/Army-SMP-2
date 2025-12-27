const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { sendOrderNotification } = require('../services/email');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');

// XSS Sanitization helper - remove HTML tags and scripts
const sanitizeInput = (str) => {
    if (!str || typeof str !== 'string') return str;
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

// POST /api/orders/create - Create a new order
router.post('/create', async (req, res) => {
    try {
        const { minecraftUsername, email, items, platform, couponInfo, transactionId, paymentScreenshot } = req.body;

        if (!minecraftUsername) {
            return res.status(400).json({ error: 'Minecraft username is required' });
        }

        // Sanitize username to prevent XSS
        const sanitizedUsername = sanitizeInput(minecraftUsername.trim());

        // Get cart from request body OR session (fallback)
        const cart = items && items.length > 0 ? items : (req.session?.cart || []);

        if (cart.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // UTR/Transaction ID Validation
        if (transactionId) {
            const trimmedUTR = transactionId.trim();

            // Format validation: UTR should be 12-22 alphanumeric characters
            const utrRegex = /^[a-zA-Z0-9]{12,22}$/;
            if (!utrRegex.test(trimmedUTR)) {
                return res.status(400).json({
                    error: 'Invalid UTR format. UTR should be 12-22 alphanumeric characters.',
                    field: 'transactionId'
                });
            }

            // Duplicate check: Same UTR cannot be used twice
            const existingOrder = await Order.findOne({
                transactionId: trimmedUTR
            });
            if (existingOrder) {
                return res.status(400).json({
                    error: 'This Transaction ID has already been used for another order. Please enter a different UTR.',
                    field: 'transactionId',
                    duplicate: true
                });
            }
        }

        // Calculate subtotal (before discount)
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Apply discount if coupon provided
        const discount = couponInfo?.discount || 0;
        const finalTotal = couponInfo?.finalTotal || (subtotal - discount);

        // Create order object
        const orderData = {
            id: uuidv4(),
            orderNumber: `ARMY-${Date.now().toString(36).toUpperCase()}`,
            minecraftUsername: sanitizedUsername, // Use sanitized username
            email: email || null,
            platform: platform || 'Java', // Java or Bedrock
            items: cart.map(item => ({
                id: item.id,
                name: sanitizeInput(item.name), // Sanitize item names too
                price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity
            })),
            subtotal: subtotal,
            total: finalTotal,
            totalDisplay: `₹${finalTotal.toFixed(2)}`,
            couponInfo: couponInfo || null, // Store coupon info for Discord notification
            status: 'pending', // pending, processing, completed, cancelled
            // Payment tracking
            transactionId: transactionId ? transactionId.trim() : null,
            paymentScreenshot: paymentScreenshot || null,
            paymentStatus: transactionId ? 'pending' : 'pending', // Will be verified by admin
            paymentMethod: 'UPI',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Save order to MongoDB
        const order = new Order(orderData);
        await order.save();

        // Increment coupon usage count if coupon was used
        if (couponInfo && couponInfo.couponCode) {
            try {
                await Coupon.findOneAndUpdate(
                    { code: couponInfo.couponCode.toUpperCase().trim() },
                    { $inc: { usedCount: 1 } }
                );
                console.log(`✅ Coupon ${couponInfo.couponCode} usage incremented`);
            } catch (couponErr) {
                console.error('Failed to increment coupon usage:', couponErr);
                // Don't fail the order for this
            }
        }

        // Clear cart after order
        if (req.session) {
            req.session.cart = [];
        }

        // Send email notification - ASYNC (don't wait, don't block order)
        // Note: Using fire-and-forget because SMTP may timeout on Render
        sendOrderNotification(orderData)
            .then(result => {
                if (result.success) {
                    console.log(`📧 Notification sent for order ${orderData.orderNumber}`);
                } else {
                    console.log(`⚠️ Notification failed for order ${orderData.orderNumber}: ${result.error}`);
                }
            })
            .catch(err => console.error('📧 Notification error:', err.message));

        res.status(201).json({
            message: 'Order created successfully!',
            order: {
                id: orderData.id,
                orderNumber: orderData.orderNumber,
                minecraftUsername: orderData.minecraftUsername,
                items: orderData.items,
                subtotal: orderData.subtotal,
                discount: discount,
                total: orderData.total,
                totalDisplay: orderData.totalDisplay,
                couponApplied: couponInfo?.couponCode || null,
                status: orderData.status,
                createdAt: orderData.createdAt
            }
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// GET /api/orders/:id - Get order by ID
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findOne({
            $or: [{ id: req.params.id }, { orderNumber: req.params.id }]
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// GET /api/orders/user/:username - Get orders by Minecraft username
router.get('/user/:username', async (req, res) => {
    try {
        // Sanitize: escape regex special chars to prevent regex injection
        const sanitizedUsername = req.params.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const userOrders = await Order.find({
            minecraftUsername: { $regex: new RegExp(`^${sanitizedUsername}$`, 'i') }
        }).sort({ createdAt: -1 }); // Newest first

        res.json(userOrders);
    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/orders/email/:email - Get orders by email
router.get('/email/:email', async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email).toLowerCase();
        // Sanitize: escape regex special chars to prevent regex injection
        const sanitizedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const userOrders = await Order.find({
            email: { $regex: new RegExp(`^${sanitizedEmail}$`, 'i') }
        }).sort({ createdAt: -1 }); // Newest first

        res.json(userOrders);
    } catch (error) {
        console.error('Error fetching orders by email:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

module.exports = router;
