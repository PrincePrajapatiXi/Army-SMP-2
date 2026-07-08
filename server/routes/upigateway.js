const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Route to create a UPIGateway order and get the payment URL
router.post('/create', async (req, res) => {
    try {
        const { orderId, amount, customerName, customerEmail } = req.body;
        
        const apiKey = process.env.UPIGATEWAY_API_KEY;
        
        if (!apiKey) {
            console.error('UPIGateway API Key is missing from environment variables!');
            return res.status(500).json({ success: false, error: 'Payment gateway is misconfigured.' });
        }
        
        // Define redirect URL
        // It will return to checkout page with order_id in query parameters
        const redirectUrl = process.env.CLIENT_URL ? `${process.env.CLIENT_URL}/checkout?order_id=${orderId}` : `https://store.armysmp.fun/checkout?order_id=${orderId}`;

        const payload = {
            key: apiKey,
            client_txn_id: orderId, // Our internal order ID
            amount: amount.toString(),
            p_info: 'Minecraft Store Purchase',
            customer_name: customerName || 'MinecraftPlayer',
            customer_email: customerEmail || 'no-email@example.com',
            customer_mobile: '9999999999', // UPIGateway requires a 10 digit mobile number
            redirect_url: redirectUrl
        };

        const response = await fetch('https://merchant.upigateway.com/api/create_order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (data.status) {
            res.json({
                success: true,
                payment_url: data.data.payment_url,
                upigateway_order_id: data.data.order_id
            });
        } else {
            console.error('UPIGateway Create Order Error:', data);
            res.status(400).json({ success: false, error: data.msg || 'Failed to create payment session.' });
        }
    } catch (error) {
        console.error('UPIGateway API Error:', error);
        res.status(500).json({ success: false, error: 'Internal server error while initializing payment.' });
    }
});

// Webhook endpoint to automatically mark payment as successful
// UPIGateway sends URL Encoded form data
router.post('/webhook', express.urlencoded({ extended: true }), async (req, res) => {
    try {
        console.log('Received UPIGateway Webhook:', req.body);
        
        const { client_txn_id, upi_txn_id, status, amount, customer_vpa } = req.body;

        if (status === 'success' || status === 'SUCCESS') {
            // Find order by our internal ID
            const order = await Order.findOne({ id: client_txn_id });
            
            if (order) {
                // Update order to paid
                order.paymentStatus = 'paid';
                order.transactionId = upi_txn_id; // Store the UTR
                order.paymentMethod = `UPI (${customer_vpa || 'Webhook'})`;
                
                await order.save();
                console.log(`✅ Order ${client_txn_id} automatically verified via Webhook. UTR: ${upi_txn_id}`);
            } else {
                console.log(`⚠️ Webhook received for unknown order: ${client_txn_id}`);
            }
        }
        
        // Always respond with 200 OK so UPIGateway stops retrying
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
