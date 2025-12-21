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
    transactionId: { type: String }, // UPI Transaction ID / UTR
    paymentMethod: { type: String, default: 'UPI' },
    paymentVerifiedAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
