const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true }, // Keeping numeric ID for frontend compatibility
    name: { type: String, required: true },
    price: { type: Number, required: true },
    priceDisplay: { type: String },
    color: { type: String, default: '#ffffff' },
    category: { type: String, required: true },
    image: { type: String, default: '/images/stone.png' },
    description: { type: String },
    features: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
