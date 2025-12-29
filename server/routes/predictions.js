const express = require('express');
const router = express.Router();
const {
    getTrendingProducts,
    getUserRecommendations,
    getFrequentlyBoughtTogether,
    getCategoryRecommendations
} = require('../services/purchasePredictions');

// GET /api/predictions/trending - Get trending products
router.get('/trending', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const products = await getTrendingProducts(limit);
        res.json(products);
    } catch (error) {
        console.error('Error fetching trending products:', error);
        res.status(500).json({ error: 'Failed to fetch trending products' });
    }
});

// GET /api/predictions/user/:email - Get personalized recommendations
router.get('/user/:email', async (req, res) => {
    try {
        const email = decodeURIComponent(req.params.email);
        const limit = parseInt(req.query.limit) || 6;
        const products = await getUserRecommendations(email, limit);
        res.json(products);
    } catch (error) {
        console.error('Error fetching user recommendations:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});

// GET /api/predictions/together/:productId - Get frequently bought together
router.get('/together/:productId', async (req, res) => {
    try {
        const productId = parseInt(req.params.productId);
        const limit = parseInt(req.query.limit) || 4;
        const products = await getFrequentlyBoughtTogether(productId, limit);
        res.json(products);
    } catch (error) {
        console.error('Error fetching frequently bought together:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/predictions/category/:category - Get category recommendations
router.get('/category/:category', async (req, res) => {
    try {
        const category = decodeURIComponent(req.params.category);
        const excludeId = req.query.exclude ? parseInt(req.query.exclude) : null;
        const limit = parseInt(req.query.limit) || 6;
        const products = await getCategoryRecommendations(category, excludeId, limit);
        res.json(products);
    } catch (error) {
        console.error('Error fetching category recommendations:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

module.exports = router;
