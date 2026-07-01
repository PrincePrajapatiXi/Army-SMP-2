const NodeCache = require('node-cache');

// Standard cache for 5 minutes
const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

const cacheMiddleware = (duration) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = req.originalUrl;
        const cachedResponse = cache.get(key);

        if (cachedResponse) {
            console.log(`[Cache Hit] ${key}`);
            return res.json(cachedResponse);
        }

        console.log(`[Cache Miss] ${key}`);
        
        // Hijack res.json to store data before sending
        const originalJson = res.json;
        res.json = function (body) {
            res.json = originalJson;
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cache.set(key, body, duration);
            }
            return res.json(body);
        };

        next();
    };
};

module.exports = {
    cacheMiddleware,
    cache
};
