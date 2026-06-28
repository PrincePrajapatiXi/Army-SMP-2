const express = require('express');
const router = express.Router();
const { sendStatusUpdateNotification, sendOTPEmail } = require('../services/email');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Promotion = require('../models/Promotion');
const User = require('../models/User');
const OTP = require('../models/OTP');
const Badge = require('../models/Badge');
const BannedIP = require('../models/BannedIP');
const SystemConfig = require('../models/SystemConfig');
const { generateAdminToken, requireAdminAuth } = require('../middleware/authMiddleware');
const { getClientIP, wafStats } = require('../middleware/waf');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { sendLoginAlertEmail } = require('../services/email');
const { ipsStats } = require('../middleware/ips');

// Admin credentials from environment variable (REQUIRED - no default for security)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;


// POST /login - Step 1: Verify password
router.post('/login', async (req, res) => {
    const ip = getClientIP(req);
    const { password } = req.body;
    const LoginAttempt = require('../models/LoginAttempt');
    const BannedIP = require('../models/BannedIP');

    try {
        const now = new Date();

        // 1. Database-Driven Absolute Ban Validation
        const ban = await BannedIP.isBanned(ip);
        if (ban) {
            const remainingMs = Math.max(0, new Date(ban.expiresAt).getTime() - Date.now());
            return res.status(403).json({ 
                message: "Access denied. Your IP has been flagged for security reasons.",
                remainingMs
            });
        }

        // 2. Verify Password
        const isPasswordCorrect = (password === process.env.ADMIN_PASSWORD); 

        if (isPasswordCorrect) {
            await LoginAttempt.deleteMany({ ip });
            
            // Check if TOTP is setup
            const totpConfig = await SystemConfig.findOne({ key: 'admin_totp_secret' });

            // Generate and send OTP (Fallback/Primary via Email)
            const otpCode = await OTP.createOTP(ADMIN_EMAIL, 'admin2FA');
            await sendOTPEmail(ADMIN_EMAIL, otpCode, 'admin2FA', 'Admin');
            
            if (!totpConfig || !totpConfig.value) {
                // Generate secret and QR code here
                const secret = speakeasy.generateSecret({ name: 'Army SMP 2 Store' });
                
                // Save it temporarily
                await SystemConfig.findOneAndUpdate(
                    { key: 'admin_totp_secret_pending' },
                    { value: secret.base32 },
                    { upsert: true, new: true }
                );
                
                const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);
                
                return res.status(200).json({ 
                    success: true, 
                    require2FA: true,
                    requireTotpSetup: true,
                    qrCode: qrCodeDataUrl,
                    secret: secret,
                    message: "Password verified. Please set up Google Authenticator by scanning the QR code." 
                });
            }

            return res.status(200).json({ 
                success: true, 
                require2FA: true,
                message: "Password verified. Enter your Authenticator code or the code sent to your email." 
            });
        }

        // --- PASSWORD WRONG: TRIGGER DECEPTION TRAP ---
        await LoginAttempt.create({ ip });

        // Fetch failures inside a strict rolling 7-day window
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const failedCount = await LoginAttempt.countDocuments({ 
            ip, 
            createdAt: { $gte: sevenDaysAgo } 
        });

        // 2nd Failed Attempt -> Commit hard lock 24-hour Ban directly to MongoDB
        if (failedCount >= 2) {
            const banDuration = 24 * 60 * 60 * 1000; // 24 hours
            await BannedIP.banIP(ip, 'admin_login_failed', banDuration);
            await LoginAttempt.deleteMany({ ip }); // Wipe tracking space

            return res.status(403).json({ 
                message: "Access denied. Your IP has been flagged for security reasons.",
                remainingMs: banDuration
            });
        }

        // 1st Failed Attempt
        if (failedCount === 1) {
            return res.status(401).json({ 
                message: "Incorrect password. Please try again." 
            });
        }

    } catch (error) {
        console.error("Auth System Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});


// POST /api/admin/verify-2fa - Step 2: Verify OTP to complete login
router.post('/verify-2fa', async (req, res) => {
    try {
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({ success: false, error: 'Verification code required' });
        }

        let totpValid = false;
        
        // Check active TOTP
        const totpConfig = await SystemConfig.findOne({ key: 'admin_totp_secret' });
        if (totpConfig && totpConfig.value) {
            totpValid = speakeasy.totp.verify({ secret: totpConfig.value, encoding: 'base32', token: otp });
        }
        
        // Check pending TOTP (if just setting up)
        if (!totpValid) {
            const pendingTotp = await SystemConfig.findOne({ key: 'admin_totp_secret_pending' });
            if (pendingTotp && pendingTotp.value) {
                const isValidPending = speakeasy.totp.verify({ secret: pendingTotp.value, encoding: 'base32', token: otp });
                if (isValidPending) {
                    // Promote to active
                    await SystemConfig.findOneAndUpdate(
                        { key: 'admin_totp_secret' },
                        { value: pendingTotp.value },
                        { upsert: true }
                    );
                    await SystemConfig.deleteOne({ key: 'admin_totp_secret_pending' });
                    totpValid = true;
                }
            }
        }

        // Verify Email OTP
        const result = await OTP.verifyOTP(ADMIN_EMAIL, otp, 'admin2FA');

        if (result.valid || totpValid) {
            // Send login alert
            const ip = getClientIP(req);
            const time = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            sendLoginAlertEmail(ip, time).catch(e => console.error("Alert failed:", e));

            // Generate admin JWT token
            const token = generateAdminToken(ADMIN_EMAIL);
            return res.json({
                success: true,
                message: 'Login successful! Welcome Admin.',
                token: token
            });
        } else {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired verification code'
            });
        }
    } catch (error) {
        console.error('2FA verification error:', error);
        res.status(500).json({ success: false, error: 'Verification failed' });
    }
});

// POST /api/admin/resend-2fa - Resend OTP
router.post('/resend-2fa', async (req, res) => {
    try {
        // Generate new OTP
        const otp = await OTP.createOTP(ADMIN_EMAIL, 'admin2FA');

        // Send OTP email
        await sendOTPEmail(ADMIN_EMAIL, otp, 'admin2FA', 'Admin');

        // Mask email for display
        const emailParts = ADMIN_EMAIL.split('@');
        const maskedEmail = emailParts[0].substring(0, 3) + '***@' + emailParts[1];

        res.json({
            success: true,
            message: `New OTP sent to ${maskedEmail}`
        });
    } catch (error) {
        console.error('Resend 2FA error:', error);
        res.status(500).json({ success: false, error: 'Failed to resend code' });
    }
});

// DELETE /api/admin/orders/bulk - Bulk delete orders
router.delete('/orders/bulk', requireAdminAuth, async (req, res) => {
    try {
        const { orderIds } = req.body;

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({ error: 'Order IDs array required' });
        }

        // Delete where id is in orderIds OR orderNumber is in orderIds
        const result = await Order.deleteMany({
            $or: [
                { id: { $in: orderIds } },
                { orderNumber: { $in: orderIds } }
            ]
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'No matching orders found' });
        }

        res.json({
            success: true,
            message: `${result.deletedCount} orders deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ error: 'Failed to delete orders' });
    }
});

// GET /api/admin/orders - Get all orders (sorted by date, newest first)
router.get('/orders', requireAdminAuth, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/admin/stats - Get sales analytics
router.get('/stats', requireAdminAuth, async (req, res) => {
    try {
        const orders = await Order.find();
        const today = new Date().toDateString();

        const stats = {
            totalOrders: orders.length,
            totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
            pendingOrders: orders.filter(o => o.status === 'pending').length,
            processingOrders: orders.filter(o => o.status === 'processing').length,
            completedOrders: orders.filter(o => o.status === 'completed').length,
            cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
            todayOrders: orders.filter(o =>
                new Date(o.createdAt).toDateString() === today
            ).length,
            todayRevenue: orders
                .filter(o => new Date(o.createdAt).toDateString() === today)
                .reduce((sum, o) => sum + (o.total || 0), 0)
        };

        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// PUT /api/admin/orders/:id/status - Update order status
router.put('/orders/:id/status', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'completed', 'cancelled', 'processing'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const order = await Order.findOne({ $or: [{ id }, { orderNumber: id }] });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const previousStatus = order.status;
        order.status = status;
        order.updatedAt = new Date();
        await order.save();

        // Send Discord notification when order status changes to completed or cancelled
        if ((status === 'completed' || status === 'cancelled') && previousStatus !== status) {
            sendStatusUpdateNotification(order, status)
                .then(result => {
                    if (result.success) {
                        console.log(`Γ£à ${status.charAt(0).toUpperCase() + status.slice(1)} notification sent for ${order.orderNumber}`);
                    }
                })
                .catch(err => console.error('Notification error:', err));
        }

        res.json({
            message: 'Status updated successfully',
            order
        });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// PUT /api/admin/orders/:id/payment - Update payment status
router.put('/orders/:id/payment', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;

        if (!['pending', 'paid', 'failed', 'refunded'].includes(paymentStatus)) {
            return res.status(400).json({ error: 'Invalid payment status' });
        }

        const order = await Order.findOne({ $or: [{ id }, { orderNumber: id }] });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const previousPaymentStatus = order.paymentStatus;
        order.paymentStatus = paymentStatus;
        order.updatedAt = new Date();

        if (paymentStatus === 'paid') {
            order.paymentVerifiedAt = new Date();
        }

        await order.save();

        // Send Discord notification for payment status change
        if (previousPaymentStatus !== paymentStatus) {
            const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
            if (DISCORD_WEBHOOK_URL) {
                const statusEmoji = paymentStatus === 'paid' ? 'Γ£à' :
                    paymentStatus === 'failed' ? 'Γ¥î' :
                        paymentStatus === 'refunded' ? '≡ƒÆ╕' : 'ΓÅ│';
                const color = paymentStatus === 'paid' ? 0x22c55e :
                    paymentStatus === 'failed' ? 0xef4444 :
                        paymentStatus === 'refunded' ? 0xf59e0b : 0xffa500;

                const discordPayload = {
                    embeds: [{
                        title: `${statusEmoji} Payment ${paymentStatus.toUpperCase()}: ${order.orderNumber}`,
                        color: color,
                        fields: [
                            { name: '≡ƒÄ« Username', value: order.minecraftUsername, inline: true },
                            { name: '≡ƒÆ░ Amount', value: order.totalDisplay || `Γé╣${order.total}`, inline: true },
                            { name: '≡ƒÆ│ Transaction ID', value: order.transactionId || 'Not provided', inline: true },
                            { name: '≡ƒôï Order Status', value: order.status.toUpperCase(), inline: true }
                        ],
                        footer: { text: 'Army SMP 2 - Payment Update' },
                        timestamp: new Date().toISOString()
                    }]
                };

                fetch(DISCORD_WEBHOOK_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(discordPayload)
                }).catch(err => console.error('Discord notification error:', err));
            }
        }

        res.json({
            message: 'Payment status updated successfully',
            order
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ error: 'Failed to update payment status' });
    }
});

// DELETE /api/admin/orders/:id - Delete an order
router.delete('/orders/:id', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Order.deleteOne({ $or: [{ id }, { orderNumber: id }] });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

// ==================== PRODUCT MANAGEMENT ====================

// GET /api/admin/products - Get all products
router.get('/products', requireAdminAuth, async (req, res) => {
    try {
        const products = await Product.find().sort({ id: 1 });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// POST /api/admin/products - Add new product
router.post('/products', requireAdminAuth, async (req, res) => {
    try {
        const { name, price, category, image, description, color, features } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({ error: 'Name, price, and category are required' });
        }

        // Generate new ID (find max ID)
        const lastProduct = await Product.findOne().sort({ id: -1 });
        const newId = lastProduct ? lastProduct.id + 1 : 1;

        const newProduct = new Product({
            id: newId,
            name,
            price: parseFloat(price),
            priceDisplay: `Γé╣${price}`,
            color: color || '#ffffff',
            category,
            image: image || '/images/stone.png',
            description: description || '',
            features: features || []
        });

        await newProduct.save();

        res.json({
            success: true,
            message: 'Product added successfully',
            product: newProduct
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// PUT /api/admin/products/:id - Update product
router.put('/products/:id', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const product = await Product.findOne({ id: parseInt(id) });

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (updates.name) product.name = updates.name;
        if (updates.price) {
            product.price = parseFloat(updates.price);
            product.priceDisplay = `Γé╣${product.price}`;
        }
        if (updates.category) product.category = updates.category;
        if (updates.image) product.image = updates.image;
        if (updates.description !== undefined) product.description = updates.description;
        if (updates.color) product.color = updates.color;
        if (updates.features) product.features = updates.features;
        if (updates.isFeatured !== undefined) product.isFeatured = updates.isFeatured;
        if (updates.displayOrder !== undefined) product.displayOrder = updates.displayOrder;

        await product.save();

        res.json({
            success: true,
            message: 'Product updated successfully',
            product
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// DELETE /api/admin/products/:id - Delete product
router.delete('/products/:id', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Product.deleteOne({ id: parseInt(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// ==================== COUPON MANAGEMENT ====================

// GET /api/admin/coupons - Get all coupons
router.get('/coupons', requireAdminAuth, async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ error: 'Failed to fetch coupons' });
    }
});

// POST /api/admin/coupons - Create new coupon
router.post('/coupons', requireAdminAuth, async (req, res) => {
    try {
        const { code, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, expiresAt } = req.body;

        if (!code || !discountValue) {
            return res.status(400).json({ error: 'Coupon code and discount value are required' });
        }

        // Check if coupon code already exists
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
        if (existingCoupon) {
            return res.status(400).json({ error: 'Coupon code already exists' });
        }

        const newCoupon = new Coupon({
            code: code.toUpperCase().trim(),
            discountType: discountType || 'percentage',
            discountValue: parseFloat(discountValue),
            minOrderAmount: parseFloat(minOrderAmount) || 0,
            maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
            usageLimit: usageLimit ? parseInt(usageLimit) : null,
            expiresAt: expiresAt || null,
            isActive: true
        });

        await newCoupon.save();

        res.json({
            success: true,
            message: 'Coupon created successfully',
            coupon: newCoupon
        });
    } catch (error) {
        console.error('Error creating coupon:', error);
        res.status(500).json({ error: 'Failed to create coupon' });
    }
});

// PUT /api/admin/coupons/:id - Update coupon
router.put('/coupons/:id', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        // Update fields
        if (updates.code) coupon.code = updates.code.toUpperCase().trim();
        if (updates.discountType) coupon.discountType = updates.discountType;
        if (updates.discountValue !== undefined) coupon.discountValue = parseFloat(updates.discountValue);
        if (updates.minOrderAmount !== undefined) coupon.minOrderAmount = parseFloat(updates.minOrderAmount);
        if (updates.maxDiscount !== undefined) coupon.maxDiscount = updates.maxDiscount ? parseFloat(updates.maxDiscount) : null;
        if (updates.usageLimit !== undefined) coupon.usageLimit = updates.usageLimit ? parseInt(updates.usageLimit) : null;
        if (updates.expiresAt !== undefined) coupon.expiresAt = updates.expiresAt || null;
        if (updates.isActive !== undefined) coupon.isActive = updates.isActive;

        await coupon.save();

        res.json({
            success: true,
            message: 'Coupon updated successfully',
            coupon
        });
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ error: 'Failed to update coupon' });
    }
});

// DELETE /api/admin/coupons/:id - Delete coupon
router.delete('/coupons/:id', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Coupon.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        res.json({
            success: true,
            message: 'Coupon deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).json({ error: 'Failed to delete coupon' });
    }
});

// PUT /api/admin/coupons/:id/toggle - Toggle coupon active status
router.put('/coupons/:id/toggle', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findById(id);

        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        res.json({
            success: true,
            message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
            coupon
        });
    } catch (error) {
        console.error('Error toggling coupon:', error);
        res.status(500).json({ error: 'Failed to toggle coupon status' });
    }
});

// ==================== PROMOTIONS MANAGEMENT ====================

// GET /api/admin/promotions - Get all promotions
router.get('/promotions', requireAdminAuth, async (req, res) => {
    try {
        const promotions = await Promotion.find().sort({ position: 1 });
        res.json(promotions);
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ error: 'Failed to fetch promotions' });
    }
});

// POST /api/admin/promotions - Create new promotion
router.post('/promotions', requireAdminAuth, async (req, res) => {
    try {
        const { name, logo, tagline, description, features, link, buttonText, gradient, position, isActive } = req.body;

        if (!name || !description || !link) {
            return res.status(400).json({ error: 'Name, description, and link are required' });
        }

        // Get max position if not provided
        let actualPosition = position;
        if (!actualPosition) {
            const maxPromo = await Promotion.findOne().sort({ position: -1 });
            actualPosition = maxPromo ? maxPromo.position + 1 : 1;
        }

        const promotion = new Promotion({
            name,
            logo: logo || '/images/stone.png',
            tagline: tagline || 'Your Amazing Service',
            description,
            features: features || [],
            link,
            buttonText: buttonText || 'Learn More',
            gradient: gradient || 'linear-gradient(135deg, #1e3a5f, #0d1b2a)',
            position: actualPosition,
            isActive: isActive !== undefined ? isActive : true
        });

        await promotion.save();
        res.status(201).json({ success: true, message: 'Promotion created successfully', promotion });
    } catch (error) {
        console.error('Error creating promotion:', error);
        res.status(500).json({ error: 'Failed to create promotion' });
    }
});

// PUT /api/admin/promotions/:id - Update promotion
router.put('/promotions/:id', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, logo, tagline, description, features, link, buttonText, gradient, position, isActive } = req.body;

        const promotion = await Promotion.findById(id);
        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        if (name) promotion.name = name;
        if (logo) promotion.logo = logo;
        if (tagline) promotion.tagline = tagline;
        if (description) promotion.description = description;
        if (features) promotion.features = features;
        if (link) promotion.link = link;
        if (buttonText) promotion.buttonText = buttonText;
        if (gradient) promotion.gradient = gradient;
        if (position !== undefined) promotion.position = position;
        if (isActive !== undefined) promotion.isActive = isActive;

        await promotion.save();
        res.json({ success: true, message: 'Promotion updated successfully', promotion });
    } catch (error) {
        console.error('Error updating promotion:', error);
        res.status(500).json({ error: 'Failed to update promotion' });
    }
});

// DELETE /api/admin/promotions/:id - Delete promotion
router.delete('/promotions/:id', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const promotion = await Promotion.findByIdAndDelete(id);

        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        res.json({ success: true, message: 'Promotion deleted successfully' });
    } catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ error: 'Failed to delete promotion' });
    }
});

// PUT /api/admin/promotions/:id/toggle - Toggle promotion active status
router.put('/promotions/:id/toggle', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const promotion = await Promotion.findById(id);

        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }

        promotion.isActive = !promotion.isActive;
        await promotion.save();

        res.json({
            success: true,
            message: `Promotion ${promotion.isActive ? 'activated' : 'deactivated'} successfully`,
            promotion
        });
    } catch (error) {
        console.error('Error toggling promotion:', error);
        res.status(500).json({ error: 'Failed to toggle promotion status' });
    }
});

// PUT /api/admin/promotions/reorder - Reorder promotions
router.put('/promotions/reorder', requireAdminAuth, async (req, res) => {
    try {
        const { promotions } = req.body; // Array of { id, position }

        if (!promotions || !Array.isArray(promotions)) {
            return res.status(400).json({ error: 'Invalid promotions array' });
        }

        for (const item of promotions) {
            await Promotion.findByIdAndUpdate(item.id, { position: item.position });
        }

        res.json({ success: true, message: 'Promotions reordered successfully' });
    } catch (error) {
        console.error('Error reordering promotions:', error);
        res.status(500).json({ error: 'Failed to reorder promotions' });
    }
});

// ==================== USER MANAGEMENT ====================

// GET /api/admin/users - Get all users with order statistics
router.get('/users', requireAdminAuth, async (req, res) => {
    try {
        const users = await User.find().populate('badges.badge').sort({ createdAt: -1 });
        const orders = await Order.find();

        // Calculate order stats for each user
        const usersWithStats = users.map(user => {
            // Match orders by email or minecraftUsername
            const userOrders = orders.filter(order =>
                (order.email && user.email && order.email.toLowerCase() === user.email.toLowerCase()) ||
                (order.minecraftUsername && user.minecraftUsername &&
                    order.minecraftUsername.toLowerCase() === user.minecraftUsername.toLowerCase())
            );

            const completedOrders = userOrders.filter(o => o.status !== 'cancelled');

            return {
                id: user._id,
                email: user.email,
                username: user.username,
                name: user.name,
                minecraftUsername: user.minecraftUsername || '',
                avatar: user.avatar,
                authProvider: user.authProvider,
                isEmailVerified: user.isEmailVerified,
                isBlocked: user.isBlocked || false,
                blockedAt: user.blockedAt,
                createdAt: user.createdAt,
                orderCount: userOrders.length,
                totalSpent: completedOrders.reduce((sum, o) => sum + (o.total || 0), 0),
                badges: user.badges || []  // Include badges in response
            };
        });

        res.json(usersWithStats);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// PUT /api/admin/users/:id/badges - Update user's badges
router.put('/users/:id/badges', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { badgeIds } = req.body; // Array of badge IDs

        if (!Array.isArray(badgeIds)) {
            return res.status(400).json({ error: 'Badge IDs must be an array' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Convert simple ID array to object structure required by User model
        // We preserve existing 'assignedAt' and 'assignedBy' if the badge was already there, 
        // essentially only adding new ones or removing missing ones.

        // This logic replaces the entire list with the new selection
        const newBadgesList = badgeIds.map(badgeId => {
            // Check if user already had this badge to preserve metadata if we wanted (optional, keeping it simple for now)
            return {
                badge: badgeId,
                assignedAt: new Date(),
                assignedBy: 'admin'
            };
        });

        user.badges = newBadgesList;
        await user.save();

        // Return updated user with populated badges to show immediate effect
        const updatedUser = await User.findById(id).populate('badges.badge');

        res.json({
            success: true,
            message: 'User badges updated successfully',
            badges: updatedUser.badges
        });
    } catch (error) {
        console.error('Error updating user badges:', error);
        res.status(500).json({ error: 'Failed to update user badges' });
    }
});

// PUT /api/admin/users/:id/block - Toggle block/unblock user
router.put('/users/:id/block', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Toggle block status
        user.isBlocked = !user.isBlocked;
        user.blockedAt = user.isBlocked ? new Date() : null;
        await user.save();

        res.json({
            success: true,
            message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
            user: {
                id: user._id,
                email: user.email,
                isBlocked: user.isBlocked,
                blockedAt: user.blockedAt
            }
        });
    } catch (error) {
        console.error('Error toggling user block:', error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

// POST /api/admin/users/:id/reset-password - Send password reset email
router.post('/users/:id/reset-password', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if user uses OAuth
        if (user.authProvider !== 'local') {
            return res.status(400).json({
                error: `This user uses ${user.authProvider} login. Password cannot be reset.`
            });
        }

        // Generate OTP for password reset
        const otp = await OTP.createOTP(user.email, 'passwordReset');

        // Send password reset email
        await sendOTPEmail(user.email, otp, 'passwordReset', user.name);

        res.json({
            success: true,
            message: `Password reset email sent to ${user.email}`
        });
    } catch (error) {
        console.error('Error sending password reset:', error);
        res.status(500).json({ error: 'Failed to send password reset email' });
    }
});

// ==================== BADGE MANAGEMENT ====================

// GET /api/admin/badges - Get all badges
router.get('/badges', requireAdminAuth, async (req, res) => {
    try {
        const badges = await Badge.find().sort({ createdAt: -1 });
        res.json(badges);
    } catch (error) {
        console.error('Error fetching badges:', error);
        res.status(500).json({ error: 'Failed to fetch badges' });
    }
});

// POST /api/admin/badges - Create new badge
router.post('/badges', requireAdminAuth, async (req, res) => {
    try {
        const { name, description, image, color, rarity } = req.body;

        if (!name || !image) {
            return res.status(400).json({ error: 'Badge name and image are required' });
        }

        const badge = new Badge({
            name: name.trim(),
            description: description || '',
            image,
            color: color || '#f97316',
            rarity: rarity || 'common',
            isActive: true
        });

        await badge.save();

        res.status(201).json({
            success: true,
            message: 'Badge created successfully',
            badge
        });
    } catch (error) {
        console.error('Error creating badge:', error);
        res.status(500).json({ error: 'Failed to create badge' });
    }
});

// PUT /api/admin/badges/:id - Update badge
router.put('/badges/:id', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, image, color, rarity, isActive } = req.body;

        const badge = await Badge.findById(id);
        if (!badge) {
            return res.status(404).json({ error: 'Badge not found' });
        }

        if (name) badge.name = name.trim();
        if (description !== undefined) badge.description = description;
        if (image) badge.image = image;
        if (color) badge.color = color;
        if (rarity) badge.rarity = rarity;
        if (isActive !== undefined) badge.isActive = isActive;

        await badge.save();

        res.json({
            success: true,
            message: 'Badge updated successfully',
            badge
        });
    } catch (error) {
        console.error('Error updating badge:', error);
        res.status(500).json({ error: 'Failed to update badge' });
    }
});

// DELETE /api/admin/badges/:id - Delete badge
router.delete('/badges/:id', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Remove badge from all users who have it
        await User.updateMany(
            { 'badges.badge': id },
            { $pull: { badges: { badge: id } } }
        );

        // Delete the badge
        const result = await Badge.findByIdAndDelete(id);
        if (!result) {
            return res.status(404).json({ error: 'Badge not found' });
        }

        res.json({
            success: true,
            message: 'Badge deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting badge:', error);
        res.status(500).json({ error: 'Failed to delete badge' });
    }
});

// POST /api/admin/users/:userId/badges - Assign badge to user
router.post('/users/:userId/badges', requireAdminAuth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { badgeId } = req.body;

        if (!badgeId) {
            return res.status(400).json({ error: 'Badge ID is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const badge = await Badge.findById(badgeId);
        if (!badge) {
            return res.status(404).json({ error: 'Badge not found' });
        }

        // Check if user already has this badge
        const hasBadge = user.badges.some(b => b.badge.toString() === badgeId);
        if (hasBadge) {
            return res.status(400).json({ error: 'User already has this badge' });
        }

        // Add badge to user
        user.badges.push({
            badge: badgeId,
            assignedAt: new Date(),
            assignedBy: 'admin'
        });

        await user.save();

        // Populate badges for response
        await user.populate('badges.badge');

        res.json({
            success: true,
            message: `Badge "${badge.name}" assigned to ${user.name}`,
            badges: user.badges
        });
    } catch (error) {
        console.error('Error assigning badge:', error);
        res.status(500).json({ error: 'Failed to assign badge' });
    }
});

// DELETE /api/admin/users/:userId/badges/:badgeId - Remove badge from user
router.delete('/users/:userId/badges/:badgeId', requireAdminAuth, async (req, res) => {
    try {
        const { userId, badgeId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove badge from user
        user.badges = user.badges.filter(b => b.badge.toString() !== badgeId);
        await user.save();

        res.json({
            success: true,
            message: 'Badge removed successfully',
            badges: user.badges
        });
    } catch (error) {
        console.error('Error removing badge:', error);
        res.status(500).json({ error: 'Failed to remove badge' });
    }
});

// GET /api/admin/users/:userId/badges - Get user's badges
router.get('/users/:userId/badges', requireAdminAuth, async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).populate('badges.badge');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            badges: user.badges
        });
    } catch (error) {
        console.error('Error fetching user badges:', error);
        res.status(500).json({ error: 'Failed to fetch user badges' });
    }
});

// ==================== SECURITY MANAGEMENT ====================

// GET /api/admin/security/banned-ips - Get all active banned IPs
router.get('/security/banned-ips', requireAdminAuth, async (req, res) => {
    try {
        const bans = await BannedIP.getActiveBans();
        res.json({
            success: true,
            bans: bans.map(ban => ({
                id: ban._id,
                ip: ban.ip,
                reason: ban.reason,
                description: ban.description,
                failedAttempts: ban.failedAttempts,
                bannedAt: ban.bannedAt,
                expiresAt: ban.expiresAt,
                bannedBy: ban.bannedBy,
                metadata: ban.metadata,
                remainingMs: Math.max(0, new Date(ban.expiresAt).getTime() - Date.now())
            }))
        });
    } catch (error) {
        console.error('Error fetching banned IPs:', error);
        res.status(500).json({ error: 'Failed to fetch banned IPs' });
    }
});

// DELETE /api/admin/security/banned-ips/:id - Unban an IP
router.delete('/security/banned-ips/:id', requireAdminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const success = await BannedIP.unbanIP(id);

        if (!success) {
            return res.status(404).json({ error: 'Ban record not found' });
        }

        res.json({
            success: true,
            message: 'IP unbanned successfully'
        });
    } catch (error) {
        console.error('Error unbanning IP:', error);
        res.status(500).json({ error: 'Failed to unban IP' });
    }
});

// POST /api/admin/security/ban-ip - Manually ban an IP
router.post('/security/ban-ip', requireAdminAuth, async (req, res) => {
    try {
        const { ip, reason, durationDays } = req.body;

        if (!ip) {
            return res.status(400).json({ error: 'IP address is required' });
        }

        const duration = (durationDays || 7) * 24 * 60 * 60 * 1000; // Default 7 days

        const ban = await BannedIP.banIP(ip, 'manual_ban', duration, {
            description: reason || 'Manually banned by admin',
            bannedBy: 'admin'
        });

        res.json({
            success: true,
            message: `IP ${ip} banned for ${durationDays || 7} days`,
            ban: {
                id: ban._id,
                ip: ban.ip,
                expiresAt: ban.expiresAt
            }
        });
    } catch (error) {
        console.error('Error banning IP:', error);
        res.status(500).json({ error: 'Failed to ban IP' });
    }
});

// GET /api/admin/security/stats - Get security statistics
router.get('/security/stats', requireAdminAuth, async (req, res) => {
    try {
        const banStats = await BannedIP.getStats();
        const SecurityLog = require('../models/SecurityLog');
        
        // Aggregate WAF stats
        const wafLogs = await SecurityLog.find({ source: 'WAF' });
        const wafStatsDb = {
            totalBlocked: wafLogs.length,
            sqlInjection: wafLogs.filter(l => l.reason === 'sqlInjection').length,
            xss: wafLogs.filter(l => l.reason === 'xss').length,
            pathTraversal: wafLogs.filter(l => l.reason === 'pathTraversal').length,
            commandInjection: wafLogs.filter(l => l.reason === 'commandInjection').length,
            maliciousBot: wafLogs.filter(l => l.reason === 'maliciousBot').length,
            invalidMethod: wafLogs.filter(l => l.reason === 'invalidMethod').length,
            bannedIP: wafLogs.filter(l => l.reason === 'bannedIP').length
        };
        
        // Aggregate IPS stats
        const ipsLogs = await SecurityLog.find({ source: 'IPS' });
        const ipsStatsDb = {
            totalBlocked: ipsLogs.length,
            rateLimitBlocks: ipsLogs.filter(l => l.reason === 'rateLimit').length,
            scanDetectionBlocks: ipsLogs.filter(l => l.reason === 'scanDetection').length,
            honeypotBlocks: ipsLogs.filter(l => l.reason === 'honeypot').length,
            bruteForceBlocks: ipsLogs.filter(l => l.reason === 'bruteForce').length
        };

        res.json({
            success: true,
            stats: {
                bans: banStats,
                waf: wafStatsDb,
                ips: ipsStatsDb
            }
        });
    } catch (error) {
        console.error('Error fetching security stats:', error);
        res.status(500).json({ error: 'Failed to fetch security stats' });
    }
});

// GET /api/admin/security/logs - Get recent security logs
router.get('/security/logs', requireAdminAuth, async (req, res) => {
    try {
        const SecurityLog = require('../models/SecurityLog');
        const dbLogs = await SecurityLog.find().sort({ timestamp: -1 }).limit(100);
        
        // Map to format expected by frontend
        const allLogs = dbLogs.map(log => ({
            id: log._id,
            type: log.reason, // e.g., 'rateLimit', 'sqlInjection'
            ip: log.ip,
            path: log.path,
            details: log.details,
            timestamp: log.timestamp,
            source: log.source // 'WAF' or 'IPS'
        }));

        res.json({
            success: true,
            logs: allLogs
        });
    } catch (error) {
        console.error('Error fetching security logs:', error);
        res.status(500).json({ error: 'Failed to fetch security logs' });
    }
});

module.exports = router;

