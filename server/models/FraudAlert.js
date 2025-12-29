const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema({
    // References
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    userEmail: {
        type: String,
        required: true
    },
    orderId: {
        type: String,
        required: true
    },
    orderNumber: {
        type: String,
        required: true
    },

    // Risk Assessment
    riskScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true
    },

    // Detected Flags
    flags: [{
        type: {
            type: String,
            enum: [
                'new_account_high_value',
                'rapid_orders',
                'multiple_ips',
                'suspicious_payment_pattern',
                'high_value_first_purchase',
                'username_mismatch',
                'failed_payments_history',
                'unusual_order_time',
                'abnormal_order_value',
                'ip_blacklisted'
            ]
        },
        description: String,
        points: Number
    }],

    // Order Details
    orderValue: {
        type: Number,
        required: true
    },
    minecraftUsername: String,

    // Tracking Data
    ipAddress: {
        type: String,
        default: 'unknown'
    },
    userAgent: {
        type: String,
        default: 'unknown'
    },
    location: {
        country: String,
        city: String,
        region: String
    },

    // Status Management
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'approved', 'dismissed', 'blocked'],
        default: 'pending'
    },

    // Admin Actions
    reviewedBy: {
        type: String,
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        default: ''
    },
    actionTaken: {
        type: String,
        enum: ['none', 'warned', 'blocked', 'refunded'],
        default: 'none'
    }
}, {
    timestamps: true
});

// Indexes for faster queries
fraudAlertSchema.index({ status: 1, createdAt: -1 });
fraudAlertSchema.index({ userEmail: 1 });
fraudAlertSchema.index({ riskLevel: 1 });
fraudAlertSchema.index({ orderId: 1 });

// Virtual for time since alert
fraudAlertSchema.virtual('timeSinceAlert').get(function () {
    const now = new Date();
    const diff = now - this.createdAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
});

// Static method to get alert statistics
fraudAlertSchema.statics.getStats = async function () {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [total, pending, critical, todayCount, weekCount] = await Promise.all([
        this.countDocuments(),
        this.countDocuments({ status: 'pending' }),
        this.countDocuments({ riskLevel: 'critical', status: 'pending' }),
        this.countDocuments({ createdAt: { $gte: today } }),
        this.countDocuments({ createdAt: { $gte: thisWeek } })
    ]);

    return {
        total,
        pending,
        critical,
        todayCount,
        weekCount,
        resolvedToday: await this.countDocuments({
            reviewedAt: { $gte: today },
            status: { $in: ['approved', 'dismissed', 'blocked'] }
        })
    };
};

module.exports = mongoose.model('FraudAlert', fraudAlertSchema);
