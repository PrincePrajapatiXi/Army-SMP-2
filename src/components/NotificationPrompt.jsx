import React, { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';
import usePushNotifications from '../hooks/usePushNotifications';
import './NotificationPrompt.css';

/**
 * Notification prompt component that appears to ask users to enable push notifications
 */
const NotificationPrompt = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const {
        permission,
        isSubscribed,
        isSupported,
        loading,
        subscribe
    } = usePushNotifications();

    useEffect(() => {
        // Check if we should show the prompt
        const shouldShow = () => {
            // Don't show if already subscribed or not supported
            if (isSubscribed || !isSupported) return false;

            // Don't show if permission was denied
            if (permission === 'denied') return false;

            // Check if user dismissed recently (24 hours)
            const lastDismissed = localStorage.getItem('notif_prompt_dismissed');
            if (lastDismissed) {
                const dismissedTime = parseInt(lastDismissed, 10);
                if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
                    return false;
                }
            }

            return true;
        };

        // Delay showing prompt by 30 seconds
        const timer = setTimeout(() => {
            if (shouldShow()) {
                setIsVisible(true);
            }
        }, 30000);

        return () => clearTimeout(timer);
    }, [isSubscribed, isSupported, permission]);

    const handleEnable = async () => {
        const success = await subscribe();
        if (success) {
            setIsVisible(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        setDismissed(true);
        localStorage.setItem('notif_prompt_dismissed', Date.now().toString());
    };

    if (!isVisible || dismissed) return null;

    return (
        <div className="notification-prompt">
            <button className="close-btn" onClick={handleDismiss}>
                <X size={18} />
            </button>

            <div className="prompt-icon">
                <Bell size={24} />
            </div>

            <div className="prompt-content">
                <h4>Stay Updated!</h4>
                <p>Get notified about order updates, new products, and exclusive deals.</p>
            </div>

            <div className="prompt-actions">
                <button
                    className="btn btn-primary enable-btn"
                    onClick={handleEnable}
                    disabled={loading}
                >
                    {loading ? 'Enabling...' : 'Enable Notifications'}
                </button>
                <button
                    className="dismiss-btn"
                    onClick={handleDismiss}
                >
                    Maybe Later
                </button>
            </div>
        </div>
    );
};

export default NotificationPrompt;
