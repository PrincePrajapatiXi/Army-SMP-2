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

        if (!['pending', 'processing', 'completed', 'cancelled'].includes(status)) {
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

        // Send Discord notification when order is completed
        if (status === 'completed' && previousStatus !== 'completed') {
            sendStatusUpdateNotification(orders[orderIndex], status)
                .then(result => {
                    if (result.success) {
                        console.log(`✅ Completion notification sent for ${orders[orderIndex].orderNumber}`);
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

module.exports = router;
