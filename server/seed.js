require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('./models/Product');
const Order = require('./models/Order');

const productsFilePath = path.join(__dirname, 'data/products.json');
const ordersFilePath = path.join(__dirname, 'data/orders.json');

const seedDatabase = async () => {
    try {
        // Connect
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not set in .env");
        }
        await mongoose.connect(process.env.MONGODB_URI, { dbName: 'army-smp' });
        console.log('✅ Connected to MongoDB');

        // --- PRODUCTS ---
        if (fs.existsSync(productsFilePath)) {
            const productsData = fs.readFileSync(productsFilePath, 'utf8');
            const products = JSON.parse(productsData);

            console.log(`Checking ${products.length} products...`);
            let addedProducts = 0;
            for (const p of products) {
                const exists = await Product.findOne({ id: p.id });
                if (!exists) {
                    await Product.create(p);
                    addedProducts++;
                }
            }
            console.log(`✅ Products: Added ${addedProducts} new.`);
        }

        // --- ORDERS ---
        if (fs.existsSync(ordersFilePath)) {
            const ordersData = fs.readFileSync(ordersFilePath, 'utf8');
            const orders = JSON.parse(ordersData);

            console.log(`Checking ${orders.length} orders...`);
            let addedOrders = 0;
            for (const o of orders) {
                const exists = await Order.findOne({ id: o.id });
                if (!exists) {
                    // Ensure dates are parsed
                    if (o.createdAt) o.createdAt = new Date(o.createdAt);
                    if (o.updatedAt) o.updatedAt = new Date(o.updatedAt);

                    await Order.create(o);
                    addedOrders++;
                }
            }
            console.log(`✅ Orders: Added ${addedOrders} new.`);
        }

        console.log('✅ Migration Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

seedDatabase();
