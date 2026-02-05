const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'army-smp-jwt-secret-2024-super-secure';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'army-smp-ADMIN-jwt-2024-ultra-secure';
const JWT_EXPIRES_IN = '30d'; // Token valid for 30 days
const ADMIN_JWT_EXPIRES_IN = '24h'; // Admin token valid for 24 hours only

// Generate JWT token for regular users
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Generate JWT token for admin
const generateAdminToken = () => {
    return jwt.sign({ isAdmin: true, createdAt: Date.now() }, ADMIN_JWT_SECRET, { expiresIn: ADMIN_JWT_EXPIRES_IN });
};

// Verify admin JWT token
const verifyAdminToken = (token) => {
    try {
        return jwt.verify(token, ADMIN_JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Admin authentication middleware
const requireAdminAuth = (req, res, next) => {
    try {
        let token = null;

        // Check Authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Admin access denied. No token provided.'
            });
        }

        // Verify admin token
        const decoded = verifyAdminToken(token);
        if (!decoded || !decoded.isAdmin) {
            return res.status(401).json({
                success: false,
                error: 'Invalid or expired admin token.'
            });
        }

        req.isAdmin = true;
        next();
    } catch (error) {
        console.error('Admin auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: 'Admin authentication error.'
        });
    }
};

// Verify JWT token
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// Auth middleware - requires authentication
const requireAuth = async (req, res, next) => {
    try {
        let token = null;

        // Check Authorization header first
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }

        // Fallback to cookie
        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token.'
            });
        }

        // Find user
        const user = await User.findById(decoded.userId).populate('badges.badge');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found.'
            });
        }

        // Check if user is blocked
        if (user.isBlocked) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been blocked. Please contact support.'
            });
        }

        // Attach user to request
        req.user = user;
        req.userId = user._id;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error.'
        });
    }
};

// Optional auth - doesn't fail if no token, but attaches user if present
const optionalAuth = async (req, res, next) => {
    try {
        let token = null;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }

        if (!token && req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (token) {
            const decoded = verifyToken(token);
            if (decoded) {
                const user = await User.findById(decoded.userId).populate('badges.badge');
                if (user) {
                    req.user = user;
                    req.userId = user._id;
                }
            }
        }

        next();
    } catch (error) {
        // Don't fail, just continue without user
        next();
    }
};

// Check if email is verified middleware
const requireVerifiedEmail = async (req, res, next) => {
    if (!req.user.isEmailVerified) {
        return res.status(403).json({
            success: false,
            message: 'Please verify your email address first.',
            requiresVerification: true
        });
    }
    next();
};

module.exports = {
    generateToken,
    generateAdminToken,
    verifyToken,
    verifyAdminToken,
    requireAuth,
    requireAdminAuth,
    optionalAuth,
    requireVerifiedEmail,
    JWT_SECRET,
    JWT_EXPIRES_IN
};

