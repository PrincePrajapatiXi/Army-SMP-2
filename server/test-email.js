const { sendOrderNotification, verifyEmailConfig } = require('./services/email');

// Test order data
const testOrder = {
    orderNumber: 'TEST-' + Date.now().toString(36).toUpperCase(),
    minecraftUsername: 'TestPlayer123',
    email: 'armysmp2@gmail.com',
    items: [
        { id: 1, name: 'Test Rank', price: 100, quantity: 1, subtotal: 100 }
    ],
    total: 100,
    totalDisplay: '₹100.00',
    status: 'pending',
    createdAt: new Date().toISOString()
};

async function testEmail() {
    console.log('🔍 Verifying email config...');
    const configOk = await verifyEmailConfig();

    if (!configOk) {
        console.log('❌ Email configuration failed!');
        process.exit(1);
    }

    console.log('📧 Sending test email...');
    const result = await sendOrderNotification(testOrder);

    if (result.success) {
        console.log('✅ Email sent successfully!');
        console.log('📮 Message ID:', result.messageId);
    } else {
        console.log('❌ Email failed:', result.error);
    }

    process.exit(0);
}

testEmail();
