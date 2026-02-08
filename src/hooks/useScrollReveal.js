import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for scroll-based reveal animations using Intersection Observer
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Visibility threshold (0-1)
 * @param {string} options.rootMargin - Root margin for intersection
 * @param {boolean} options.triggerOnce - Whether to trigger only once
 * @returns {Object} - { ref, isVisible }
 */
const useScrollReveal = (options = {}) => {
    const {
        threshold = 0.1,
        rootMargin = '0px 0px -50px 0px',
        triggerOnce = true
    } = options;

    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    const handleIntersection = useCallback((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
            } else if (!triggerOnce) {
                setIsVisible(false);
            }
        });
    }, [triggerOnce]);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(handleIntersection, {
            threshold,
            rootMargin
        });

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
            observer.disconnect();
        };
    }, [threshold, rootMargin, handleIntersection]);

    return { ref, isVisible };
};

/**
 * Hook for staggered reveal animations on multiple elements
 * @param {Object} options - Configuration options
 * @returns {Object} - { containerRef, isVisible }
 */
export const useStaggeredReveal = (options = {}) => {
    const { threshold = 0.1, rootMargin = '0px 0px -50px 0px' } = options;

    const containerRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                    }
                });
            },
            { threshold, rootMargin }
        );

        observer.observe(element);

        return () => {
            if (element) {
                observer.unobserve(element);
            }
            observer.disconnect();
        };
    }, [threshold, rootMargin]);

    return { containerRef, isVisible };
};

export default useScrollReveal;

