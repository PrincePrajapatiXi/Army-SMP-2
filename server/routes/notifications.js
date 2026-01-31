const express = require('express');
const router = express.Router();
const {
    saveSubscription,
    removeSubscription,
    sendPushNotification,
    broadcastNotification,
    NotificationTemplates,
    VAPID_PUBLIC_KEY
} = require('../services/pushNotifications');
const { requireAuth, requireAdminAuth } = require('../middleware/authMiddleware');

// GET /api/notifications/vapid-key - Get VAPID public key for client
router.get('/vapid-key', (req, res) => {
    if (!VAPID_PUBLIC_KEY) {
        return res.status(503).json({
            success: false,
            error: 'Push notifications not configured'
        });
    }

    res.json({
        success: true,
        publicKey: VAPID_PUBLIC_KEY
    });
});

// POST /api/notifications/subscribe - Subscribe to push notifications
router.post('/subscribe', requireAuth, (req, res) => {
    try {
        const { subscription } = req.body;

        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({
                success: false,
                error: 'Invalid subscription object'
            });
        }

        saveSubscription(req.userId, subscription);

        res.json({
            success: true,
            message: 'Successfully subscribed to push notifications'
        });
    } catch (error) {
        console.error('Subscribe error:', error);
        res.status(500).json({ success: false, error: 'Failed to subscribe' });
    }
});

// DELETE /api/notifications/unsubscribe - Unsubscribe from push notifications
router.delete('/unsubscribe', requireAuth, (req, res) => {
    try {
        removeSubscription(req.userId);

        res.json({
            success: true,
            message: 'Successfully unsubscribed from push notifications'
        });
    } catch (error) {
        console.error('Unsubscribe error:', error);
        res.status(500).json({ success: false, error: 'Failed to unsubscribe' });
    }
});

// POST /api/notifications/test - Send test notification (for development)
router.post('/test', requireAuth, async (req, res) => {
    try {
        const success = await sendPushNotification(req.userId, {
            title: 'Test Notification 🔔',
            body: 'If you see this, push notifications are working!',
            url: '/'
        });

        res.json({
            success,
            message: success ? 'Test notification sent' : 'No subscription found'
        });
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ success: false, error: 'Failed to send test' });
    }
});

// POST /api/notifications/send - Admin: Send notification to specific user
router.post('/send', requireAdminAuth, async (req, res) => {
    try {
        const { userId, title, body, url } = req.body;

        if (!userId || !title || !body) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, title, body'
            });
        }

        const success = await sendPushNotification(userId, { title, body, url });

        res.json({
            success,
            message: success ? 'Notification sent' : 'User not subscribed'
        });
    } catch (error) {
        console.error('Send notification error:', error);
        res.status(500).json({ success: false, error: 'Failed to send notification' });
    }
});

// POST /api/notifications/broadcast - Admin: Send notification to all users
router.post('/broadcast', requireAdminAuth, async (req, res) => {
    try {
        const { title, body, url, template, templateData } = req.body;

        let payload;

        // Use template if specified
        if (template && NotificationTemplates[template]) {
            payload = NotificationTemplates[template](templateData);
        } else if (title && body) {
            payload = { title, body, url };
        } else {
            return res.status(400).json({
                success: false,
                error: 'Provide title & body, or a template name'
            });
        }

        const successCount = await broadcastNotification(payload);

        res.json({
            success: true,
            sentCount: successCount,
            message: `Notification broadcast to ${successCount} users`
        });
    } catch (error) {
        console.error('Broadcast error:', error);
        res.status(500).json({ success: false, error: 'Failed to broadcast' });
    }
});

module.exports = router;
