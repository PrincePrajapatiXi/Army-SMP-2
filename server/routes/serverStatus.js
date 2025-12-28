const express = require('express');
const router = express.Router();

// Server configuration - Update these with your Minecraft server details
const SERVER_CONFIG = {
    host: 'army.hostzy.xyz',
    port: 25571  // Query port (not the game port 25591) - this is where player count is available
};

// Cache to avoid spamming API
let cachedStatus = null;
let lastFetch = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

/**
 * Fetch server status using multiple APIs with fallback
 * Primary: mcsrvstat.us (better query support)
 * Fallback: mcstatus.io
 */
async function fetchServerStatus(host, port) {
    // Try mcsrvstat.us API first (better for servers with query enabled)
    try {
        const response = await fetch(`https://api.mcsrvstat.us/3/${host}:${port}`);
        const data = await response.json();

        if (data.online) {
            return {
                online: true,
                hostname: data.motd?.clean?.[0] || data.hostname || 'Minecraft Server',
                version: data.version || 'Unknown',
                numplayers: data.players?.online || 0,
                maxplayers: data.players?.max || 20,
                players: data.players?.list || []
            };
        }
    } catch (error) {
        console.error('mcsrvstat.us API error:', error.message);
    }

    // Fallback to mcstatus.io API
    try {
        const response = await fetch(`https://api.mcstatus.io/v2/status/java/${host}:${port}`);
        const data = await response.json();

        if (data.online) {
            return {
                online: true,
                hostname: data.motd?.clean || 'Minecraft Server',
                version: data.version?.name_clean || 'Unknown',
                numplayers: data.players?.online || 0,
                maxplayers: data.players?.max || 20,
                players: data.players?.list?.map(p => p.name_clean) || []
            };
        }
    } catch (error) {
        console.error('mcstatus.io API error:', error.message);
    }

    // Both APIs failed or server appears offline
    // Check if server is pingable but query is blocked (common with hosting providers)
    console.log(`⚠️ Server ${host}:${port} - Query blocked or server offline`);

    // Default: assume online but can't get player count (better UX than showing offline)
    return {
        online: true,
        hostname: 'Army SMP',
        numplayers: 0,
        maxplayers: 20,
        queryBlocked: true,
        message: 'Player count unavailable - query may be blocked by hosting'
    };
}

/**
 * GET /api/server-status
 * Returns live Minecraft server status including player count
 */
router.get('/', async (req, res) => {
    try {
        const now = Date.now();

        // Return cached data if fresh
        if (cachedStatus && (now - lastFetch) < CACHE_DURATION) {
            return res.json({
                ...cachedStatus,
                cached: true,
                cacheAge: Math.floor((now - lastFetch) / 1000)
            });
        }

        // Fetch fresh status
        console.log(`🎮 Querying server: ${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`);
        const status = await fetchServerStatus(SERVER_CONFIG.host, SERVER_CONFIG.port);

        // Update cache
        cachedStatus = status;
        lastFetch = now;

        res.json({
            ...status,
            cached: false,
            serverAddress: `${SERVER_CONFIG.host}:${SERVER_CONFIG.port}`
        });

    } catch (error) {
        console.error('Server status error:', error.message);
        res.json({
            online: false,
            numplayers: 0,
            maxplayers: 0,
            error: error.message
        });
    }
});

/**
 * GET /api/server-status/quick
 * Returns just the player count (lightweight endpoint)
 */
router.get('/quick', async (req, res) => {
    try {
        const now = Date.now();

        // Use cache if available
        if (cachedStatus && (now - lastFetch) < CACHE_DURATION) {
            return res.json({
                online: cachedStatus.online,
                players: cachedStatus.numplayers,
                max: cachedStatus.maxplayers
            });
        }

        const status = await fetchServerStatus(SERVER_CONFIG.host, SERVER_CONFIG.port);
        cachedStatus = status;
        lastFetch = now;

        res.json({
            online: status.online,
            players: status.numplayers,
            max: status.maxplayers
        });

    } catch (error) {
        res.json({
            online: false,
            players: 0,
            max: 0
        });
    }
});

module.exports = router;
