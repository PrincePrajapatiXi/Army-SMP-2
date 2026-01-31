const webpush = require('web-push');

// Configure VAPID keys for web push
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@armysmp2.com';

// Initialize web-push only if keys are configured
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// In-memory subscription storage (use database in production)
const subscriptions = new Map();

/**
 * Save a push subscription
 * @param {string} userId - User ID
 * @param {object} subscription - Push subscription object
 */
const saveSubscription = (userId, subscription) => {
    subscriptions.set(userId, subscription);
    console.log(`📱 Push subscription saved for user: ${userId}`);
};

/**
 * Remove a push subscription
 * @param {string} userId - User ID
 */
const removeSubscription = (userId) => {
    subscriptions.delete(userId);
    console.log(`📱 Push subscription removed for user: ${userId}`);
};

/**
 * Get a user's push subscription
 * @param {string} userId - User ID
 * @returns {object|null} Subscription object or null
 */
const getSubscription = (userId) => {
    return subscriptions.get(userId) || null;
};

/**
 * Send a push notification to a specific user
 * @param {string} userId - User ID
 * @param {object} payload - Notification payload
 * @returns {Promise<boolean>} Success status
 */
const sendPushNotification = async (userId, payload) => {
    const subscription = getSubscription(userId);

    if (!subscription) {
        console.log(`No subscription found for user: ${userId}`);
        return false;
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.log('VAPID keys not configured, skipping push notification');
        return false;
    }

    try {
        const notificationPayload = JSON.stringify({
            title: payload.title || 'Army SMP 2',
            body: payload.body || 'You have a new notification',
            icon: payload.icon || '/android-chrome-192x192.png',
            badge: payload.badge || '/favicon-32x32.png',
            url: payload.url || '/',
            tag: payload.tag || 'default',
            actions: payload.actions || []
        });

        await webpush.sendNotification(subscription, notificationPayload);
        console.log(`✅ Push notification sent to user: ${userId}`);
        return true;
    } catch (error) {
        console.error(`❌ Failed to send push notification to ${userId}:`, error);

        // Remove invalid subscription
        if (error.statusCode === 410) {
            removeSubscription(userId);
        }

        return false;
    }
};

/**
 * Send push notification to all subscribed users
 * @param {object} payload - Notification payload
 * @returns {Promise<number>} Number of successful sends
 */
const broadcastNotification = async (payload) => {
    let successCount = 0;

    for (const [userId] of subscriptions) {
        const success = await sendPushNotification(userId, payload);
        if (success) successCount++;
    }

    console.log(`📢 Broadcast sent to ${successCount}/${subscriptions.size} users`);
    return successCount;
};

// Pre-defined notification templates
const NotificationTemplates = {
    orderConfirmed: (orderNumber) => ({
        title: 'Order Confirmed! 🎉',
        body: `Your order #${orderNumber} has been confirmed and is being processed.`,
        url: '/orders',
        tag: 'order-update'
    }),

    orderDelivered: (orderNumber) => ({
        title: 'Order Delivered! ✅',
        body: `Your order #${orderNumber} has been delivered. Enjoy your items!`,
        url: '/orders',
        tag: 'order-update'
    }),

    newProduct: (productName) => ({
        title: 'New Product Available! 🆕',
        body: `Check out our new product: ${productName}`,
        url: '/store',
        tag: 'new-product'
    }),

    saleAlert: (discount) => ({
        title: 'Sale Alert! 🔥',
        body: `Get ${discount}% off on selected items. Limited time offer!`,
        url: '/store',
        tag: 'sale'
    }),

    referralReward: (amount) => ({
        title: 'Referral Reward! 💰',
        body: `You earned ₹${amount} from a referral! Check your balance.`,
        url: '/profile',
        tag: 'referral'
    })
};

module.exports = {
    saveSubscription,
    removeSubscription,
    getSubscription,
    sendPushNotification,
    broadcastNotification,
    NotificationTemplates,
    VAPID_PUBLIC_KEY
};
