const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
// path imported above
const Product = require('./models/Product');

const productsFilePath = path.join(__dirname, 'data/products.json');

const seedDatabase = async () => {
    try {
        // Connect
        await mongoose.connect(process.env.MONGODB_URI, { dbName: 'army-smp' });
        console.log('✅ Connected to MongoDB');

        // Read local file
        const data = fs.readFileSync(productsFilePath, 'utf8');
        const products = JSON.parse(data);

        // Clear existing (optional, but safer to avoid dupes if running multiple times)
        // For safety, let's NOT clear, just check if empty? Or simple logic:
        // Use insertMany (will fail on duplicate IDs if unique:true).

        console.log(`Checking ${products.length} products...`);

        let added = 0;
        for (const p of products) {
            const exists = await Product.findOne({ id: p.id });
            if (!exists) {
                await Product.create(p);
                added++;
            }
        }

        console.log(`✅ Migration Complete! Added ${added} new products to Database.`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

seedDatabase();
