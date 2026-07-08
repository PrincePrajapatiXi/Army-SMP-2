const mongoose = require('mongoose');

const BannedIPSchema = new mongoose.Schema({
    ip: { type: String, required: true, unique: true },
    bannedUntil: { type: Date },
    expiresAt: { type: Date },
    reason: { type: String, default: 'admin_login_failed' },
    details: { type: Object }
}, { timestamps: true });

BannedIPSchema.statics.getActiveBans = async function() {
    return this.find({
        $or: [
            { expiresAt: { $gt: new Date() } },
            { bannedUntil: { $gt: new Date() } }
        ]
    }).sort({ createdAt: -1 });
};

BannedIPSchema.statics.unbanIP = async function(id) {
    const result = await this.findByIdAndDelete(id);
    return !!result;
};

BannedIPSchema.statics.isBanned = async function(ip) {
    const ban = await this.findOne({ ip });
    if (!ban) return null;
    
    const expiry = ban.expiresAt || ban.bannedUntil;
    if (expiry && new Date() > expiry) {
        await this.deleteOne({ ip });
        return null;
    }
    
    // Normalize properties so waf.js can use them
    ban.expiresAt = expiry;
    return ban;
};

BannedIPSchema.statics.banIP = async function(ip, reason, durationMs, details = {}) {
    const newExpiresAt = new Date(Date.now() + durationMs);
    
    const existingBan = await this.findOne({ ip });
    if (existingBan) {
        const currentExpiry = existingBan.expiresAt || existingBan.bannedUntil;
        // Don't shorten an existing ban unless it's a manual override by an admin
        if (reason !== 'manual_ban' && currentExpiry && currentExpiry > newExpiresAt) {
            return existingBan;
        }
    }
    
    return this.findOneAndUpdate(
        { ip },
        { ip, reason, expiresAt: newExpiresAt, bannedUntil: newExpiresAt, details },
        { upsert: true, new: true }
    );
};
BannedIPSchema.statics.getStats = async function() {
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
        this.countDocuments({ expiresAt: { $gt: now } }),
        this.countDocuments({ reason: 'admin_login_failed', expiresAt: { $gt: now } }),
        this.countDocuments({ reason: 'waf_blocked', expiresAt: { $gt: now } }),
        this.countDocuments({ reason: 'ips_blocked', expiresAt: { $gt: now } }),
        this.countDocuments({ $or: [{ expiresAt: { $gt: oneDayAgo } }, { bannedUntil: { $gt: oneDayAgo } }] }),
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

module.exports = mongoose.model('BannedIP', BannedIPSchema);
