/**
 * BannedIP Model
 * Stores IP bans persistently in MongoDB
 * Used for admin login protection, WAF blocks, and IPS blocks
 */

const mongoose = require('mongoose');

const bannedIPSchema = new mongoose.Schema({
    ip: {
        type: String,
        required: true,
        index: true
    },
    reason: {
        type: String,
        enum: ['admin_login_failed', 'waf_blocked', 'ips_blocked', 'manual_ban'],
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    failedAttempts: {
        type: Number,
        default: 0
    },
    bannedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    bannedBy: {
        type: String,
        enum: ['system', 'admin'],
        default: 'system'
    },
    // Track what triggered the ban
    metadata: {
        userAgent: String,
        attackType: String,
        requestPath: String,
        requestMethod: String
    }
}, {
    timestamps: true
});

// Compound index for efficient lookups
bannedIPSchema.index({ ip: 1, isActive: 1 });
bannedIPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index - auto-delete expired bans

/**
 * Check if an IP is currently banned
 * @param {String} ip - IP address to check
 * @returns {Object|null} - Ban record if banned, null if not
 */
bannedIPSchema.statics.isBanned = async function(ip) {
    const now = new Date();
    const ban = await this.findOne({
        ip: ip,
        isActive: true,
        expiresAt: { $gt: now }
    }).sort({ bannedAt: -1 });

    return ban;
};

/**
 * Ban an IP address
 * @param {String} ip - IP to ban
 * @param {String} reason - Reason for ban
 * @param {Number} durationMs - Ban duration in milliseconds
 * @param {Object} metadata - Additional info
 * @returns {Object} - Created ban record
 */
bannedIPSchema.statics.banIP = async function(ip, reason, durationMs, metadata = {}) {
    const now = new Date();
    let expiresAt = new Date(now.getTime() + durationMs);

    // Find if there's an existing active ban with a longer expiration
    // This prevents shorter bans (e.g. 24h WAF) from overwriting longer bans (e.g. 1 week admin login)
    const existingLongerBan = await this.findOne({
        ip: ip,
        isActive: true,
        expiresAt: { $gt: expiresAt }
    });

    if (existingLongerBan) {
        expiresAt = existingLongerBan.expiresAt;
    }

    // Deactivate any existing ACTIVE bans for this IP first
    // Note: This only touches isActive:true records (actual bans), 
    // NOT tracking records (isActive:false) which are needed for attempt counting
    await this.updateMany(
        { ip: ip, isActive: true },
        { $set: { isActive: false } }
    );

    const ban = await this.create({
        ip,
        reason,
        description: metadata.description || '',
        failedAttempts: metadata.failedAttempts || 0,
        bannedAt: now,
        expiresAt,
        isActive: true,
        bannedBy: metadata.bannedBy || 'system',
        metadata: {
            userAgent: metadata.userAgent || '',
            attackType: metadata.attackType || '',
            requestPath: metadata.requestPath || '',
            requestMethod: metadata.requestMethod || ''
        }
    });

    return ban;
};

/**
 * Unban an IP address
 * @param {String} banId - Ban record ID
 * @returns {Boolean} - Success
 */
bannedIPSchema.statics.unbanIP = async function(banId) {
    const result = await this.findByIdAndUpdate(banId, {
        isActive: false
    });
    return !!result;
};

/**
 * Get all active bans
 * @returns {Array} - Active ban records
 */
bannedIPSchema.statics.getActiveBans = async function() {
    const now = new Date();
    return await this.find({
        isActive: true,
        expiresAt: { $gt: now }
    }).sort({ bannedAt: -1 });
};

/**
 * Get ban statistics
 * @returns {Object} - Ban stats
 */
bannedIPSchema.statics.getStats = async function() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
        totalActiveBans,
        adminLoginBans,
        wafBans,
        ipsBans,
        last24hBans,
        totalBansEver
    ] = await Promise.all([
        this.countDocuments({ isActive: true, expiresAt: { $gt: now } }),
        this.countDocuments({ isActive: true, reason: 'admin_login_failed', expiresAt: { $gt: now } }),
        this.countDocuments({ isActive: true, reason: 'waf_blocked', expiresAt: { $gt: now } }),
        this.countDocuments({ isActive: true, reason: 'ips_blocked', expiresAt: { $gt: now } }),
        this.countDocuments({ bannedAt: { $gte: oneDayAgo } }),
        this.countDocuments({})
    ]);

    return {
        totalActiveBans,
        adminLoginBans,
        wafBans,
        ipsBans,
        last24hBans,
        totalBansEver
    };
};

/**
 * Track failed admin login attempt
 * Returns the updated attempt count, bans if threshold reached
 */
bannedIPSchema.statics.trackAdminLoginFailure = async function(ip, userAgent = '') {
    const MAX_ATTEMPTS = 2;
    const BAN_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 week in ms
    const TRACKING_WINDOW = 7 * 24 * 60 * 60 * 1000; // 1 week — same as ban duration

    // Check if already banned
    const existingBan = await this.isBanned(ip);
    if (existingBan) {
        return {
            banned: true,
            ban: existingBan,
            attemptsRemaining: 0
        };
    }

    // Count failed attempts within the tracking window (1 week)
    const windowStart = new Date(Date.now() - TRACKING_WINDOW);

    // Count recent failed attempts from inactive/expired records
    const recentFailures = await this.countDocuments({
        ip: ip,
        reason: 'admin_login_failed',
        isActive: false,
        createdAt: { $gte: windowStart }
    });

    const totalAttempts = recentFailures + 1; // +1 for current attempt

    if (totalAttempts >= MAX_ATTEMPTS) {
        // BAN the IP for 1 week
        const ban = await this.banIP(ip, 'admin_login_failed', BAN_DURATION, {
            description: `Banned after ${totalAttempts} failed admin login attempts`,
            failedAttempts: totalAttempts,
            userAgent,
            bannedBy: 'system'
        });

        console.log(`🚫 IP BANNED: ${ip} — ${totalAttempts} failed admin login attempts — Banned for 1 week`);

        return {
            banned: true,
            ban,
            attemptsRemaining: 0
        };
    } else {
        // Record the failed attempt (inactive record for counting)
        // Set expiresAt to 1 week so TTL index doesn't delete it before the tracking window ends
        await this.create({
            ip,
            reason: 'admin_login_failed',
            description: `Failed admin login attempt #${totalAttempts}`,
            failedAttempts: totalAttempts,
            bannedAt: new Date(),
            expiresAt: new Date(Date.now() + TRACKING_WINDOW), // 1 week — survives the full tracking window
            isActive: false, // Not a ban, just tracking
            bannedBy: 'system',
            metadata: { userAgent }
        });

        return {
            banned: false,
            attemptsRemaining: MAX_ATTEMPTS - totalAttempts,
            totalAttempts
        };
    }
};

module.exports = mongoose.model('BannedIP', bannedIPSchema);
