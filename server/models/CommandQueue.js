const mongoose = require('mongoose');

const commandQueueSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        index: true
    },
    username: {
        type: String,
        required: true
    },
    command: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    retries: {
        type: Number,
        default: 0
    },
    lastAttemptAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CommandQueue', commandQueueSchema);
