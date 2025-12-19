const nodemailer = require('nodemailer');

// Email configuration using environment variables
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'armysmp2@gmail.com',
        pass: 'wfsmahnoczwrkqqt'
    }
});

// Format date for email
const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

// Send order notification email to admin
const sendOrderNotification = async (order) => {
    const itemsList = order.items.map(item =>
        `• ${item.name} × ${item.quantity} = ₹${item.subtotal}`
    ).join('\n');

    const mailOptions = {
        from: process.env.EMAIL_USER || 'armysmp2@gmail.com',
        to: process.env.EMAIL_USER || 'armysmp2@gmail.com',
        subject: `🛒 New Order: ${order.orderNumber} - ₹${order.total}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a2e; color: #ffffff; padding: 20px; border-radius: 10px;">
                <h1 style="color: #ff5500; text-align: center; margin-bottom: 20px;">
                    🎮 New Order Received!
                </h1>
                
                <div style="background: #16213e; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #ffffff; margin: 0 0 10px 0;">Order Details</h2>
                    <p style="margin: 5px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
                    <p style="margin: 5px 0;"><strong>Date & Time:</strong> ${formatDate(order.createdAt)}</p>
                    <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #ffaa00;">${order.status.toUpperCase()}</span></p>
                </div>

                <div style="background: #16213e; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #ffffff; margin: 0 0 10px 0;">Customer Info</h2>
                    <p style="margin: 5px 0;"><strong>🎮 Minecraft Username:</strong> <span style="color: #55ffff;">${order.minecraftUsername}</span></p>
                    <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${order.email || 'Not provided'}</p>
                </div>

                <div style="background: #16213e; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #ffffff; margin: 0 0 10px 0;">Items Purchased</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid #ff5500;">
                                <th style="text-align: left; padding: 8px; color: #ff5500;">Item</th>
                                <th style="text-align: center; padding: 8px; color: #ff5500;">Qty</th>
                                <th style="text-align: right; padding: 8px; color: #ff5500;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items.map(item => `
                                <tr style="border-bottom: 1px solid #333;">
                                    <td style="padding: 8px;">${item.name}</td>
                                    <td style="text-align: center; padding: 8px;">${item.quantity}</td>
                                    <td style="text-align: right; padding: 8px;">₹${item.subtotal}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div style="background: linear-gradient(135deg, #ff5500, #ff8800); padding: 15px; border-radius: 8px; text-align: center;">
                    <h2 style="color: #ffffff; margin: 0;">
                        💰 Total: ${order.totalDisplay}
                    </h2>
                </div>

                <p style="text-align: center; color: #888; margin-top: 20px; font-size: 12px;">
                    This is an automated email from Army SMP 2 Store
                </p>
            </div>
        `,
        text: `
NEW ORDER RECEIVED!

Order Number: ${order.orderNumber}
Date & Time: ${formatDate(order.createdAt)}
Status: ${order.status.toUpperCase()}

CUSTOMER INFO:
Minecraft Username: ${order.minecraftUsername}
Email: ${order.email || 'Not provided'}

ITEMS PURCHASED:
${itemsList}

TOTAL: ${order.totalDisplay}

---
Army SMP 2 Store
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Order notification email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send email:', error.message);
        return { success: false, error: error.message };
    }
};

// Verify email configuration on startup
const verifyEmailConfig = async () => {
    try {
        await transporter.verify();
        console.log('✅ Email service configured correctly');
        return true;
    } catch (error) {
        console.error('⚠️ Email service not configured:', error.message);
        console.log('💡 Make sure EMAIL_USER and EMAIL_PASS environment variables are set');
        return false;
    }
};

module.exports = {
    sendOrderNotification,
    verifyEmailConfig
};
