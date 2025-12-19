// Email service using HTTP API (works on Render which blocks SMTP)
// Using EmailJS REST API for reliable email delivery

const EMAILJS_SERVICE_ID = 'service_armysmp';
const EMAILJS_TEMPLATE_ID = 'template_order';
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY'; // User needs to set this
const EMAILJS_PRIVATE_KEY = 'YOUR_PRIVATE_KEY'; // User needs to set this

// Admin email to receive notifications
const ADMIN_EMAIL = 'armysmp2@gmail.com';

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

// Send order notification using Discord Webhook (FREE and works everywhere!)
// This is the most reliable solution for free hosting
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';

const sendOrderNotification = async (order) => {
    console.log('📧 Sending notification for order:', order.orderNumber);

    // Format items list
    const itemsList = order.items.map(item =>
        `• **${item.name}** × ${item.quantity} = ₹${item.subtotal}`
    ).join('\n');

    // Try Discord Webhook first (most reliable on free hosting)
    if (DISCORD_WEBHOOK_URL) {
        try {
            const discordPayload = {
                embeds: [{
                    title: `🛒 New Order: ${order.orderNumber}`,
                    color: 0xff5500,
                    fields: [
                        {
                            name: '🎮 Minecraft Username',
                            value: order.minecraftUsername,
                            inline: true
                        },
                        {
                            name: '🎯 Platform',
                            value: order.platform === 'Bedrock' ? '🪨 Bedrock Edition' : '☕ Java Edition',
                            inline: true
                        },
                        {
                            name: '💰 Total',
                            value: order.totalDisplay,
                            inline: true
                        },
                        {
                            name: '📧 Customer Email',
                            value: order.email || 'Not provided',
                            inline: true
                        },
                        {
                            name: '📦 Items',
                            value: itemsList || 'No items',
                            inline: false
                        },
                        {
                            name: '🕐 Order Time',
                            value: formatDate(order.createdAt),
                            inline: true
                        },
                        {
                            name: '📋 Status',
                            value: order.status.toUpperCase(),
                            inline: true
                        }
                    ],
                    footer: {
                        text: 'Army SMP 2 Store'
                    },
                    timestamp: order.createdAt
                }]
            };

            const response = await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(discordPayload)
            });

            if (response.ok) {
                console.log('📧 Discord notification sent successfully!');
                return { success: true, method: 'discord' };
            } else {
                console.log('⚠️ Discord webhook failed:', response.status);
            }
        } catch (discordError) {
            console.error('❌ Discord webhook error:', discordError.message);
        }
    }

    // Fallback: Try nodemailer with Gmail (works locally, may timeout on Render)
    try {
        const nodemailer = require('nodemailer');

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'armysmp2@gmail.com',
                pass: 'wfsmahnoczwrkqqt'
            },
            connectionTimeout: 10000, // 10 second timeout
            socketTimeout: 10000
        });

        const mailOptions = {
            from: 'armysmp2@gmail.com',
            to: 'armysmp2@gmail.com',
            subject: `🛒 New Order: ${order.orderNumber} - ₹${order.total}`,
            text: `
NEW ORDER RECEIVED!

Order Number: ${order.orderNumber}
Date & Time: ${formatDate(order.createdAt)}

CUSTOMER INFO:
Minecraft Username: ${order.minecraftUsername}
Email: ${order.email || 'Not provided'}

ITEMS:
${order.items.map(i => `• ${i.name} × ${i.quantity} = ₹${i.subtotal}`).join('\n')}

TOTAL: ${order.totalDisplay}

---
Army SMP 2 Store
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Gmail notification sent:', info.messageId);
        return { success: true, method: 'gmail', messageId: info.messageId };
    } catch (gmailError) {
        console.error('❌ Gmail failed (expected on Render):', gmailError.message);
    }

    // If we get here, no notification was sent
    console.log('⚠️ No notification method worked. Order still created.');
    return { success: false, error: 'No notification method available' };
};

// Verify email config
const verifyEmailConfig = async () => {
    if (DISCORD_WEBHOOK_URL) {
        console.log('✅ Discord webhook configured for notifications');
        return true;
    }
    console.log('⚠️ No Discord webhook URL set. Set DISCORD_WEBHOOK_URL env variable.');
    console.log('💡 Create a Discord webhook and add it to Render environment variables.');
    return false;
};

module.exports = {
    sendOrderNotification,
    verifyEmailConfig
};
