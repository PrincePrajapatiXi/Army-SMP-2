/**
 * Input Sanitization Middleware
 * Prevents XSS attacks by sanitizing all user inputs
 */

// HTML entities to escape
const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
};

// Escape HTML special characters
const escapeHtml = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>"'`=\/]/g, char => escapeMap[char]);
};

// Recursively sanitize object
const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        return escapeHtml(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    if (typeof obj === 'object') {
        const sanitized = {};
        for (const key of Object.keys(obj)) {
            sanitized[escapeHtml(key)] = sanitizeObject(obj[key]);
        }
        return sanitized;
    }

    return obj;
};

// Remove dangerous patterns
const removeDangerousPatterns = (str) => {
    if (typeof str !== 'string') return str;

    // Remove script tags
    str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Remove on* event handlers
    str = str.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove javascript: protocol
    str = str.replace(/javascript:/gi, '');

    // Remove data: protocol (can be used for XSS)
    str = str.replace(/data:/gi, '');

    // Remove vbscript: protocol
    str = str.replace(/vbscript:/gi, '');

    return str;
};

// Deep clean object
const deepClean = (obj) => {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
        return removeDangerousPatterns(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepClean(item));
    }

    if (typeof obj === 'object') {
        const cleaned = {};
        for (const key of Object.keys(obj)) {
            cleaned[key] = deepClean(obj[key]);
        }
        return cleaned;
    }

    return obj;
};

// Middleware function
const sanitizeInputs = (req, res, next) => {
    // Sanitize body
    if (req.body) {
        req.body = deepClean(req.body);
    }

    // Sanitize query params
    if (req.query) {
        req.query = deepClean(req.query);
    }

    // Sanitize URL params
    if (req.params) {
        req.params = deepClean(req.params);
    }

    next();
};

// Validate email format
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate MongoDB ObjectId
const isValidObjectId = (id) => {
    return /^[a-fA-F0-9]{24}$/.test(id);
};

// Validate username (alphanumeric + underscore, 3-20 chars)
const isValidUsername = (username) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
};

// Rate limit by IP (simple in-memory store)
const ipRequestCounts = new Map();
const IP_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 60;

const simpleRateLimit = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!ipRequestCounts.has(ip)) {
        ipRequestCounts.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
        return next();
    }

    const record = ipRequestCounts.get(ip);

    if (now > record.resetAt) {
        // Reset window
        record.count = 1;
        record.resetAt = now + IP_WINDOW_MS;
        return next();
    }

    record.count++;

    if (record.count > MAX_REQUESTS_PER_WINDOW) {
        return res.status(429).json({
            success: false,
            error: 'Too many requests. Please slow down.'
        });
    }

    next();
};

// Clean up old IP records periodically
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipRequestCounts.entries()) {
        if (now > record.resetAt + IP_WINDOW_MS) {
            ipRequestCounts.delete(ip);
        }
    }
}, 60000); // Clean every minute

module.exports = {
    sanitizeInputs,
    escapeHtml,
    sanitizeObject,
    deepClean,
    isValidEmail,
    isValidObjectId,
    isValidUsername,
    simpleRateLimit
};
