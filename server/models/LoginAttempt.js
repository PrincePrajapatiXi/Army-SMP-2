const mongoose = require('mongoose');

const LoginAttemptSchema = new mongoose.Schema({
    ip: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LoginAttempt', LoginAttemptSchema);
