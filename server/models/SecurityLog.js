const mongoose = require('mongoose');

const securityLogSchema = new mongoose.Schema({
    ip: {
        type: String,
        required: true,
        index: true
    },
    path: {
        type: String,
        required: true
    },
    method: {
        type: String,
        default: 'UNKNOWN'
    },
    source: {
        type: String,
        enum: ['WAF', 'IPS'],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Auto-delete logs older than 30 days
securityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('SecurityLog', securityLogSchema);
