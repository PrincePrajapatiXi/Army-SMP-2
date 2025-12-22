const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // Using UUID string for ID
    orderNumber: { type: String, required: true, unique: true },
    minecraftUsername: { type: String, required: true },
    email: { type: String }, // Optional
    discordId: { type: String },
    platform: { type: String, default: 'Java' }, // Java or Bedrock
    items: [{
        id: Number,
        name: String,
        price: Number,
        quantity: Number,
        subtotal: Number,
        image: String
    }],
    subtotal: { type: Number }, // Before discount
    total: { type: Number, required: true },
    totalDisplay: { type: String }, // Formatted total with currency
    couponInfo: {
        couponCode: String,
        discount: Number,
        finalTotal: Number
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'processing'],
        default: 'pending'
    },
    // Payment tracking
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    transactionId: {
        type: String,
        sparse: true // Allow null but enforce uniqueness when present
    },
    paymentMethod: { type: String, default: 'UPI' },
    paymentScreenshot: { type: String }, // Base64 or URL of payment proof
    paymentVerifiedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Unique index on transactionId (only for non-null values)
orderSchema.index({ transactionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Order', orderSchema);
