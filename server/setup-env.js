const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const USER = 'YOUR_DB_USER';
const CLUSTER = 'YOUR_CLUSTER_ID.mongodb.net';
const PARAMS = 'retryWrites=true&w=majority&appName=Army';

console.log('🔒 MongoDB Setup Wizard');
console.log('-----------------------');

rl.question('Enter your MongoDB Password: ', (password) => {
    // URL Encode the password
    const encodedPassword = encodeURIComponent(password);

    // Construct URI
    const uri = `mongodb+srv://${USER}:${encodedPassword}@${CLUSTER}/?${PARAMS}`;

    // Create .env content
    const envContent = `MONGODB_URI=${uri}\n` +
        `PORT=5000\n` +
        `ADMIN_PASSWORD=your_admin_password_here\n` +
        `EMAIL_USER=your_email@gmail.com\n` +
        `EMAIL_PASS=your_app_password_here\n`;

    const envPath = path.join(__dirname, '.env');

    try {
        fs.writeFileSync(envPath, envContent);
        console.log('\n✅ .env file updated successfully!');
        console.log(`🔑 Password encoded: ${encodedPassword}`);
        console.log(`🔗 URI set to: ${uri.substring(0, 50)}...`);
    } catch (err) {
        console.error('❌ Error writing .env:', err);
    }

    rl.close();
});
