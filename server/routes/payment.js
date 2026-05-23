const express = require('express');
const router = express.Router();
const { Cashfree, CFEnvironment } = require('cashfree-pg');

// POST /api/payment/create-order - Create Cashfree order and get payment_session_id
router.post('/create-order', async (req, res) => {
    try {
        // Initialize Cashfree instance dynamically per request to ensure env variables are loaded correctly
        const cashfree = new Cashfree(
            process.env.CASHFREE_ENV === 'TEST' ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION,
            process.env.CASHFREE_APP_ID,
            process.env.CASHFREE_SECRET_KEY
        );

        const { amount, customerEmail, customerName, customerPhone } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }

        const orderId = `ARMY_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const request = {
            order_amount: parseFloat(amount.toFixed(2)),
            order_currency: 'INR',
            order_id: orderId,
            customer_details: {
                customer_id: `cust_${Date.now()}`,
                customer_name: customerName || 'Army SMP Customer',
                customer_email: customerEmail || 'customer@armysmp.fun',
                customer_phone: customerPhone || '9999999999'
            },
            order_meta: {
                return_url: `${process.env.FRONTEND_URL || 'https://store.armysmp.fun'}/checkout?order_id={order_id}`,
                notify_url: `${process.env.BACKEND_URL || 'https://army-smp-2.onrender.com'}/api/payment/webhook`
            }
        };

        const response = await cashfree.PGCreateOrder(request);

        if (!response || !response.data) {
            return res.status(500).json({ error: 'Failed to create order with Cashfree' });
        }

        res.json({
            success: true,
            orderId: response.data.order_id,
            paymentSessionId: response.data.payment_session_id,
            orderAmount: response.data.order_amount,
            orderCurrency: response.data.order_currency
        });
    } catch (error) {
        console.error('Error creating Cashfree order:', error?.response?.data || error.message);
        res.status(500).json({ 
            error: 'Failed to create payment order',
            details: error?.response?.data?.message || error.message
        });
    }
});

// POST /api/payment/verify - Verify Cashfree payment status
router.post('/verify', async (req, res) => {
    try {
        // Initialize Cashfree instance dynamically per request
        const cashfree = new Cashfree(
            process.env.CASHFREE_ENV === 'TEST' ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION,
            process.env.CASHFREE_APP_ID,
            process.env.CASHFREE_SECRET_KEY
        );

        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        const response = await cashfree.PGOrderFetchPayments(orderId);

        if (!response || !response.data) {
            return res.status(400).json({ error: 'Failed to fetch payment details' });
        }

        const payments = response.data;
        
        // Find successful payment
        const successfulPayment = payments.find(p => p.payment_status === 'SUCCESS');

        if (successfulPayment) {
            res.json({
                success: true,
                verified: true,
                paymentId: successfulPayment.cf_payment_id,
                paymentStatus: successfulPayment.payment_status,
                paymentMethod: successfulPayment.payment_group,
                paymentAmount: successfulPayment.payment_amount,
                orderId: orderId
            });
        } else {
            const latestPayment = payments[0];
            res.json({
                success: false,
                verified: false,
                paymentStatus: latestPayment?.payment_status || 'NO_PAYMENT',
                message: 'Payment not successful'
            });
        }
    } catch (error) {
        console.error('Error verifying Cashfree payment:', error?.response?.data || error.message);
        res.status(500).json({ 
            error: 'Payment verification failed',
            details: error?.response?.data?.message || error.message
        });
    }
});

// POST /api/payment/webhook - Cashfree webhook for server-side payment notifications
// This catches payments even when users don't return to the site
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-webhook-signature'];
        const timestamp = req.headers['x-webhook-timestamp'];
        const clientSecret = process.env.CASHFREE_SECRET_KEY;

        if (!signature || !timestamp) {
            console.error('❌ Webhook Verification Failed: Missing headers');
            return res.status(400).json({ error: 'Missing webhook headers' });
        }

        // Verify the webhook signature using crypto HMAC
        const crypto = require('crypto');
        const message = timestamp + (req.rawBody || '');
        const expectedSignature = crypto
            .createHmac('sha256', clientSecret)
            .update(message)
            .digest('base64');

        if (signature !== expectedSignature) {
            console.error('❌ Webhook Verification Failed: Signature mismatch');
            return res.status(401).json({ error: 'Invalid webhook signature' });
        }

        const { data } = req.body;

        // Cashfree sends payment data in data.payment object
        if (!data || !data.payment) {
            return res.status(400).json({ error: 'Invalid webhook payload' });
        }

        const payment = data.payment;
        const orderId = data.order?.order_id;

        console.log(`🔔 Cashfree Webhook: Order ${orderId} - Status: ${payment.payment_status}`);

        if (payment.payment_status === 'SUCCESS' && orderId) {
            // Update order payment status in database
            const Order = require('../models/Order');
            const updatedOrder = await Order.findOneAndUpdate(
                { cashfreeOrderId: orderId },
                {
                    paymentStatus: 'paid',
                    transactionId: payment.cf_payment_id?.toString() || payment.payment_id,
                    paymentMethod: payment.payment_group || 'Cashfree',
                    updatedAt: new Date()
                },
                { new: true }
            );

            if (updatedOrder) {
                console.log(`✅ Webhook: Order ${updatedOrder.orderNumber} payment status updated to 'paid'`);
            } else {
                console.log(`⚠️ Webhook: No order found with cashfreeOrderId: ${orderId}`);
            }
        }

        // Always respond with 200 to acknowledge receipt
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook processing error:', error.message);
        // Respond with 500/400 for internal errors so Cashfree knows there was a server issue
        res.status(500).json({ error: 'Webhook processing error', details: error.message });
    }
});

module.exports = router;
