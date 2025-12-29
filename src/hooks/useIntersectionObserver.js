import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for Intersection Observer
 * Useful for lazy loading, infinite scroll, animations on scroll
 * @param {Object} options - IntersectionObserver options
 * @param {number} options.threshold - Visibility threshold (0-1)
 * @param {string} options.root - Root element selector
 * @param {string} options.rootMargin - Root margin
 * @param {boolean} options.triggerOnce - Only trigger once when visible
 * @returns {Array} - [ref, isIntersecting, entry]
 */
export const useIntersectionObserver = (options = {}) => {
    const {
        threshold = 0,
        root = null,
        rootMargin = '0px',
        triggerOnce = false
    } = options;

    const [isIntersecting, setIsIntersecting] = useState(false);
    const [entry, setEntry] = useState(null);
    const elementRef = useRef(null);
    const hasTriggered = useRef(false);

    const updateEntry = useCallback(([entry]) => {
        setEntry(entry);

        if (triggerOnce && hasTriggered.current) return;

        setIsIntersecting(entry.isIntersecting);

        if (entry.isIntersecting && triggerOnce) {
            hasTriggered.current = true;
        }
    }, [triggerOnce]);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(updateEntry, {
            threshold,
            root: root ? document.querySelector(root) : null,
            rootMargin
        });

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [threshold, root, rootMargin, updateEntry]);

    return [elementRef, isIntersecting, entry];
};

export default useIntersectionObserver;
