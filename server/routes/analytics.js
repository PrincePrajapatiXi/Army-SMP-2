const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { requireAdminAuth } = require('../middleware/authMiddleware');

// GET /api/analytics/overview - Get dashboard overview stats
router.get('/overview', requireAdminAuth, async (req, res) => {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Total revenue
        const totalRevenueResult = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const totalRevenue = totalRevenueResult[0]?.total || 0;

        // Today's revenue
        const todayRevenueResult = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: startOfToday } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const todayRevenue = todayRevenueResult[0]?.total || 0;

        // This month's revenue
        const monthRevenueResult = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const monthRevenue = monthRevenueResult[0]?.total || 0;

        // Last month's revenue for comparison
        const lastMonthRevenueResult = await Order.aggregate([
            {
                $match: {
                    status: { $ne: 'cancelled' },
                    createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }
                }
            },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0;
        const revenueGrowth = lastMonthRevenue > 0
            ? Math.round(((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
            : 100;

        // Order counts
        const totalOrders = await Order.countDocuments({ status: { $ne: 'cancelled' } });
        const todayOrders = await Order.countDocuments({
            status: { $ne: 'cancelled' },
            createdAt: { $gte: startOfToday }
        });
        const pendingOrders = await Order.countDocuments({ status: 'pending' });

        // User counts
        const totalUsers = await User.countDocuments();
        const newUsersToday = await User.countDocuments({ createdAt: { $gte: startOfToday } });
        const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: startOfMonth } });

        // Product counts
        const totalProducts = await Product.countDocuments();
        const activeProducts = await Product.countDocuments({ isActive: true });

        // Average order value
        const avgOrderResult = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $group: { _id: null, avg: { $avg: '$total' } } }
        ]);
        const avgOrderValue = Math.round(avgOrderResult[0]?.avg || 0);

        res.json({
            success: true,
            data: {
                revenue: {
                    total: totalRevenue,
                    today: todayRevenue,
                    thisMonth: monthRevenue,
                    growth: revenueGrowth
                },
                orders: {
                    total: totalOrders,
                    today: todayOrders,
                    pending: pendingOrders,
                    avgValue: avgOrderValue
                },
                users: {
                    total: totalUsers,
                    newToday: newUsersToday,
                    newThisMonth: newUsersThisMonth
                },
                products: {
                    total: totalProducts,
                    active: activeProducts
                }
            }
        });
    } catch (error) {
        console.error('Error fetching analytics overview:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
    }
});

// GET /api/analytics/revenue-chart - Get revenue data for charts
router.get('/revenue-chart', requireAdminAuth, async (req, res) => {
    try {
        const { period = '7days' } = req.query;

        let startDate;
        let groupByFormat;

        switch (period) {
            case '30days':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
                break;
            case '12months':
                startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
                groupByFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
                break;
            default: // 7days
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        }

        const revenueData = await Order.aggregate([
            {
                $match: {
                    status: { $ne: 'cancelled' },
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: groupByFormat,
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: revenueData.map(item => ({
                date: item._id,
                revenue: item.revenue,
                orders: item.orders
            }))
        });
    } catch (error) {
        console.error('Error fetching revenue chart:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch chart data' });
    }
});

// GET /api/analytics/category-breakdown - Get sales by category
router.get('/category-breakdown', requireAdminAuth, async (req, res) => {
    try {
        const categoryData = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.category',
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
                    count: { $sum: '$items.quantity' }
                }
            },
            { $sort: { revenue: -1 } }
        ]);

        res.json({
            success: true,
            data: categoryData.map(item => ({
                category: item._id || 'Other',
                revenue: item.revenue,
                count: item.count
            }))
        });
    } catch (error) {
        console.error('Error fetching category breakdown:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch category data' });
    }
});

// GET /api/analytics/top-products - Get best selling products
router.get('/top-products', requireAdminAuth, async (req, res) => {
    try {
        const topProducts = await Order.aggregate([
            { $match: { status: { $ne: 'cancelled' } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    name: { $first: '$items.name' },
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            data: topProducts.map(item => ({
                id: item._id,
                name: item.name,
                sold: item.totalSold,
                revenue: item.totalRevenue
            }))
        });
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch top products' });
    }
});

// GET /api/analytics/user-activity - Get user registration and activity trends
router.get('/user-activity', requireAdminAuth, async (req, res) => {
    try {
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const registrationData = await User.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            data: registrationData.map(item => ({
                date: item._id,
                registrations: item.count
            }))
        });
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch user activity' });
    }
});

// GET /api/analytics/order-status - Get orders by status
router.get('/order-status', requireAdminAuth, async (req, res) => {
    try {
        const statusData = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const statusMap = {
            pending: { label: 'Pending', color: '#ffc107' },
            processing: { label: 'Processing', color: '#2196f3' },
            delivered: { label: 'Delivered', color: '#22c55e' },
            cancelled: { label: 'Cancelled', color: '#ef4444' }
        };

        res.json({
            success: true,
            data: statusData.map(item => ({
                status: item._id,
                label: statusMap[item._id]?.label || item._id,
                count: item.count,
                color: statusMap[item._id]?.color || '#888'
            }))
        });
    } catch (error) {
        console.error('Error fetching order status:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch order status' });
    }
});

module.exports = router;
