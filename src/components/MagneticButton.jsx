import React, { useRef, useState, useEffect } from 'react';
import './MagneticButton.css';

/**
 * MagneticButton - A button that follows cursor movement
 * Creates a magnetic pull effect when mouse hovers near the button
 */
const MagneticButton = ({
    children,
    className = '',
    strength = 0.5,
    radius = 100,
    as: Component = 'button',
    ...props
}) => {
    const buttonRef = useRef(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    // Check if device supports hover (not touch-only device)
    const [supportsHover, setSupportsHover] = useState(true);

    useEffect(() => {
        // Check for hover capability
        const mediaQuery = window.matchMedia('(hover: hover)');
        setSupportsHover(mediaQuery.matches);

        const handleChange = (e) => setSupportsHover(e.matches);
        mediaQuery.addEventListener('change', handleChange);

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const handleMouseMove = (e) => {
        if (!buttonRef.current || !supportsHover) return;

        const rect = buttonRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const distanceX = e.clientX - centerX;
        const distanceY = e.clientY - centerY;

        // Calculate distance from center
        const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

        if (distance < radius) {
            // Apply magnetic effect
            const pullStrength = (radius - distance) / radius;
            setPosition({
                x: distanceX * strength * pullStrength,
                y: distanceY * strength * pullStrength
            });
            setIsHovering(true);
        } else {
            resetPosition();
        }
    };

    const handleMouseLeave = () => {
        resetPosition();
    };

    const resetPosition = () => {
        setPosition({ x: 0, y: 0 });
        setIsHovering(false);
    };

    // Don't apply magnetic effect on touch devices
    if (!supportsHover) {
        return (
            <Component className={className} {...props}>
                {children}
            </Component>
        );
    }

    return (
        <Component
            ref={buttonRef}
            className={`magnetic-button ${className} ${isHovering ? 'magnetic-active' : ''}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
                transition: isHovering
                    ? 'transform 0.15s ease-out'
                    : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            {...props}
        >
            <span
                className="magnetic-content"
                style={{
                    transform: `translate(${position.x * 0.3}px, ${position.y * 0.3}px)`
                }}
            >
                {children}
            </span>
        </Component>
    );
};

export default MagneticButton;
