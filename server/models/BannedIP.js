const mongoose = require('mongoose');

const BannedIPSchema = new mongoose.Schema({
    ip: { type: String, required: true, unique: true },
    bannedUntil: { type: Date },
    expiresAt: { type: Date },
    reason: { type: String, default: 'admin_login_failed' },
    details: { type: Object }
});

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

module.exports = mongoose.model('BannedIP', BannedIPSchema);
