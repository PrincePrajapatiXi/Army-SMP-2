import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share } from 'lucide-react';
import { triggerHaptic } from '../hooks/useHaptics';
import './PWAInstallPrompt.css';

/**
 * PWAInstallPrompt - Shows install banner for PWA
 * Handles both Android (beforeinstallprompt) and iOS (manual instructions)
 */
const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);

    useEffect(() => {
        // Detect iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIOSDevice);

        // Check if already installed (standalone mode)
        const standalone = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;
        setIsInStandaloneMode(standalone);

        if (standalone) {
            setIsInstalled(true);
            return;
        }

        // Check if user dismissed before
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10);
            // Show again after 7 days
            if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
                return;
            }
        }

        // For iOS - show custom instructions prompt
        if (isIOSDevice) {
            setTimeout(() => setShowPrompt(true), 3000);
            return;
        }

        // For Android/Chrome - listen for install prompt
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setTimeout(() => setShowPrompt(true), 3000);
        };

        // Listen for successful install
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        triggerHaptic('medium');
        deferredPrompt.prompt();

        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
            triggerHaptic('success');
        }

        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        triggerHaptic('light');
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    // Don't show if already installed or prompt not ready
    if (isInstalled || isInStandaloneMode || !showPrompt) {
        return null;
    }

    // iOS - Show manual instructions
    if (isIOS) {
        return (
            <div className="pwa-install-prompt pwa-ios-prompt">
                <div className="pwa-prompt-content">
                    <div className="pwa-icon">
                        <Smartphone size={28} />
                    </div>
                    <div className="pwa-text">
                        <h4>Install Army SMP 2</h4>
                        <p>Tap <Share size={16} className="inline-icon" /> then "Add to Home Screen"</p>
                    </div>
                </div>
                <div className="pwa-actions">
                    <button className="pwa-btn pwa-dismiss-btn" onClick={handleDismiss}>
                        <X size={18} />
                    </button>
                </div>
            </div>
        );
    }

    // Android/Chrome - Normal install button
    if (!deferredPrompt) {
        return null;
    }

    return (
        <div className="pwa-install-prompt">
            <div className="pwa-prompt-content">
                <div className="pwa-icon">
                    <Smartphone size={28} />
                </div>
                <div className="pwa-text">
                    <h4>Install Army SMP 2</h4>
                    <p>Add to home screen for faster access</p>
                </div>
            </div>
            <div className="pwa-actions">
                <button className="pwa-btn pwa-install-btn" onClick={handleInstall}>
                    <Download size={18} />
                    Install
                </button>
                <button className="pwa-btn pwa-dismiss-btn" onClick={handleDismiss}>
                    <X size={18} />
                </button>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;


