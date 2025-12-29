/**
 * Purchase Predictions Service
 * AI-powered product recommendations based on user behavior
 */

const Order = require('../models/Order');
const Product = require('../models/Product');

// Cache for trending products (refresh every 10 minutes)
let trendingCache = {
    data: [],
    lastUpdated: null
};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Get trending products based on recent purchases
 * @param {Number} limit - Number of products to return
 * @param {Number} days - Look back period in days
 */
async function getTrendingProducts(limit = 6, days = 7) {
    try {
        // Check cache
        if (trendingCache.data.length > 0 &&
            trendingCache.lastUpdated &&
            Date.now() - trendingCache.lastUpdated < CACHE_TTL) {
            return trendingCache.data.slice(0, limit);
        }

        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        // Aggregate orders to find most purchased products
        const popularItems = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.id',
                    name: { $first: '$items.name' },
                    totalQuantity: { $sum: '$items.quantity' },
                    orderCount: { $sum: 1 }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: limit * 2 } // Get extra in case some products are deleted
        ]);

        // Get full product details
        const productIds = popularItems.map(item => item._id);
        const products = await Product.find({ id: { $in: productIds } });

        // Merge with purchase data
        const trending = popularItems
            .map(item => {
                const product = products.find(p => p.id === item._id);
                if (!product) return null;
                return {
                    ...product.toObject(),
                    purchaseCount: item.totalQuantity,
                    orderCount: item.orderCount,
                    trendingScore: item.totalQuantity + item.orderCount * 2
                };
            })
            .filter(Boolean)
            .slice(0, limit);

        // Update cache
        trendingCache = {
            data: trending,
            lastUpdated: Date.now()
        };

        return trending;
    } catch (error) {
        console.error('Error getting trending products:', error);
        return [];
    }
}

/**
 * Get personalized recommendations for a user
 * @param {String} email - User email
 * @param {Number} limit - Number of products to return
 */
async function getUserRecommendations(email, limit = 6) {
    try {
        if (!email) {
            // No user, return trending
            return getTrendingProducts(limit);
        }

        // Get user's order history
        const userOrders = await Order.find({ email })
            .sort({ createdAt: -1 })
            .limit(20);

        if (userOrders.length === 0) {
            // New user, return trending
            return getTrendingProducts(limit);
        }

        // Analyze user's category preferences
        const categoryScores = {};
        const purchasedProductIds = new Set();

        userOrders.forEach(order => {
            order.items.forEach(item => {
                purchasedProductIds.add(item.id);
            });
        });

        // Get all products
        const allProducts = await Product.find();

        // Calculate category affinity from purchased items
        const purchasedProducts = allProducts.filter(p => purchasedProductIds.has(p.id));
        purchasedProducts.forEach(product => {
            const category = product.category || 'other';
            categoryScores[category] = (categoryScores[category] || 0) + 1;
        });

        // Get collaborative filtering recommendations
        // (products bought by users who bought similar products)
        const collaborativeRecs = await getCollaborativeRecommendations(
            Array.from(purchasedProductIds),
            email,
            Math.ceil(limit / 2)
        );

        // Get category-based recommendations
        const sortedCategories = Object.entries(categoryScores)
            .sort((a, b) => b[1] - a[1])
            .map(([cat]) => cat);

        const categoryRecs = allProducts
            .filter(p => !purchasedProductIds.has(p.id))
            .filter(p => sortedCategories.includes(p.category))
            .slice(0, Math.ceil(limit / 2));

        // Combine and deduplicate
        const recommendations = [...collaborativeRecs, ...categoryRecs]
            .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
            .slice(0, limit);

        // If not enough, fill with trending
        if (recommendations.length < limit) {
            const trending = await getTrendingProducts(limit - recommendations.length);
            const trendingFiltered = trending.filter(
                t => !recommendations.find(r => r.id === t.id) && !purchasedProductIds.has(t.id)
            );
            recommendations.push(...trendingFiltered);
        }

        return recommendations.slice(0, limit);
    } catch (error) {
        console.error('Error getting user recommendations:', error);
        return getTrendingProducts(limit);
    }
}

/**
 * Collaborative filtering - find products bought by similar users
 */
async function getCollaborativeRecommendations(userProductIds, userEmail, limit = 3) {
    try {
        if (userProductIds.length === 0) return [];

        // Find orders containing at least one of user's products
        const similarOrders = await Order.find({
            email: { $ne: userEmail },
            'items.id': { $in: userProductIds }
        }).limit(50);

        // Count product frequency in similar orders
        const productFrequency = {};
        similarOrders.forEach(order => {
            order.items.forEach(item => {
                if (!userProductIds.includes(item.id)) {
                    productFrequency[item.id] = (productFrequency[item.id] || 0) + 1;
                }
            });
        });

        // Get top products
        const topProductIds = Object.entries(productFrequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([id]) => parseInt(id));

        const products = await Product.find({ id: { $in: topProductIds } });
        return products;
    } catch (error) {
        console.error('Error getting collaborative recommendations:', error);
        return [];
    }
}

/**
 * Get "Frequently Bought Together" recommendations
 * @param {Number} productId - Product ID
 * @param {Number} limit - Number of products to return
 */
async function getFrequentlyBoughtTogether(productId, limit = 4) {
    try {
        // Find orders containing this product
        const ordersWithProduct = await Order.find({
            'items.id': productId
        }).limit(100);

        // Count co-purchased products
        const coPurchaseCount = {};
        ordersWithProduct.forEach(order => {
            order.items.forEach(item => {
                if (item.id !== productId) {
                    coPurchaseCount[item.id] = (coPurchaseCount[item.id] || 0) + 1;
                }
            });
        });

        // Get top co-purchased products
        const topProductIds = Object.entries(coPurchaseCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([id]) => parseInt(id));

        if (topProductIds.length === 0) {
            // No co-purchase data, return same category products
            const sourceProduct = await Product.findOne({ id: productId });
            if (!sourceProduct) return [];

            const sameCategoryProducts = await Product.find({
                category: sourceProduct.category,
                id: { $ne: productId }
            }).limit(limit);

            return sameCategoryProducts;
        }

        const products = await Product.find({ id: { $in: topProductIds } });
        return products;
    } catch (error) {
        console.error('Error getting frequently bought together:', error);
        return [];
    }
}

/**
 * Get category-based recommendations
 * @param {String} category - Product category
 * @param {Number} excludeId - Product ID to exclude
 * @param {Number} limit - Number of products to return
 */
async function getCategoryRecommendations(category, excludeId = null, limit = 6) {
    try {
        const query = { category };
        if (excludeId) query.id = { $ne: excludeId };

        const products = await Product.find(query).limit(limit);
        return products;
    } catch (error) {
        console.error('Error getting category recommendations:', error);
        return [];
    }
}

/**
 * Get price-range recommendations
 */
async function getPriceRangeRecommendations(basePrice, limit = 4) {
    try {
        const minPrice = basePrice * 0.7;
        const maxPrice = basePrice * 1.3;

        const products = await Product.find({
            price: { $gte: minPrice, $lte: maxPrice }
        }).limit(limit);

        return products;
    } catch (error) {
        console.error('Error getting price range recommendations:', error);
        return [];
    }
}

module.exports = {
    getTrendingProducts,
    getUserRecommendations,
    getFrequentlyBoughtTogether,
    getCategoryRecommendations,
    getPriceRangeRecommendations
};
