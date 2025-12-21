const express = require('express');
const router = express.Router();
const { sendStatusUpdateNotification } = require('../services/email');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Promotion = require('../models/Promotion');

// Admin password from environment variable (secure)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Prince_Uday';

// POST /api/admin/login - Secure admin authentication
router.post('/login', (req, res) => {
    try {
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, error: 'Password required' });
        }

        if (password === ADMIN_PASSWORD) {
            return res.json({ success: true, message: 'Login successful' });
        } else {
            return res.status(401).json({ success: false, error: 'Invalid password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'Login failed' });
    }
});

// DELETE /api/admin/orders/bulk - Bulk delete orders
router.delete('/orders/bulk', async (req, res) => {
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
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/admin/stats - Get sales analytics
router.get('/stats', async (req, res) => {
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
router.put('/orders/:id/status', async (req, res) => {
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
                        console.log(`✅ ${status.charAt(0).toUpperCase() + status.slice(1)} notification sent for ${order.orderNumber}`);
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

// DELETE /api/admin/orders/:id - Delete an order
router.delete('/orders/:id', async (req, res) => {
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
router.get('/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ id: 1 });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// POST /api/admin/products - Add new product
router.post('/products', async (req, res) => {
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
            priceDisplay: `₹${price}`,
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
router.put('/products/:id', async (req, res) => {
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
            product.priceDisplay = `₹${product.price}`;
        }
        if (updates.category) product.category = updates.category;
        if (updates.image) product.image = updates.image;
        if (updates.description !== undefined) product.description = updates.description;
        if (updates.color) product.color = updates.color;
        if (updates.features) product.features = updates.features;

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
router.delete('/products/:id', async (req, res) => {
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
router.get('/coupons', async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ error: 'Failed to fetch coupons' });
    }
});

// POST /api/admin/coupons - Create new coupon
router.post('/coupons', async (req, res) => {
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
router.put('/coupons/:id', async (req, res) => {
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
router.delete('/coupons/:id', async (req, res) => {
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
router.put('/coupons/:id/toggle', async (req, res) => {
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
router.get('/promotions', async (req, res) => {
    try {
        const promotions = await Promotion.find().sort({ position: 1 });
        res.json(promotions);
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ error: 'Failed to fetch promotions' });
    }
});

// POST /api/admin/promotions - Create new promotion
router.post('/promotions', async (req, res) => {
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
router.put('/promotions/:id', async (req, res) => {
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
router.delete('/promotions/:id', async (req, res) => {
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
router.put('/promotions/:id/toggle', async (req, res) => {
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
router.put('/promotions/reorder', async (req, res) => {
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

module.exports = router;

