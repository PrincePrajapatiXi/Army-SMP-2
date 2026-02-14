const https = require('https');

/**
 * Ping the server every 13 minutes to keep it alive on Render free tier
 * Render spins down inactive services after 15 minutes
 */
const startKeepAlive = () => {
    // Get the server URL from environment or default to localhost for dev
    // For Render, we want to ping the public URL
    const SERVER_URL = process.env.PUBLIC_URL || 'https://army-smp-2.onrender.com';

    // Only run if we're in production or explicitly enabled
    if (process.env.NODE_ENV === 'production') {
        console.log(`⏰ Keep-alive service started. Pinging ${SERVER_URL} every 13 minutes.`);

        // Initial ping after 1 minute to verify connectivity
        setTimeout(() => {
            performPing(SERVER_URL);
        }, 60 * 1000);

        // Periodic ping every 13 minutes (13 * 60 * 1000)
        setInterval(() => {
            performPing(SERVER_URL);
        }, 13 * 60 * 1000);
    } else {
        console.log('ℹ️ Keep-alive service skipped (not in production)');
    }
};

const performPing = (url) => {
    https.get(url, (res) => {
        console.log(`✅ Keep-alive ping successful: ${res.statusCode}`);
    }).on('error', (err) => {
        console.error(`❌ Keep-alive ping failed: ${err.message}`);
    });
};

module.exports = { startKeepAlive };
