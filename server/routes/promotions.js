const express = require('express');
const router = express.Router();
const Promotion = require('../models/Promotion');
const { cacheMiddleware } = require('../middleware/cache');

const cache300 = cacheMiddleware(300);

// GET /api/promotions - Get all active promotions (for frontend)
router.get('/', cache300, async (req, res) => {
    try {
        const promotions = await Promotion.find({ isActive: true })
            .sort({ position: 1 })
            .lean();
        res.json(promotions);
    } catch (error) {
        console.error('Error fetching promotions:', error);
        res.status(500).json({ error: 'Failed to fetch promotions' });
    }
});

module.exports = router;
