import React, { useState, useRef } from 'react';
import './RippleButton.css';

const RippleButton = ({
    children,
    className = '',
    variant = 'primary',
    loading = false,
    disabled = false,
    onClick,
    ...props
}) => {
    const [ripples, setRipples] = useState([]);
    const buttonRef = useRef(null);

    const handleClick = (e) => {
        if (disabled || loading) return;

        // Create ripple
        const button = buttonRef.current;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        const newRipple = {
            x,
            y,
            size,
            id: Date.now()
        };

        setRipples(prev => [...prev, newRipple]);

        // Remove ripple after animation
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 600);

        // Call original onClick
        if (onClick) onClick(e);
    };

    const variantClass = variant === 'outline' ? 'ripple-btn-outline' : 'ripple-btn-primary';

    return (
        <button
            ref={buttonRef}
            className={`ripple-btn ${variantClass} ${className} ${loading ? 'loading' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={handleClick}
            disabled={disabled || loading}
            {...props}
        >
            {ripples.map(ripple => (
                <span
                    key={ripple.id}
                    className="ripple"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: ripple.size,
                        height: ripple.size
                    }}
                />
            ))}

            {loading && (
                <span className="btn-spinner">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <circle cx="12" cy="12" r="10" fill="none" strokeWidth="3" stroke="currentColor" strokeDasharray="31.4" strokeLinecap="round">
                            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                        </circle>
                    </svg>
                </span>
            )}

            <span className={`btn-content ${loading ? 'hidden' : ''}`}>
                {children}
            </span>
        </button>
    );
};

export default RippleButton;
