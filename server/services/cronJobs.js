const cron = require('node-cron');
const CommandQueue = require('../models/CommandQueue');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { Rcon } = require('rcon-client');

// Initialize all cron jobs
function initCronJobs() {
    console.log('🕒 Initializing Background Cron Jobs...');

    // 1. Retry Offline Queue (Every 5 minutes)
    cron.schedule('*/5 * * * *', async () => {
        try {
            const pendingCommands = await CommandQueue.find({ status: 'pending' }).limit(20);
            if (pendingCommands.length === 0) return;

            const host = process.env.RCON_HOST || 'localhost';
            const port = parseInt(process.env.RCON_PORT || 25575);
            const password = process.env.RCON_PASSWORD;

            if (!password) return; // Can't connect

            console.log(`🔄 Retrying ${pendingCommands.length} offline commands...`);
            
            // Try connecting to RCON once for the batch
            let rcon;
            try {
                rcon = await Rcon.connect({ host, port, password });
            } catch (err) {
                console.log('❌ RCON still offline, will retry later.');
                return;
            }

            for (const cmd of pendingCommands) {
                try {
                    await rcon.send(cmd.command);
                    cmd.status = 'completed';
                    cmd.lastAttemptAt = new Date();
                    await cmd.save();
                    console.log(`✅ Queued command executed: ${cmd.command}`);
                } catch (e) {
                    cmd.retries += 1;
                    cmd.lastAttemptAt = new Date();
                    if (cmd.retries > 50) {
                        cmd.status = 'failed';
                    }
                    await cmd.save();
                }
            }
            await rcon.end();
        } catch (error) {
            console.error('Error in RCON retry cron:', error.message);
        }
    });

    // 2. Abandoned Cart Recovery (Runs every hour)
    cron.schedule('0 * * * *', async () => {
        try {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);

            // Find carts updated between 24 and 25 hours ago to send email exactly once
            const abandonedCarts = await Cart.find({
                updatedAt: { $lt: twentyFourHoursAgo, $gt: twentyFiveHoursAgo },
                'items.0': { $exists: true } // Has at least one item
            }).populate('userId');

            if (abandonedCarts.length === 0) return;
            console.log(`🛒 Found ${abandonedCarts.length} abandoned carts. Sending recovery emails...`);

            // Normally you would import sendAbandonedCartEmail from email.js
            // For now, we'll just log it. In production, connect this to your email service.
            for (const cart of abandonedCarts) {
                if (cart.userId && cart.userId.email) {
                    console.log(`📧 Sending abandoned cart email to ${cart.userId.email}`);
                    // await sendAbandonedCartEmail(cart.userId.email, cart.items);
                }
            }
        } catch (error) {
            console.error('Error in abandoned cart cron:', error.message);
        }
    });
}

module.exports = { initCronJobs };
