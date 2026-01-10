const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET /api/leaderboard/top-buyers - Get top buyers from completed orders
router.get('/top-buyers', async (req, res) => {
    try {
        const { period = 'all' } = req.query; // all, month, week

        // Build date filter based on period
        let dateFilter = {};
        const now = new Date();

        if (period === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            dateFilter = { createdAt: { $gte: weekAgo } };
        } else if (period === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            dateFilter = { createdAt: { $gte: monthAgo } };
        }

        // Aggregate orders by minecraftUsername for completed orders only
        const topBuyers = await Order.aggregate([
            {
                $match: {
                    status: 'completed',
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: '$minecraftUsername',
                    totalSpent: { $sum: '$total' },
                    orderCount: { $sum: 1 },
                    lastOrder: { $max: '$createdAt' }
                }
            },
            {
                $sort: { totalSpent: -1 }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    _id: 0,
                    username: '$_id',
                    totalSpent: { $round: ['$totalSpent', 0] },
                    orderCount: 1,
                    lastOrder: 1,
                    // MC Heads avatar URL
                    avatar: {
                        $concat: ['https://mc-heads.net/avatar/', '$_id', '/64']
                    }
                }
            }
        ]);

        res.json({
            success: true,
            period,
            count: topBuyers.length,
            data: topBuyers
        });

    } catch (error) {
        console.error('Error fetching top buyers:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch leaderboard data'
        });
    }
});

// GET /api/leaderboard/stats - Get overall store statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await Order.aggregate([
            {
                $match: { status: 'completed' }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$total' },
                    uniqueBuyers: { $addToSet: '$minecraftUsername' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalOrders: 1,
                    totalRevenue: { $round: ['$totalRevenue', 0] },
                    uniqueBuyers: { $size: '$uniqueBuyers' }
                }
            }
        ]);

        res.json({
            success: true,
            data: stats[0] || { totalOrders: 0, totalRevenue: 0, uniqueBuyers: 0 }
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});

module.exports = router;
