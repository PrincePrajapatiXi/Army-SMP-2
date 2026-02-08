import { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import './NetworkStatus.css';

const NetworkStatus = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showStatus, setShowStatus] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            if (wasOffline) {
                setShowStatus(true);
                setTimeout(() => setShowStatus(false), 3000);
            }
            setWasOffline(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setWasOffline(true);
            setShowStatus(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [wasOffline]);

    if (!showStatus && isOnline) return null;

    return (
        <div className={`network-status ${isOnline ? 'online' : 'offline'} ${showStatus ? 'show' : ''}`}>
            <div className="network-status-content">
                {isOnline ? (
                    <>
                        <Wifi size={18} />
                        <span>You're back online!</span>
                    </>
                ) : (
                    <>
                        <WifiOff size={18} />
                        <span>No internet connection</span>
                    </>
                )}
            </div>
        </div>
    );
};

export default NetworkStatus;

