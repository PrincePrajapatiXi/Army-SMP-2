import { useEffect, useCallback } from 'react';

/**
 * Custom hook for prefetching routes/resources
 * Preloads lazy-loaded components when user hovers over links
 * @param {Function} importFn - Dynamic import function
 * @param {boolean} enable - Whether to enable prefetching
 */
export const usePrefetch = (importFn, enable = true) => {
    const prefetch = useCallback(() => {
        if (enable && importFn) {
            importFn().catch(() => {
                // Silently fail - prefetch is just optimization
            });
        }
    }, [importFn, enable]);

    return prefetch;
};

/**
 * Prefetch multiple routes
 * @param {Object} routes - Object of route names to import functions
 */
export const prefetchRoutes = (routes) => {
    Object.values(routes).forEach(importFn => {
        if (typeof importFn === 'function') {
            importFn().catch(() => { });
        }
    });
};

/**
 * Hook to prefetch on link hover
 * @param {Function} importFn - Dynamic import function
 * @returns {Object} - Event handlers to spread on link
 */
export const usePrefetchOnHover = (importFn) => {
    const prefetch = usePrefetch(importFn);

    return {
        onMouseEnter: prefetch,
        onFocus: prefetch
    };
};

export default usePrefetch;

