const mongoose = require('mongoose');

const BannedIPSchema = new mongoose.Schema({
    ip: { type: String, required: true, unique: true },
    bannedUntil: { type: Date, required: true }
});

module.exports = mongoose.model('BannedIP', BannedIPSchema);
