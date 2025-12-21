const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    logo: {
        type: String,
        default: '/images/stone.png'
    },
    tagline: {
        type: String,
        default: 'Your Amazing Service'
    },
    description: {
        type: String,
        required: true
    },
    features: [{
        type: String
    }],
    link: {
        type: String,
        required: true
    },
    buttonText: {
        type: String,
        default: 'Learn More'
    },
    gradient: {
        type: String,
        default: 'linear-gradient(135deg, #1e3a5f, #0d1b2a)'
    },
    position: {
        type: Number,
        default: 1
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Promotion', promotionSchema);
