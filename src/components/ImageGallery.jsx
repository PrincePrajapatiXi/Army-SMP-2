import { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { triggerHaptic } from '../hooks/useHaptics';
import './ImageGallery.css';

/**
 * ImageGallery - Swipeable image gallery for mobile
 * Supports touch gestures and dot indicators
 */
const ImageGallery = ({ images = [], alt = 'Product image' }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const containerRef = useRef(null);

    // Minimum swipe distance to trigger slide change
    const minSwipeDistance = 50;

    // If only one image or no images, show single image
    if (!images || images.length === 0) {
        return (
            <div className="image-gallery single">
                <div className="gallery-placeholder">No image available</div>
            </div>
        );
    }

    if (images.length === 1) {
        return (
            <div className="image-gallery single">
                <img src={images[0]} alt={alt} className="gallery-image" />
            </div>
        );
    }

    const goToSlide = (index) => {
        triggerHaptic('selection');
        setCurrentIndex(index);
    };

    const goToPrevious = () => {
        triggerHaptic('light');
        setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const goToNext = () => {
        triggerHaptic('light');
        setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
        setIsDragging(true);
    };

    const onTouchMove = (e) => {
        if (!touchStart) return;
        const currentTouch = e.targetTouches[0].clientX;
        setTouchEnd(currentTouch);

        // Calculate drag offset for visual feedback
        const offset = currentTouch - touchStart;
        setDragOffset(offset * 0.3); // Reduced sensitivity
    };

    const onTouchEnd = () => {
        setIsDragging(false);
        setDragOffset(0);

        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            goToNext();
        } else if (isRightSwipe) {
            goToPrevious();
        }

        setTouchStart(null);
        setTouchEnd(null);
    };

    return (
        <div className="image-gallery" ref={containerRef}>
            {/* Main Image Container */}
            <div
                className="gallery-track"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                style={{
                    transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out'
                }}
            >
                {images.map((image, index) => (
                    <div key={index} className="gallery-slide">
                        <img
                            src={image}
                            alt={`${alt} ${index + 1}`}
                            className="gallery-image"
                            draggable="false"
                        />
                    </div>
                ))}
            </div>

            {/* Navigation Arrows (visible on hover/touch) */}
            <button
                className="gallery-nav gallery-nav-prev"
                onClick={goToPrevious}
                aria-label="Previous image"
            >
                <ChevronLeft size={24} />
            </button>
            <button
                className="gallery-nav gallery-nav-next"
                onClick={goToNext}
                aria-label="Next image"
            >
                <ChevronRight size={24} />
            </button>

            {/* Dot Indicators */}
            <div className="gallery-dots">
                {images.map((_, index) => (
                    <button
                        key={index}
                        className={`gallery-dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => goToSlide(index)}
                        aria-label={`Go to image ${index + 1}`}
                    />
                ))}
            </div>

            {/* Image Counter */}
            <div className="gallery-counter">
                {currentIndex + 1} / {images.length}
            </div>
        </div>
    );
};

export default ImageGallery;

