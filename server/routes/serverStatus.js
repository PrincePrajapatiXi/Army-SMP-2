const express = require('express');
const router = express.Router();

// Server configuration - Update these with your Minecraft server details
const SERVER_CONFIG = {
    host: 'army.hostzy.xyz',
    port: 25565
};

// Cache to avoid spamming API
let cachedStatus = null;
let lastFetch = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

/**
 * Fetch server status using mcstatus.io API (works for all Minecraft servers)
 */
async function fetchServerStatus(host, port) {
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
        } else {
            return {
                online: false,
                numplayers: 0,
                maxplayers: 0,
                error: 'Server offline or unreachable'
            };
        }
    } catch (error) {
        console.error('mcstatus.io API error:', error.message);
        return {
            online: false,
            numplayers: 0,
            maxplayers: 0,
            error: error.message
        };
    }
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
