const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Badge name is required'],
        trim: true,
        maxlength: [50, 'Badge name cannot exceed 50 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [200, 'Description cannot exceed 200 characters'],
        default: ''
    },
    image: {
        type: String,
        required: [true, 'Badge image is required']
    },
    color: {
        type: String,
        default: '#f97316' // Default orange
    },
    rarity: {
        type: String,
        enum: ['common', 'rare', 'epic', 'legendary'],
        default: 'common'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries
badgeSchema.index({ name: 1 });
badgeSchema.index({ rarity: 1 });
badgeSchema.index({ isActive: 1 });

const Badge = mongoose.model('Badge', badgeSchema);

module.exports = Badge;
