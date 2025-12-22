const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    otp: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['emailVerification', 'passwordReset', 'admin2FA'],
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    },
    isUsed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for faster queries
otpSchema.index({ email: 1, type: 1 });

// Generate 6-digit OTP
otpSchema.statics.generateOTP = function () {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create and save new OTP
otpSchema.statics.createOTP = async function (email, type) {
    // Delete any existing OTPs for this email and type
    await this.deleteMany({ email: email.toLowerCase(), type });

    const otp = this.generateOTP();
    const otpDoc = await this.create({
        email: email.toLowerCase(),
        otp,
        type,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    return otp;
};

// Verify OTP
otpSchema.statics.verifyOTP = async function (email, otp, type) {
    const otpDoc = await this.findOne({
        email: email.toLowerCase(),
        otp,
        type,
        isUsed: false,
        expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
        return { valid: false, message: 'Invalid or expired OTP' };
    }

    // Mark as used
    otpDoc.isUsed = true;
    await otpDoc.save();

    return { valid: true, message: 'OTP verified successfully' };
};

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
