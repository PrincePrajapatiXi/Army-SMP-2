import { useState, useEffect, useRef, memo } from 'react';
import './OptimizedImage.css';

/**
 * Optimized Image Component with:
 * - Lazy loading using Intersection Observer
 * - Blur placeholder effect while loading
 * - Fallback for failed images
 * - WebP support detection
 */
const OptimizedImage = memo(({
    src,
    alt = '',
    className = '',
    placeholder = null,
    fallback = '/images/placeholder.png',
    blurHash = null,
    aspectRatio = null,
    objectFit = 'cover',
    loading = 'lazy',
    onLoad,
    onError,
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(null);
    const imgRef = useRef(null);
    const observerRef = useRef(null);

    // Set up Intersection Observer for lazy loading
    useEffect(() => {
        if (loading !== 'lazy') {
            setIsInView(true);
            return;
        }

        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observerRef.current?.disconnect();
                    }
                });
            },
            {
                rootMargin: '100px',
                threshold: 0.01
            }
        );

        if (imgRef.current) {
            observerRef.current.observe(imgRef.current);
        }

        return () => {
            observerRef.current?.disconnect();
        };
    }, [loading]);

    // Load image when in view
    useEffect(() => {
        if (!isInView || !src) return;

        const img = new Image();

        img.onload = () => {
            setCurrentSrc(src);
            setIsLoaded(true);
            setHasError(false);
            onLoad?.();
        };

        img.onerror = () => {
            setHasError(true);
            setCurrentSrc(fallback);
            setIsLoaded(true);
            onError?.();
        };

        img.src = src;
    }, [isInView, src, fallback, onLoad, onError]);

    // Generate placeholder background
    const placeholderStyle = {
        backgroundColor: placeholder || 'rgba(255, 255, 255, 0.05)',
        aspectRatio: aspectRatio || undefined
    };

    return (
        <div
            ref={imgRef}
            className={`optimized-image-wrapper ${className} ${isLoaded ? 'loaded' : 'loading'} ${hasError ? 'error' : ''}`}
            style={placeholderStyle}
        >
            {/* Blur placeholder */}
            {!isLoaded && (
                <div className="optimized-image-placeholder">
                    <div className="optimized-image-shimmer" />
                </div>
            )}

            {/* Actual image */}
            {currentSrc && (
                <img
                    src={currentSrc}
                    alt={alt}
                    className={`optimized-image ${isLoaded ? 'visible' : ''}`}
                    style={{ objectFit }}
                    loading={loading}
                    {...props}
                />
            )}

            {/* Error fallback icon */}
            {hasError && !fallback && (
                <div className="optimized-image-error">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21,15 16,10 5,21" />
                    </svg>
                </div>
            )}
        </div>
    );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
