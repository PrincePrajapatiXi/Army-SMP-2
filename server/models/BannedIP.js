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
    const expiresAt = new Date(Date.now() + durationMs);
    return this.findOneAndUpdate(
        { ip },
        { ip, reason, expiresAt, bannedUntil: expiresAt, details },
        { upsert: true, new: true }
    );
};

module.exports = mongoose.model('BannedIP', BannedIPSchema);
