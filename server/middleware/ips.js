/**
 * IPS (Intrusion Prevention System) Middleware
 * Real-time detection and blocking of intrusion attempts
 * 
 * Features:
 * - Rate-based attack detection (excessive requests per IP)
 * - 404 scan detection (directory brute-force/port scanning)
 * - Brute force detection (repeated auth failures)
 * - Honeypot paths (catch bots/scanners)
 * - Behavioral analysis with escalating responses
 */

const BannedIP = require('../models/BannedIP');

// ==================== IPS CONFIGURATION ====================

const IPS_CONFIG = {
    // Rate limiting thresholds
    maxRequestsPerMinute: 120,      // Per IP
    maxRequestsPer10Seconds: 30,    // Burst detection

    // 404 scan detection
    max404PerMinute: 15,            // Too many not-found = scanning
    max404Per5Minutes: 30,

    // Brute force detection  
    maxAuthFailuresPerHour: 10,

    // Block durations
    rateLimitBlockMs: 60 * 60 * 1000,           // 1 hour
    scanDetectionBlockMs: 6 * 60 * 60 * 1000,   // 6 hours
    bruteForceBlockMs: 24 * 60 * 60 * 1000,     // 24 hours
    honeypotBlockMs: 7 * 24 * 60 * 60 * 1000,   // 1 week

    // Cleanup interval
    cleanupIntervalMs: 5 * 60 * 1000  // 5 minutes
};

// ==================== HONEYPOT PATHS ====================
// Paths that legitimate users would never access
// If someone requests these, they're scanning/attacking

const HONEYPOT_PATHS = [
    '/wp-login.php',
    '/wp-admin',
    '/wp-admin/',
    '/wp-content/',
    '/wordpress/',
    '/admin.php',
    '/administrator/',
    '/phpmyadmin',
    '/phpmyadmin/',
    '/pma/',
    '/mysql/',
    '/myadmin/',
    '/dbadmin/',
    '/phpinfo.php',
    '/info.php',
    '/test.php',
    '/shell.php',
    '/cmd.php',
    '/backdoor.php',
    '/c99.php',
    '/r57.php',
    '/webshell',
    '/.env',
    '/.git/config',
    '/.git/HEAD',
    '/.svn/',
    '/.DS_Store',
    '/config.php',
    '/configuration.php',
    '/wp-config.php',
    '/xmlrpc.php',
    '/cgi-bin/',
    '/login.asp',
    '/admin.asp',
    '/.aws/credentials',
    '/.ssh/',
    '/actuator/',
    '/actuator/env',
    '/api/v1/debug',
    '/debug/',
    '/console/',
    '/server-status',
    '/server-info',
    '/.well-known/security.txt'
];

// ==================== IN-MEMORY TRACKING ====================

// Track requests per IP
const ipRequestLog = new Map();

// Track 404 errors per IP
const ip404Log = new Map();

// Track auth failures per IP
const ipAuthFailures = new Map();

// IPS statistics
const ipsStats = {
    totalBlocked: 0,
    rateLimitBlocks: 0,
    scanDetectionBlocks: 0,
    honeypotBlocks: 0,
    bruteForceBlocks: 0,
    recentBlocks: []
};

// ==================== HELPER FUNCTIONS ====================

function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
}

function recordIPSBlock(type, ip, path, details = '') {
    ipsStats.totalBlocked++;
    const typeKey = type + 'Blocks';
    if (ipsStats[typeKey] !== undefined) {
        ipsStats[typeKey]++;
    }

    const blockRecord = {
        type,
        ip,
        path,
        details,
        timestamp: new Date().toISOString()
    };

    ipsStats.recentBlocks.unshift(blockRecord);
    if (ipsStats.recentBlocks.length > 100) {
        ipsStats.recentBlocks = ipsStats.recentBlocks.slice(0, 100);
    }

    console.log(`🔰 IPS BLOCKED [${type.toUpperCase()}]: ${ip} → ${path} ${details ? '| ' + details : ''}`);
}

// ==================== IPS MIDDLEWARE ====================

/**
 * Main IPS middleware — tracks request patterns and blocks suspicious activity
 */
const ipsMiddleware = async (req, res, next) => {
    const ip = getClientIP(req);
    const path = (req.originalUrl || req.url || '').toLowerCase();
    const now = Date.now();

    try {
        // ===== 1. HONEYPOT CHECK =====
        // Check if the request matches any honeypot path
        const isHoneypot = HONEYPOT_PATHS.some(hp => path.startsWith(hp.toLowerCase()));

        if (isHoneypot) {
            recordIPSBlock('honeypot', ip, path, 'Honeypot path accessed');

            // Instant 1-week ban for honeypot access
            await BannedIP.banIP(ip, 'ips_blocked', IPS_CONFIG.honeypotBlockMs, {
                description: `Honeypot path accessed: ${path}`,
                attackType: 'honeypot',
                requestPath: path,
                requestMethod: req.method,
                userAgent: req.headers['user-agent'] || ''
            });

            return res.status(403).json({
                success: false,
                error: 'Access denied.'
            });
        }

        // ===== 2. RATE-BASED DETECTION =====
        if (!ipRequestLog.has(ip)) {
            ipRequestLog.set(ip, []);
        }

        const requestTimes = ipRequestLog.get(ip);
        requestTimes.push(now);

        // Clean old entries (keep only last 60 seconds)
        const oneMinuteAgo = now - 60000;
        const tenSecondsAgo = now - 10000;

        while (requestTimes.length > 0 && requestTimes[0] < oneMinuteAgo) {
            requestTimes.shift();
        }

        // Check burst rate (10 seconds)
        const burstCount = requestTimes.filter(t => t >= tenSecondsAgo).length;
        if (burstCount > IPS_CONFIG.maxRequestsPer10Seconds) {
            recordIPSBlock('rateLimit', ip, path, `${burstCount} requests in 10s`);

            await BannedIP.banIP(ip, 'ips_blocked', IPS_CONFIG.rateLimitBlockMs, {
                description: `Rate limit exceeded: ${burstCount} requests in 10 seconds`,
                attackType: 'rate_limit_burst',
                requestPath: path,
                requestMethod: req.method
            });

            return res.status(429).json({
                success: false,
                error: 'Too many requests. Your IP has been temporarily blocked.'
            });
        }

        // Check per-minute rate
        if (requestTimes.length > IPS_CONFIG.maxRequestsPerMinute) {
            recordIPSBlock('rateLimit', ip, path, `${requestTimes.length} requests/min`);

            await BannedIP.banIP(ip, 'ips_blocked', IPS_CONFIG.rateLimitBlockMs, {
                description: `Rate limit exceeded: ${requestTimes.length} requests per minute`,
                attackType: 'rate_limit',
                requestPath: path,
                requestMethod: req.method
            });

            return res.status(429).json({
                success: false,
                error: 'Too many requests. Your IP has been temporarily blocked.'
            });
        }

        // ===== 3. TRACK RESPONSE FOR POST-PROCESSING =====
        // Hook into response to track 404s and auth failures
        const originalSend = res.send;
        res.send = function(body) {
            // Track 404 responses (scan detection)
            if (res.statusCode === 404) {
                trackNotFound(ip, path, now);
            }

            // Track 401 responses (brute force detection)
            if (res.statusCode === 401) {
                trackAuthFailure(ip, path, now);
            }

            return originalSend.call(this, body);
        };

        next();
    } catch (error) {
        console.error('⚠️ IPS Error (allowing request):', error.message);
        next();
    }
};

/**
 * Track 404 errors for scan detection
 */
async function trackNotFound(ip, path, now) {
    if (!ip404Log.has(ip)) {
        ip404Log.set(ip, []);
    }

    const log = ip404Log.get(ip);
    log.push({ time: now, path });

    // Clean entries older than 5 minutes
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    while (log.length > 0 && log[0].time < fiveMinutesAgo) {
        log.shift();
    }

    // Check thresholds
    const oneMinuteAgo = now - 60000;
    const lastMinute404s = log.filter(entry => entry.time >= oneMinuteAgo).length;

    if (lastMinute404s > IPS_CONFIG.max404PerMinute || log.length > IPS_CONFIG.max404Per5Minutes) {
        recordIPSBlock('scanDetection', ip, path, `${log.length} 404s in 5 minutes`);

        try {
            await BannedIP.banIP(ip, 'ips_blocked', IPS_CONFIG.scanDetectionBlockMs, {
                description: `Directory scanning detected: ${log.length} 404 errors`,
                attackType: 'scan_detection',
                requestPath: path
            });
        } catch (err) {
            console.error('IPS ban error:', err.message);
        }

        // Clear the log
        ip404Log.delete(ip);
    }
}

/**
 * Track authentication failures for brute force detection
 */
async function trackAuthFailure(ip, path, now) {
    if (!ipAuthFailures.has(ip)) {
        ipAuthFailures.set(ip, []);
    }

    const failures = ipAuthFailures.get(ip);
    failures.push({ time: now, path });

    // Clean entries older than 1 hour
    const oneHourAgo = now - 60 * 60 * 1000;
    while (failures.length > 0 && failures[0].time < oneHourAgo) {
        failures.shift();
    }

    if (failures.length > IPS_CONFIG.maxAuthFailuresPerHour) {
        recordIPSBlock('bruteForce', ip, path, `${failures.length} auth failures in 1 hour`);

        try {
            await BannedIP.banIP(ip, 'ips_blocked', IPS_CONFIG.bruteForceBlockMs, {
                description: `Brute force detected: ${failures.length} authentication failures`,
                attackType: 'brute_force',
                requestPath: path
            });
        } catch (err) {
            console.error('IPS ban error:', err.message);
        }

        ipAuthFailures.delete(ip);
    }
}

// ==================== CLEANUP ====================

// Periodic cleanup of in-memory tracking data
setInterval(() => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    // Clean request log
    for (const [ip, times] of ipRequestLog.entries()) {
        const filtered = times.filter(t => t >= oneMinuteAgo);
        if (filtered.length === 0) {
            ipRequestLog.delete(ip);
        } else {
            ipRequestLog.set(ip, filtered);
        }
    }

    // Clean 404 log
    for (const [ip, entries] of ip404Log.entries()) {
        const filtered = entries.filter(e => e.time >= fiveMinutesAgo);
        if (filtered.length === 0) {
            ip404Log.delete(ip);
        } else {
            ip404Log.set(ip, filtered);
        }
    }

    // Clean auth failures
    for (const [ip, entries] of ipAuthFailures.entries()) {
        const filtered = entries.filter(e => e.time >= oneHourAgo);
        if (filtered.length === 0) {
            ipAuthFailures.delete(ip);
        } else {
            ipAuthFailures.set(ip, filtered);
        }
    }
}, IPS_CONFIG.cleanupIntervalMs);

// ==================== EXPORTS ====================

module.exports = {
    ipsMiddleware,
    ipsStats,
    IPS_CONFIG,
    HONEYPOT_PATHS
};
