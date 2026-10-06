const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('❌ FATAL: MONGODB_URI not found in environment variables. Cannot start without database.');
            process.exit(1);
        }
        
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: 'army-smp',
            // SECURITY: Enforce TLS/SSL for all connections to MongoDB Atlas
            tls: true,
            // Prevent hanging forever if the DB is unreachable
            serverSelectionTimeoutMS: 10000, // 10 seconds
            socketTimeoutMS: 45000,          // 45 seconds
            // Limit connection pool to avoid resource exhaustion
            maxPoolSize: 10,
            minPoolSize: 2
        });
        console.log('✅ Connected to MongoDB (TLS enforced)');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
