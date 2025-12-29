const express = require('express');
const router = express.Router();
const FraudAlert = require('../models/FraudAlert');
const User = require('../models/User');
const Order = require('../models/Order');
const { requireAdminAuth } = require('../middleware/auth');
const { getFraudStats, getUserRiskProfile, blockUser } = require('../services/fraudDetection');

// GET /api/fraud/alerts - Get all fraud alerts with filters
router.get('/alerts', requireAdminAuth, async (req, res) => {
    try {
        const { status, riskLevel, page = 1, limit = 20 } = req.query;

        const query = {};
        if (status && status !== 'all') query.status = status;
        if (riskLevel && riskLevel !== 'all') query.riskLevel = riskLevel;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [alerts, total] = await Promise.all([
            FraudAlert.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            FraudAlert.countDocuments(query)
        ]);

        res.json({
            alerts,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / parseInt(limit)),
                count: total
            }
        });
    } catch (error) {
        console.error('Error fetching fraud alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

// GET /api/fraud/stats - Get fraud statistics
router.get('/stats', requireAdminAuth, async (req, res) => {
    try {
        const stats = await getFraudStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching fraud stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// GET /api/fraud/alerts/:id - Get single alert details
router.get('/alerts/:id', requireAdminAuth, async (req, res) => {
    try {
        const alert = await FraudAlert.findById(req.params.id);
        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        // Get related order
        const order = await Order.findOne({ id: alert.orderId });

        // Get user if exists
        const user = await User.findOne({ email: alert.userEmail });

        res.json({
            alert,
            order,
            user: user ? {
                id: user._id,
                email: user.email,
                username: user.username,
                riskScore: user.riskScore,
                flagCount: user.flagCount,
                isBlocked: user.isBlocked,
                totalOrders: user.totalOrders
            } : null
        });
    } catch (error) {
        console.error('Error fetching alert details:', error);
        res.status(500).json({ error: 'Failed to fetch alert' });
    }
});

// PUT /api/fraud/alerts/:id - Update alert status
router.put('/alerts/:id', requireAdminAuth, async (req, res) => {
    try {
        const { status, notes, actionTaken } = req.body;
        const validStatuses = ['pending', 'reviewed', 'approved', 'dismissed', 'blocked'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const updateData = {
            status,
            reviewedAt: new Date(),
            reviewedBy: 'admin' // Can be enhanced with actual admin identity
        };

        if (notes) updateData.notes = notes;
        if (actionTaken) updateData.actionTaken = actionTaken;

        const alert = await FraudAlert.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found' });
        }

        // If blocking, also block the user
        if (status === 'blocked' && alert.userEmail) {
            const user = await User.findOne({ email: alert.userEmail });
            if (user) {
                await blockUser(user._id);
            }
        }

        res.json({ message: 'Alert updated', alert });
    } catch (error) {
        console.error('Error updating alert:', error);
        res.status(500).json({ error: 'Failed to update alert' });
    }
});

// GET /api/fraud/user/:userId/risk - Get user risk profile
router.get('/user/:userId/risk', requireAdminAuth, async (req, res) => {
    try {
        const profile = await getUserRiskProfile(req.params.userId);
        if (!profile) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(profile);
    } catch (error) {
        console.error('Error fetching user risk profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// POST /api/fraud/user/:userId/block - Block a user
router.post('/user/:userId/block', requireAdminAuth, async (req, res) => {
    try {
        const success = await blockUser(req.params.userId);
        if (success) {
            res.json({ message: 'User blocked successfully' });
        } else {
            res.status(400).json({ error: 'Failed to block user' });
        }
    } catch (error) {
        console.error('Error blocking user:', error);
        res.status(500).json({ error: 'Failed to block user' });
    }
});

// POST /api/fraud/user/:userId/unblock - Unblock a user
router.post('/user/:userId/unblock', requireAdminAuth, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.userId, {
            $set: { isBlocked: false, blockedAt: null }
        });
        res.json({ message: 'User unblocked successfully' });
    } catch (error) {
        console.error('Error unblocking user:', error);
        res.status(500).json({ error: 'Failed to unblock user' });
    }
});

// GET /api/fraud/high-risk-users - Get high risk users
router.get('/high-risk-users', requireAdminAuth, async (req, res) => {
    try {
        const users = await User.find({ riskScore: { $gte: 50 } })
            .select('email username riskScore flagCount totalOrders isBlocked createdAt')
            .sort({ riskScore: -1 })
            .limit(50);

        res.json(users);
    } catch (error) {
        console.error('Error fetching high risk users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

module.exports = router;
