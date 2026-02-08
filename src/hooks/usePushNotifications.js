import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://army-smp-2.onrender.com/api';

/**
 * Custom hook for push notification management
 */
export const usePushNotifications = () => {
    const { token, isAuthenticated } = useAuth();
    const [permission, setPermission] = useState('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Check if push notifications are supported
    useEffect(() => {
        const supported = 'serviceWorker' in navigator &&
            'PushManager' in window &&
            'Notification' in window;
        setIsSupported(supported);

        if (supported) {
            setPermission(Notification.permission);
        }
    }, []);

    // Check subscription status when authenticated
    useEffect(() => {
        const checkSubscription = async () => {
            if (!isSupported || !isAuthenticated) return;

            try {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
            } catch (err) {
                console.error('Error checking subscription:', err);
            }
        };

        checkSubscription();
    }, [isSupported, isAuthenticated]);

    /**
     * Request notification permission and subscribe
     */
    const subscribe = useCallback(async () => {
        if (!isSupported || !token) {
            setError('Push notifications not supported or not logged in');
            return false;
        }

        setLoading(true);
        setError(null);

        try {
            // Request permission
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult !== 'granted') {
                setError('Notification permission denied');
                return false;
            }

            // Get VAPID public key
            const vapidRes = await fetch(`${API_URL}/notifications/vapid-key`);
            const vapidData = await vapidRes.json();

            if (!vapidData.success) {
                setError('Push notifications not configured on server');
                return false;
            }

            // Convert VAPID key
            const vapidPublicKey = urlBase64ToUint8Array(vapidData.publicKey);

            // Subscribe to push manager
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: vapidPublicKey
            });

            // Send subscription to server
            const response = await fetch(`${API_URL}/notifications/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ subscription })
            });

            const data = await response.json();

            if (data.success) {
                setIsSubscribed(true);
                return true;
            } else {
                setError(data.error || 'Failed to subscribe');
                return false;
            }
        } catch (err) {
            console.error('Subscribe error:', err);
            setError(err.message || 'Failed to subscribe');
            return false;
        } finally {
            setLoading(false);
        }
    }, [isSupported, token]);

    /**
     * Unsubscribe from push notifications
     */
    const unsubscribe = useCallback(async () => {
        if (!isSupported || !token) return false;

        setLoading(true);
        setError(null);

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                await subscription.unsubscribe();
            }

            // Notify server
            await fetch(`${API_URL}/notifications/unsubscribe`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setIsSubscribed(false);
            return true;
        } catch (err) {
            console.error('Unsubscribe error:', err);
            setError(err.message || 'Failed to unsubscribe');
            return false;
        } finally {
            setLoading(false);
        }
    }, [isSupported, token]);

    /**
     * Send a test notification
     */
    const sendTest = useCallback(async () => {
        if (!token) return false;

        try {
            const response = await fetch(`${API_URL}/notifications/test`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            return data.success;
        } catch (err) {
            console.error('Test notification error:', err);
            return false;
        }
    }, [token]);

    return {
        permission,
        isSubscribed,
        isSupported,
        loading,
        error,
        subscribe,
        unsubscribe,
        sendTest
    };
};

/**
 * Convert a base64 URL-encoded string to Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default usePushNotifications;

