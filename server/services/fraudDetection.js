/**
 * Advanced Fraud Detection Service
 * Real-time fraud analysis with risk scoring and behavioral analysis
 */

const Order = require('../models/Order');
const User = require('../models/User');
const FraudAlert = require('../models/FraudAlert');

// Risk Score Configuration
const RISK_CONFIG = {
    thresholds: {
        low: 30,
        medium: 50,
        high: 75,
        critical: 100
    },
    weights: {
        newAccountHighValue: 25,
        rapidOrders: 30,
        multipleIPs: 25,
        failedPaymentsHistory: 15,
        highValueFirstPurchase: 15,
        usernameMismatch: 10,
        unusualOrderTime: 10,
        abnormalOrderValue: 20,
        ipBlacklisted: 35
    },
    // Time thresholds
    newAccountThresholdHours: 24,
    rapidOrdersWindowMinutes: 10,
    rapidOrdersThreshold: 3,
    highValueThreshold: 2000,
    unusualTimeStart: 2,  // 2 AM
    unusualTimeEnd: 5     // 5 AM
};

// In-memory IP blacklist (can be moved to database)
const ipBlacklist = new Set();

/**
 * Calculate risk level from score
 */
function getRiskLevel(score) {
    if (score >= RISK_CONFIG.thresholds.high) return 'critical';
    if (score >= RISK_CONFIG.thresholds.medium) return 'high';
    if (score >= RISK_CONFIG.thresholds.low) return 'medium';
    return 'low';
}

/**
 * Check if account is new (less than 24 hours old)
 */
function isNewAccount(user) {
    if (!user || !user.createdAt) return true;
    const accountAge = Date.now() - new Date(user.createdAt).getTime();
    const hoursOld = accountAge / (1000 * 60 * 60);
    return hoursOld < RISK_CONFIG.newAccountThresholdHours;
}

/**
 * Check for rapid orders (velocity check)
 */
async function checkRapidOrders(email) {
    const windowStart = new Date(Date.now() - RISK_CONFIG.rapidOrdersWindowMinutes * 60 * 1000);

    const recentOrders = await Order.countDocuments({
        email: email,
        createdAt: { $gte: windowStart }
    });

    return recentOrders >= RISK_CONFIG.rapidOrdersThreshold;
}

/**
 * Check for multiple IP addresses
 */
function hasMultipleIPs(user, currentIP) {
    if (!user || !user.ipAddresses || user.ipAddresses.length === 0) return false;

    // If current IP is new and user already has 3+ different IPs
    const existingIPs = new Set(user.ipAddresses);
    if (!existingIPs.has(currentIP) && existingIPs.size >= 3) {
        return true;
    }
    return false;
}

/**
 * Check for unusual order time (2 AM - 5 AM)
 */
function isUnusualTime() {
    const hour = new Date().getHours();
    return hour >= RISK_CONFIG.unusualTimeStart && hour <= RISK_CONFIG.unusualTimeEnd;
}

/**
 * Check if order value is abnormally high compared to user average
 */
function isAbnormalOrderValue(user, orderValue) {
    if (!user || user.totalOrders === 0) return false;

    const avgValue = user.avgOrderValue || 0;
    if (avgValue === 0) return false;

    // Flag if order is more than 3x user's average
    return orderValue > avgValue * 3;
}

/**
 * Check if it's a high value first purchase
 */
function isHighValueFirstPurchase(user, orderValue) {
    if (!user) return orderValue > RISK_CONFIG.highValueThreshold;
    return user.totalOrders === 0 && orderValue > RISK_CONFIG.highValueThreshold;
}

/**
 * Main fraud analysis function
 * @param {Object} orderData - Order data being placed
 * @param {Object} user - User object (can be null for guest)
 * @param {String} ipAddress - Client IP address
 * @param {String} userAgent - Client user agent
 * @returns {Object} Fraud analysis result
 */
async function analyzeOrder(orderData, user, ipAddress = 'unknown', userAgent = 'unknown') {
    const flags = [];
    let totalScore = 0;

    const orderValue = orderData.total || 0;
    const email = orderData.email || (user ? user.email : 'unknown');

    try {
        // 1. Check IP Blacklist
        if (ipBlacklist.has(ipAddress)) {
            flags.push({
                type: 'ip_blacklisted',
                description: 'IP address is blacklisted',
                points: RISK_CONFIG.weights.ipBlacklisted
            });
            totalScore += RISK_CONFIG.weights.ipBlacklisted;
        }

        // 2. New Account + High Value Check
        if (isNewAccount(user) && orderValue > RISK_CONFIG.highValueThreshold) {
            flags.push({
                type: 'new_account_high_value',
                description: `New account placing high value order (₹${orderValue})`,
                points: RISK_CONFIG.weights.newAccountHighValue
            });
            totalScore += RISK_CONFIG.weights.newAccountHighValue;
        }

        // 3. Rapid Orders Check
        if (email && email !== 'unknown') {
            const hasRapidOrders = await checkRapidOrders(email);
            if (hasRapidOrders) {
                flags.push({
                    type: 'rapid_orders',
                    description: `${RISK_CONFIG.rapidOrdersThreshold}+ orders in ${RISK_CONFIG.rapidOrdersWindowMinutes} minutes`,
                    points: RISK_CONFIG.weights.rapidOrders
                });
                totalScore += RISK_CONFIG.weights.rapidOrders;
            }
        }

        // 4. Multiple IPs Check
        if (user && hasMultipleIPs(user, ipAddress)) {
            flags.push({
                type: 'multiple_ips',
                description: 'Order from new IP, user has multiple IPs on record',
                points: RISK_CONFIG.weights.multipleIPs
            });
            totalScore += RISK_CONFIG.weights.multipleIPs;
        }

        // 5. High Value First Purchase
        if (isHighValueFirstPurchase(user, orderValue)) {
            flags.push({
                type: 'high_value_first_purchase',
                description: `First purchase over ₹${RISK_CONFIG.highValueThreshold}`,
                points: RISK_CONFIG.weights.highValueFirstPurchase
            });
            totalScore += RISK_CONFIG.weights.highValueFirstPurchase;
        }

        // 6. Unusual Time Check
        if (isUnusualTime()) {
            flags.push({
                type: 'unusual_order_time',
                description: 'Order placed during unusual hours (2-5 AM)',
                points: RISK_CONFIG.weights.unusualOrderTime
            });
            totalScore += RISK_CONFIG.weights.unusualOrderTime;
        }

        // 7. Abnormal Order Value
        if (user && isAbnormalOrderValue(user, orderValue)) {
            flags.push({
                type: 'abnormal_order_value',
                description: `Order value 3x higher than user average`,
                points: RISK_CONFIG.weights.abnormalOrderValue
            });
            totalScore += RISK_CONFIG.weights.abnormalOrderValue;
        }

        // Cap score at 100
        totalScore = Math.min(totalScore, 100);

        const riskLevel = getRiskLevel(totalScore);

        return {
            riskScore: totalScore,
            riskLevel,
            flags,
            shouldFlag: riskLevel !== 'low',
            shouldBlock: riskLevel === 'critical',
            timestamp: new Date(),
            ipAddress,
            userAgent,
            orderValue,
            email
        };
    } catch (error) {
        console.error('Fraud analysis error:', error);
        // Return low risk on error to not block legitimate orders
        return {
            riskScore: 0,
            riskLevel: 'low',
            flags: [],
            shouldFlag: false,
            shouldBlock: false,
            error: error.message
        };
    }
}

/**
 * Create fraud alert in database
 */
async function createFraudAlert(analysis, orderId, orderNumber, minecraftUsername) {
    try {
        const alert = new FraudAlert({
            userEmail: analysis.email,
            orderId,
            orderNumber,
            riskScore: analysis.riskScore,
            riskLevel: analysis.riskLevel,
            flags: analysis.flags,
            orderValue: analysis.orderValue,
            minecraftUsername,
            ipAddress: analysis.ipAddress,
            userAgent: analysis.userAgent,
            status: 'pending'
        });

        await alert.save();
        console.log(`🚨 Fraud alert created: ${orderNumber} - Risk: ${analysis.riskLevel} (${analysis.riskScore})`);
        return alert;
    } catch (error) {
        console.error('Failed to create fraud alert:', error);
        return null;
    }
}

/**
 * Update user's fraud-related statistics after order
 */
async function updateUserFraudStats(userId, orderValue, ipAddress) {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        // Update order stats
        const newTotalOrders = user.totalOrders + 1;
        const newTotalSpent = user.totalSpent + orderValue;
        const newAvgOrderValue = newTotalSpent / newTotalOrders;

        // Update IP addresses list
        const ipSet = new Set(user.ipAddresses || []);
        ipSet.add(ipAddress);

        await User.findByIdAndUpdate(userId, {
            $set: {
                totalOrders: newTotalOrders,
                totalSpent: newTotalSpent,
                avgOrderValue: newAvgOrderValue,
                lastOrderAt: new Date()
            },
            $addToSet: { ipAddresses: ipAddress }
        });
    } catch (error) {
        console.error('Failed to update user fraud stats:', error);
    }
}

/**
 * Update user login history
 */
async function recordLogin(userId, ipAddress, userAgent, success = true) {
    try {
        await User.findByIdAndUpdate(userId, {
            $push: {
                loginHistory: {
                    $each: [{ ip: ipAddress, userAgent, timestamp: new Date(), success }],
                    $slice: -50 // Keep last 50 logins only
                }
            },
            $addToSet: { ipAddresses: ipAddress }
        });
    } catch (error) {
        console.error('Failed to record login:', error);
    }
}

/**
 * Block a user and add their IPs to blacklist
 */
async function blockUser(userId) {
    try {
        const user = await User.findById(userId);
        if (!user) return false;

        // Add user's IPs to blacklist
        if (user.ipAddresses && user.ipAddresses.length > 0) {
            user.ipAddresses.forEach(ip => ipBlacklist.add(ip));
        }

        // Block user
        await User.findByIdAndUpdate(userId, {
            $set: {
                isBlocked: true,
                blockedAt: new Date()
            },
            $inc: { flagCount: 1 }
        });

        return true;
    } catch (error) {
        console.error('Failed to block user:', error);
        return false;
    }
}

/**
 * Get fraud statistics for dashboard
 */
async function getFraudStats() {
    try {
        const stats = await FraudAlert.getStats();

        // Get blocked users count
        const blockedUsers = await User.countDocuments({ isBlocked: true });

        // Get high-risk users
        const highRiskUsers = await User.countDocuments({ riskScore: { $gte: 50 } });

        return {
            ...stats,
            blockedUsers,
            highRiskUsers,
            blacklistedIPs: ipBlacklist.size
        };
    } catch (error) {
        console.error('Failed to get fraud stats:', error);
        return null;
    }
}

/**
 * Get user risk profile
 */
async function getUserRiskProfile(userId) {
    try {
        const user = await User.findById(userId).select('+loginHistory +ipAddresses');
        if (!user) return null;

        const recentAlerts = await FraudAlert.find({ userEmail: user.email })
            .sort({ createdAt: -1 })
            .limit(10);

        const recentOrders = await Order.find({ email: user.email })
            .sort({ createdAt: -1 })
            .limit(10);

        return {
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                riskScore: user.riskScore,
                flagCount: user.flagCount,
                totalOrders: user.totalOrders,
                totalSpent: user.totalSpent,
                avgOrderValue: user.avgOrderValue,
                accountAge: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
                ipCount: user.ipAddresses?.length || 0,
                isBlocked: user.isBlocked
            },
            recentAlerts,
            recentOrders
        };
    } catch (error) {
        console.error('Failed to get user risk profile:', error);
        return null;
    }
}

module.exports = {
    analyzeOrder,
    createFraudAlert,
    updateUserFraudStats,
    recordLogin,
    blockUser,
    getFraudStats,
    getUserRiskProfile,
    RISK_CONFIG
};
