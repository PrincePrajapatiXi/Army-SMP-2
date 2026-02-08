import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { triggerHaptic } from './useHaptics';

/**
 * useGestureNavigation - Swipe-back gesture for native app-like feel
 * Swipe from left edge to go back
 */
const useGestureNavigation = (options = {}) => {
    const {
        edgeWidth = 30,        // Width of edge detection zone (px)
        threshold = 0.3,       // % of screen width to trigger navigation
        enabled = true,
        excludePaths = ['/']   // Paths where back gesture is disabled
    } = options;

    const navigate = useNavigate();
    const location = useLocation();
    const touchStartX = useRef(null);
    const touchStartY = useRef(null);
    const isEdgeSwipe = useRef(false);
    const overlayRef = useRef(null);

    // Check if gesture should be enabled on current path
    const isGestureAllowed = useCallback(() => {
        if (!enabled) return false;
        return !excludePaths.includes(location.pathname);
    }, [enabled, excludePaths, location.pathname]);

    // Create visual indicator overlay
    const createOverlay = useCallback(() => {
        if (overlayRef.current) return;

        const overlay = document.createElement('div');
        overlay.className = 'gesture-nav-overlay';
        overlay.style.cssText = `
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            width: 0;
            background: linear-gradient(90deg, rgba(255, 107, 53, 0.3), transparent);
            pointer-events: none;
            z-index: 9999;
            transition: width 0.1s ease-out;
        `;
        document.body.appendChild(overlay);
        overlayRef.current = overlay;
    }, []);

    // Update overlay width during swipe
    const updateOverlay = useCallback((progress) => {
        if (overlayRef.current) {
            overlayRef.current.style.width = `${Math.min(progress * 100, 40)}%`;
        }
    }, []);

    // Remove overlay
    const removeOverlay = useCallback(() => {
        if (overlayRef.current) {
            overlayRef.current.style.width = '0';
            setTimeout(() => {
                overlayRef.current?.remove();
                overlayRef.current = null;
            }, 200);
        }
    }, []);

    const handleTouchStart = useCallback((e) => {
        if (!isGestureAllowed()) return;

        const touch = e.touches[0];
        // Only activate if touch starts near left edge
        if (touch.clientX <= edgeWidth) {
            touchStartX.current = touch.clientX;
            touchStartY.current = touch.clientY;
            isEdgeSwipe.current = true;
            createOverlay();
        }
    }, [edgeWidth, isGestureAllowed, createOverlay]);

    const handleTouchMove = useCallback((e) => {
        if (!isEdgeSwipe.current || !touchStartX.current) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX.current;
        const deltaY = Math.abs(touch.clientY - touchStartY.current);

        // Cancel if vertical scroll is dominant
        if (deltaY > Math.abs(deltaX)) {
            isEdgeSwipe.current = false;
            removeOverlay();
            return;
        }

        // Only process right swipes
        if (deltaX > 0) {
            const progress = deltaX / window.innerWidth;
            updateOverlay(progress);

            // Provide haptic feedback at threshold
            if (progress >= threshold && !window.__gestureHapticFired) {
                triggerHaptic('light');
                window.__gestureHapticFired = true;
            }
        }
    }, [threshold, updateOverlay, removeOverlay]);

    const handleTouchEnd = useCallback((e) => {
        if (!isEdgeSwipe.current || !touchStartX.current) {
            removeOverlay();
            return;
        }

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX.current;
        const progress = deltaX / window.innerWidth;

        if (progress >= threshold) {
            triggerHaptic('medium');
            navigate(-1);
        }

        // Reset
        touchStartX.current = null;
        touchStartY.current = null;
        isEdgeSwipe.current = false;
        window.__gestureHapticFired = false;
        removeOverlay();
    }, [threshold, navigate, removeOverlay]);

    useEffect(() => {
        const options = { passive: true };

        document.addEventListener('touchstart', handleTouchStart, options);
        document.addEventListener('touchmove', handleTouchMove, options);
        document.addEventListener('touchend', handleTouchEnd, options);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
            removeOverlay();
        };
    }, [handleTouchStart, handleTouchMove, handleTouchEnd, removeOverlay]);

    return { isGestureAllowed: isGestureAllowed() };
};

export default useGestureNavigation;

