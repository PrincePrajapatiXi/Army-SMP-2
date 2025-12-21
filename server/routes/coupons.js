const express = require('express');
const router = express.Router();
const Coupon = require('../models/Coupon');

// GET /api/coupons/validate/:code - Validate a coupon code
router.get('/validate/:code', async (req, res) => {
    try {
        const code = req.params.code.toUpperCase().trim();
        const coupon = await Coupon.findOne({ code });

        if (!coupon) {
            return res.status(404).json({
                valid: false,
                error: 'Invalid coupon code'
            });
        }

        // Check if active
        if (!coupon.isActive) {
            return res.status(400).json({
                valid: false,
                error: 'This coupon is no longer active'
            });
        }

        // Check if expired
        if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
            return res.status(400).json({
                valid: false,
                error: 'This coupon has expired'
            });
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({
                valid: false,
                error: 'This coupon has reached its usage limit'
            });
        }

        res.json({
            valid: true,
            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                minOrderAmount: coupon.minOrderAmount,
                maxDiscount: coupon.maxDiscount
            }
        });
    } catch (error) {
        console.error('Error validating coupon:', error);
        res.status(500).json({ valid: false, error: 'Failed to validate coupon' });
    }
});

// POST /api/coupons/apply - Apply coupon and calculate discount
router.post('/apply', async (req, res) => {
    try {
        const { code, orderTotal } = req.body;

        if (!code || orderTotal === undefined) {
            return res.status(400).json({
                success: false,
                error: 'Coupon code and order total are required'
            });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                error: 'Invalid coupon code'
            });
        }

        // Check if active
        if (!coupon.isActive) {
            return res.status(400).json({
                success: false,
                error: 'This coupon is no longer active'
            });
        }

        // Check if expired
        if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
            return res.status(400).json({
                success: false,
                error: 'This coupon has expired'
            });
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({
                success: false,
                error: 'This coupon has reached its usage limit'
            });
        }

        // Check minimum order amount
        if (orderTotal < coupon.minOrderAmount) {
            return res.status(400).json({
                success: false,
                error: `Minimum order amount of ₹${coupon.minOrderAmount} required`
            });
        }

        // Calculate discount
        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = (orderTotal * coupon.discountValue) / 100;
            // Apply max discount cap if set
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else {
            // Fixed discount
            discount = coupon.discountValue;
        }

        // Don't let discount exceed order total
        if (discount > orderTotal) {
            discount = orderTotal;
        }

        const finalTotal = orderTotal - discount;

        res.json({
            success: true,
            couponCode: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
            discount: Math.round(discount * 100) / 100, // Round to 2 decimals
            originalTotal: orderTotal,
            finalTotal: Math.round(finalTotal * 100) / 100
        });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ success: false, error: 'Failed to apply coupon' });
    }
});

// POST /api/coupons/use - Mark coupon as used (call after order success)
router.post('/use', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, error: 'Coupon code required' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

        if (coupon) {
            coupon.usedCount += 1;
            await coupon.save();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking coupon as used:', error);
        res.status(500).json({ success: false, error: 'Failed to update coupon usage' });
    }
});

module.exports = router;
