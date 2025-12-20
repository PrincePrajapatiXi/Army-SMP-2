const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { sendStatusUpdateNotification } = require('../services/email');

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
router.delete('/orders/bulk', (req, res) => {
    try {
        const { orderIds } = req.body;

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return res.status(400).json({ error: 'Order IDs array required' });
        }

        const orders = getOrders();
        const filteredOrders = orders.filter(o =>
            !orderIds.includes(o.id) && !orderIds.includes(o.orderNumber)
        );

        const deletedCount = orders.length - filteredOrders.length;

        if (deletedCount === 0) {
            return res.status(404).json({ error: 'No matching orders found' });
        }

        saveOrders(filteredOrders);

        res.json({
            success: true,
            message: `${deletedCount} orders deleted successfully`,
            deletedCount
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({ error: 'Failed to delete orders' });
    }
});

// GET /api/admin/orders - Get all orders (sorted by date, newest first)
router.get('/orders', (req, res) => {
    try {
        const orders = getOrders();
        // Sort by createdAt descending (newest first)
        const sortedOrders = orders.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        res.json(sortedOrders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/admin/stats - Get sales analytics
router.get('/stats', (req, res) => {
    try {
        const orders = getOrders();
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

        if (!['pending', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const orders = getOrders();
        const orderIndex = orders.findIndex(o => o.id === id || o.orderNumber === id);

        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const previousStatus = orders[orderIndex].status;
        orders[orderIndex].status = status;
        orders[orderIndex].updatedAt = new Date().toISOString();

        saveOrders(orders);

        // Send Discord notification when order status changes to completed or cancelled
        if ((status === 'completed' || status === 'cancelled') && previousStatus !== status) {
            sendStatusUpdateNotification(orders[orderIndex], status)
                .then(result => {
                    if (result.success) {
                        console.log(`✅ ${status.charAt(0).toUpperCase() + status.slice(1)} notification sent for ${orders[orderIndex].orderNumber}`);
                    }
                })
                .catch(err => console.error('Notification error:', err));
        }

        res.json({
            message: 'Status updated successfully',
            order: orders[orderIndex]
        });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// DELETE /api/admin/orders/:id - Delete an order
router.delete('/orders/:id', (req, res) => {
    try {
        const { id } = req.params;
        const orders = getOrders();
        const filteredOrders = orders.filter(o => o.id !== id && o.orderNumber !== id);

        if (filteredOrders.length === orders.length) {
            return res.status(404).json({ error: 'Order not found' });
        }

        saveOrders(filteredOrders);

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

// ==================== PRODUCT MANAGEMENT ====================

const productsFilePath = path.join(__dirname, '../data/products.json');

// Load products from file
const getProducts = () => {
    try {
        const data = fs.readFileSync(productsFilePath, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    }
};

// Save products to file
const saveProducts = (products) => {
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 4));
};

// GET /api/admin/products - Get all products
router.get('/products', (req, res) => {
    try {
        const products = getProducts();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// POST /api/admin/products - Add new product
router.post('/products', (req, res) => {
    try {
        const { name, price, category, image, description, color, features } = req.body;

        if (!name || !price || !category) {
            return res.status(400).json({ error: 'Name, price, and category are required' });
        }

        const products = getProducts();

        // Generate new ID
        const maxId = products.reduce((max, p) => Math.max(max, p.id), 0);
        const newProduct = {
            id: maxId + 1,
            name,
            price: parseFloat(price),
            priceDisplay: `₹${price}`,
            color: color || '#ffffff',
            category,
            image: image || '/images/stone.png',
            description: description || '',
            features: features || []
        };

        products.push(newProduct);
        saveProducts(products);

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
router.put('/products/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, category, image, description, color, features } = req.body;

        const products = getProducts();
        const productIndex = products.findIndex(p => p.id === parseInt(id));

        if (productIndex === -1) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Update product fields
        products[productIndex] = {
            ...products[productIndex],
            name: name || products[productIndex].name,
            price: price ? parseFloat(price) : products[productIndex].price,
            priceDisplay: price ? `₹${price}` : products[productIndex].priceDisplay,
            category: category || products[productIndex].category,
            image: image || products[productIndex].image,
            description: description !== undefined ? description : products[productIndex].description,
            color: color || products[productIndex].color,
            features: features || products[productIndex].features
        };

        saveProducts(products);

        res.json({
            success: true,
            message: 'Product updated successfully',
            product: products[productIndex]
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// DELETE /api/admin/products/:id - Delete product
router.delete('/products/:id', (req, res) => {
    try {
        const { id } = req.params;
        const products = getProducts();
        const filteredProducts = products.filter(p => p.id !== parseInt(id));

        if (filteredProducts.length === products.length) {
            return res.status(404).json({ error: 'Product not found' });
        }

        saveProducts(filteredProducts);

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router;
