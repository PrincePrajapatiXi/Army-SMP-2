const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        lowercase: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [20, 'Username cannot exceed 20 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    password: {
        type: String,
        minlength: [6, 'Password must be at least 6 characters'],
        select: false // Don't return password by default in queries
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [50, 'Name cannot exceed 50 characters']
    },
    avatar: {
        type: String,
        default: ''
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'facebook'],
        default: 'local'
    },
    providerId: {
        type: String,
        default: null
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    minecraftUsername: {
        type: String,
        trim: true,
        default: ''
    },
    phone: {
        type: String,
        trim: true,
        default: ''
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockedAt: {
        type: Date,
        default: null
    },
    // Fraud Detection Fields
    riskScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    totalOrders: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    lastOrderAt: {
        type: Date,
        default: null
    },
    avgOrderValue: {
        type: Number,
        default: 0
    },
    loginHistory: [{
        ip: String,
        userAgent: String,
        timestamp: { type: Date, default: Date.now },
        success: { type: Boolean, default: true }
    }],
    ipAddresses: [{
        type: String
    }],
    flagCount: {
        type: Number,
        default: 0
    },
    // Referral System Fields
    referralCode: {
        type: String,
        unique: true,
        sparse: true // Allows null but ensures uniqueness when set
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    referralCount: {
        type: Number,
        default: 0
    },
    referralEarnings: {
        type: Number,
        default: 0
    },
    referralBalance: {
        type: Number,
        default: 0 // Available balance to use as discount
    },
    // Badges
    badges: [{
        badge: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Badge'
        },
        assignedAt: {
            type: Date,
            default: Date.now
        },
        assignedBy: {
            type: String,
            default: 'system'
        }
    }]
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
    // Only hash password if it's modified or new
    if (!this.isModified('password') || !this.password) {
        return;
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false;
    return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (without sensitive data)
userSchema.methods.toPublicJSON = function () {
    return {
        id: this._id,
        email: this.email,
        username: this.username,
        name: this.name,
        avatar: this.avatar,
        authProvider: this.authProvider,
        isEmailVerified: this.isEmailVerified,
        minecraftUsername: this.minecraftUsername,
        phone: this.phone,
        isBlocked: this.isBlocked,
        blockedAt: this.blockedAt,
        badges: this.badges || [],
        createdAt: this.createdAt
    };
};

// Static method to find by email or username
userSchema.statics.findByEmailOrUsername = async function (identifier) {
    const lowercaseIdentifier = identifier.toLowerCase();
    return this.findOne({
        $or: [
            { email: lowercaseIdentifier },
            { username: lowercaseIdentifier }
        ]
    }).select('+password');
};

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
