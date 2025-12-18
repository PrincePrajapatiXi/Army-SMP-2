const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Load products from JSON file
const getProducts = () => {
    const filePath = path.join(__dirname, '../data/products.json');
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
};

// GET /api/products - Get all products
router.get('/', (req, res) => {
    try {
        const products = getProducts();
        const { category } = req.query;

        if (category && category !== 'all') {
            const filtered = products.filter(p => p.category === category);
            return res.json(filtered);
        }

        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/products/categories - Get all categories
router.get('/categories', (req, res) => {
    try {
        const products = getProducts();
        const categories = [...new Set(products.map(p => p.category))];
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// GET /api/products/:id - Get single product
router.get('/:id', (req, res) => {
    try {
        const products = getProducts();
        const product = products.find(p => p.id === parseInt(req.params.id));

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

module.exports = router;
