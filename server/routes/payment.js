const express = require('express');
const router = express.Router();
const { Cashfree } = require('cashfree-pg');

// Initialize Cashfree
Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = process.env.CASHFREE_ENV === 'TEST' 
    ? Cashfree.Environment.SANDBOX 
    : Cashfree.Environment.PRODUCTION;

// POST /api/payment/create-order - Create Cashfree order and get payment_session_id
router.post('/create-order', async (req, res) => {
    try {
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
                notify_url: process.env.CASHFREE_WEBHOOK_URL || undefined
            }
        };

        const response = await Cashfree.PGCreateOrder("2023-08-01", request);

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
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ error: 'Order ID is required' });
        }

        const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);

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

module.exports = router;
