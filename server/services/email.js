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
const DISCORD_WEBHOOK_COMPLETED = process.env.DISCORD_WEBHOOK_COMPLETED || DISCORD_WEBHOOK_URL; // Fallback to main webhook

const sendOrderNotification = async (order) => {
    console.log('📧 Sending notification for order:', order.orderNumber);

    // Format items list
    const itemsList = order.items.map(item =>
        `• **${item.name}** × ${item.quantity} = ₹${item.subtotal}`
    ).join('\n');

    // Try Discord Webhook first (most reliable on free hosting)
    if (DISCORD_WEBHOOK_URL) {
        try {
            // Build fields array dynamically
            const fields = [
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
                    value: order.couponInfo?.finalTotal
                        ? `₹${order.couponInfo.finalTotal.toFixed(2)}`
                        : order.totalDisplay,
                    inline: true
                },
                {
                    name: '📧 Customer Email',
                    value: order.email || 'Not provided',
                    inline: true
                }
            ];

            // Add coupon info if applied
            if (order.couponInfo?.couponCode) {
                fields.push({
                    name: '🎁 Coupon Applied',
                    value: `**${order.couponInfo.couponCode}** (-₹${order.couponInfo.discount.toFixed(2)})`,
                    inline: true
                });
            }

            fields.push(
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
            );

            // Add transaction ID if available
            if (order.transactionId) {
                fields.push({
                    name: '💳 Transaction ID',
                    value: `\`${order.transactionId}\``,
                    inline: false
                });
                fields.push({
                    name: '💰 Payment Status',
                    value: '⏳ Pending Verification',
                    inline: true
                });
            }

            const discordPayload = {
                embeds: [{
                    title: `🛒 New Order: ${order.orderNumber}`,
                    color: order.couponInfo?.couponCode ? 0x22c55e : 0xff5500, // Green if coupon applied
                    fields: fields,
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

// Send status update notification (for completed and cancelled orders)
const sendStatusUpdateNotification = async (order, newStatus) => {
    if (!DISCORD_WEBHOOK_URL) {
        console.log('⚠️ No Discord webhook configured for status updates');
        return { success: false };
    }

    // Only send notification for completed or cancelled status
    if (newStatus !== 'completed' && newStatus !== 'cancelled') {
        return { success: false, reason: 'Not a completed or cancelled status' };
    }

    console.log(`📧 Sending ${newStatus} notification for order: ${order.orderNumber}`);

    try {
        const itemsList = order.items.map(item =>
            `• **${item.name}** × ${item.quantity}`
        ).join('\n');

        // Determine styling based on status
        const isCompleted = newStatus === 'completed';
        const title = isCompleted
            ? `✅ Order Completed: ${order.orderNumber}`
            : `❌ Order Cancelled: ${order.orderNumber}`;
        const color = isCompleted ? 0x22c55e : 0xef4444; // Green or Red
        const description = isCompleted
            ? `Order has been marked as **COMPLETED**! 🎉`
            : `Order has been marked as **CANCELLED**! ❌`;
        const footerText = isCompleted
            ? 'Army SMP 2 Store - Order Fulfilled'
            : 'Army SMP 2 Store - Order Rejected';
        const itemsLabel = isCompleted ? '📦 Items Delivered' : '📦 Items (Cancelled)';
        const timeLabel = isCompleted ? '🕐 Completed At' : '🕐 Cancelled At';

        const discordPayload = {
            embeds: [{
                title: title,
                color: color,
                description: description,
                fields: [
                    {
                        name: '🎮 Minecraft Username',
                        value: order.minecraftUsername,
                        inline: true
                    },
                    {
                        name: '🎯 Platform',
                        value: order.platform === 'Bedrock' ? '🪨 Bedrock' : '☕ Java',
                        inline: true
                    },
                    {
                        name: '💰 Amount',
                        value: order.totalDisplay || `₹${order.total}`,
                        inline: true
                    },
                    {
                        name: itemsLabel,
                        value: itemsList || 'No items',
                        inline: false
                    },
                    {
                        name: '📧 Customer Email',
                        value: order.email || 'Not provided',
                        inline: true
                    },
                    {
                        name: timeLabel,
                        value: formatDate(new Date().toISOString()),
                        inline: true
                    }
                ],
                footer: {
                    text: footerText
                },
                timestamp: new Date().toISOString()
            }]
        };

        const response = await fetch(DISCORD_WEBHOOK_COMPLETED, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordPayload)
        });

        if (response.ok) {
            console.log(`✅ ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} notification sent successfully!`);
            return { success: true };
        } else {
            console.log(`⚠️ ${newStatus} notification failed:`, response.status);
            return { success: false };
        }
    } catch (error) {
        console.error(`❌ ${newStatus} notification error:`, error.message);
        return { success: false, error: error.message };
    }
};

// Send OTP Email (for authentication) - Uses Resend for reliable delivery
const sendOTPEmail = async (email, otp, type, userName = 'User') => {
    console.log(`📧 Sending OTP email to ${email} for ${type}`);

    const isVerification = type === 'emailVerification';
    const subject = isVerification
        ? `🔐 Verify Your Email - Army SMP 2`
        : `🔐 Password Reset OTP - Army SMP 2`;

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #f97316; margin: 0;">Army SMP 2</h1>
                <p style="color: #9ca3af; margin-top: 5px;">Minecraft Server Store</p>
            </div>
            
            <div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 10px; text-align: center;">
                <h2 style="color: #ffffff; margin-top: 0;">${isVerification ? 'Verify Your Email' : 'Reset Your Password'}</h2>
                <p style="color: #d1d5db;">Hello <strong>${userName}</strong>!</p>
                <p style="color: #d1d5db;">${isVerification
            ? 'Use the code below to verify your email address:'
            : 'Use the code below to reset your password:'}</p>
                
                <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <span style="font-size: 36px; font-weight: bold; color: white; letter-spacing: 8px;">${otp}</span>
                </div>
                
                <p style="color: #9ca3af; font-size: 14px;">This code will expire in 10 minutes.</p>
                <p style="color: #9ca3af; font-size: 14px;">If you didn't request this, please ignore this email.</p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                <p style="color: #6b7280; font-size: 12px;">© 2024 Army SMP 2. All rights reserved.</p>
            </div>
        </div>
    `;

    // Try Resend first (most reliable on Render)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
        try {
            const { Resend } = require('resend');
            const resend = new Resend(RESEND_API_KEY);

            const { data, error } = await resend.emails.send({
                from: 'Army SMP 2 <onboarding@resend.dev>',
                to: email,
                subject: subject,
                html: htmlContent
            });

            if (error) {
                console.error('❌ Resend error:', error);
            } else {
                console.log('✅ OTP email sent via Resend:', data.id);
                return { success: true, method: 'resend', id: data.id };
            }
        } catch (resendError) {
            console.error('❌ Resend failed:', resendError.message);
        }
    } else {
        console.log('⚠️ RESEND_API_KEY not configured');
    }

    // Discord notification for admin (backup/logging)
    if (DISCORD_WEBHOOK_URL) {
        try {
            const title = isVerification ? '✉️ Verify Your Email' : '🔐 Password Reset Request';
            const description = isVerification
                ? `Hello **${userName}**! Please verify your email address.`
                : `Hello **${userName}**! Password reset requested.`;
            const color = isVerification ? 0x22c55e : 0xf59e0b;

            const discordPayload = {
                embeds: [{
                    title: title,
                    color: color,
                    description: description,
                    fields: [
                        { name: '📧 Email', value: email, inline: true },
                        { name: '🔑 OTP Code', value: `\`${otp}\``, inline: true },
                        { name: '⏰ Valid For', value: '10 minutes', inline: true },
                        { name: '📋 Type', value: isVerification ? 'Email Verification' : 'Password Reset', inline: true }
                    ],
                    footer: { text: 'Army SMP 2 - Authentication' },
                    timestamp: new Date().toISOString()
                }]
            };

            await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(discordPayload)
            });
            console.log('✅ OTP notification sent to Discord (backup)');
        } catch (discordError) {
            console.error('❌ Discord notification error:', discordError.message);
        }
    }

    // Fallback: Try Gmail (works locally, may fail on Render)
    try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: { user: 'armysmp2@gmail.com', pass: 'wfsmahnoczwrkqqt' },
            connectionTimeout: 5000,
            socketTimeout: 5000
        });

        const info = await transporter.sendMail({
            from: 'armysmp2@gmail.com',
            to: email,
            subject: subject,
            html: htmlContent
        });
        console.log('📧 OTP email sent via Gmail:', info.messageId);
        return { success: true, method: 'gmail', messageId: info.messageId };
    } catch (gmailError) {
        console.error('❌ Gmail failed:', gmailError.message);
    }

    // Log OTP to console for development
    console.log(`\n========================================`);
    console.log(`📧 OTP for ${email}: ${otp}`);
    console.log(`Type: ${type}`);
    console.log(`========================================\n`);

    return { success: true, method: 'console' };
};

module.exports = {
    sendOrderNotification,
    sendStatusUpdateNotification,
    sendOTPEmail,
    verifyEmailConfig
};

