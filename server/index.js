const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const session = require('express-session');
// path imported above
const mongoose = require('mongoose');

// Import routes
const productsRouter = require('./routes/products');
const cartRouter = require('./routes/cart');
const ordersRouter = require('./routes/orders');
const serverStatusRouter = require('./routes/serverStatus');
const adminRouter = require('./routes/admin');
const couponsRouter = require('./routes/coupons');

// Import email service
const { verifyEmailConfig } = require('./services/email');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'https://army-smp-2.onrender.com',
        'https://armysmp.onrender.com',
        'https://army-smp-2.vercel.app',
        'https://armysmp2.vercel.app'
    ],
    credentials: true
}));

app.use(express.json());

// Session configuration for cart persistence
app.use(session({
    secret: 'army-smp-secret-key-2024',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/server-status', serverStatusRouter);
app.use('/api/admin', adminRouter);
app.use('/api/coupons', couponsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Army SMP Backend is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// Connect to MongoDB
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI, { dbName: 'army-smp' })
        .then(() => console.log('✅ Connected to MongoDB'))
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
} else {
    console.warn('⚠️ MONGODB_URI not found in environment variables. Database features will fail.');
}

// Start server
app.listen(PORT, async () => {
    console.log(`🎮 Army SMP Backend running on http://localhost:${PORT}`);
    console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
    console.log(`🛒 Cart API: http://localhost:${PORT}/api/cart`);
    console.log(`📋 Orders API: http://localhost:${PORT}/api/orders`);
    console.log(`🔐 Admin API: http://localhost:${PORT}/api/admin`);

    // Verify email configuration
    await verifyEmailConfig();
});
