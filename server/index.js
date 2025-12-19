const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

// Import routes
const productsRouter = require('./routes/products');
const cartRouter = require('./routes/cart');
const ordersRouter = require('./routes/orders');
const serverStatusRouter = require('./routes/serverStatus');

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

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Army SMP Backend is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
    console.log(`🎮 Army SMP Backend running on http://localhost:${PORT}`);
    console.log(`📦 Products API: http://localhost:${PORT}/api/products`);
    console.log(`🛒 Cart API: http://localhost:${PORT}/api/cart`);
    console.log(`📋 Orders API: http://localhost:${PORT}/api/orders`);

    // Verify email configuration
    await verifyEmailConfig();
});
