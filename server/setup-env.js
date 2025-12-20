const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const USER = 'princeprajapati2589_db_user';
const CLUSTER = 'army.cvueaew.mongodb.net';
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
        `ADMIN_PASSWORD=Prince_Uday\n` +
        `EMAIL_USER=armysmp2@gmail.com\n` +
        `EMAIL_PASS=wfsmahnoczwrkqqt\n`; // Preserving email creds

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
