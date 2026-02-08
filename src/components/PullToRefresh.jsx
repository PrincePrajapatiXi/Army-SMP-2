import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import './PullToRefresh.css';

/**
 * Pull to Refresh Component for Mobile
 * Wraps content and enables pull-down gesture to refresh
 */
const PullToRefresh = ({
    children,
    onRefresh,
    threshold = 80,
    disabled = false
}) => {
    const [pulling, setPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const [startY, setStartY] = useState(0);

    const handleTouchStart = useCallback((e) => {
        if (disabled || refreshing) return;

        // Only enable pull when at top of page
        if (window.scrollY === 0) {
            setStartY(e.touches[0].clientY);
            setPulling(true);
        }
    }, [disabled, refreshing]);

    const handleTouchMove = useCallback((e) => {
        if (!pulling || disabled || refreshing) return;

        const currentY = e.touches[0].clientY;
        const distance = Math.max(0, currentY - startY);

        // Apply resistance to pull
        const resistedDistance = Math.min(distance * 0.5, threshold * 1.5);
        setPullDistance(resistedDistance);

        // Prevent default scroll when pulling
        if (resistedDistance > 0) {
            e.preventDefault();
        }
    }, [pulling, startY, threshold, disabled, refreshing]);

    const handleTouchEnd = useCallback(async () => {
        if (!pulling || disabled) return;

        setPulling(false);

        if (pullDistance >= threshold && onRefresh) {
            setRefreshing(true);
            try {
                await onRefresh();
            } finally {
                setRefreshing(false);
            }
        }

        setPullDistance(0);
    }, [pulling, pullDistance, threshold, onRefresh, disabled]);

    useEffect(() => {
        const options = { passive: false };

        document.addEventListener('touchstart', handleTouchStart, options);
        document.addEventListener('touchmove', handleTouchMove, options);
        document.addEventListener('touchend', handleTouchEnd, options);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

    const progress = Math.min(pullDistance / threshold, 1);
    const shouldTrigger = pullDistance >= threshold;

    return (
        <div className="pull-to-refresh-container">
            {/* Pull indicator */}
            <div
                className={`pull-indicator ${pulling ? 'pulling' : ''} ${refreshing ? 'refreshing' : ''} ${shouldTrigger ? 'ready' : ''}`}
                style={{
                    transform: `translateY(${Math.min(pullDistance, threshold)}px) scale(${0.5 + progress * 0.5})`,
                    opacity: progress
                }}
            >
                <RefreshCw
                    size={24}
                    className="pull-icon"
                    style={{
                        transform: `rotate(${pullDistance * 3}deg)`
                    }}
                />
                <span className="pull-text">
                    {refreshing ? 'Refreshing...' : shouldTrigger ? 'Release to refresh' : 'Pull to refresh'}
                </span>
            </div>

            {/* Content */}
            <div
                className="pull-content"
                style={{
                    transform: pulling ? `translateY(${pullDistance * 0.3}px)` : 'none',
                    transition: pulling ? 'none' : 'transform 0.3s ease'
                }}
            >
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;

