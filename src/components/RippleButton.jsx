import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import './RippleButton.css';

const RippleButton = ({
    children,
    className = '',
    variant = 'primary',
    loading = false,
    disabled = false,
    success = false,
    error = false,
    onClick,
    ...props
}) => {
    const [ripples, setRipples] = useState([]);
    const [internalState, setInternalState] = useState('idle'); // idle, loading, success, error
    const buttonRef = useRef(null);

    // Handle external state changes
    useEffect(() => {
        if (loading) {
            setInternalState('loading');
        } else if (success) {
            setInternalState('success');
            // Auto reset after animation
            const timer = setTimeout(() => setInternalState('idle'), 2000);
            return () => clearTimeout(timer);
        } else if (error) {
            setInternalState('error');
            // Auto reset after animation
            const timer = setTimeout(() => setInternalState('idle'), 2000);
            return () => clearTimeout(timer);
        } else {
            setInternalState('idle');
        }
    }, [loading, success, error]);

    const handleClick = (e) => {
        if (disabled || internalState !== 'idle') return;

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
    const stateClass = internalState !== 'idle' ? `state-${internalState}` : '';

    return (
        <button
            ref={buttonRef}
            className={`ripple-btn ${variantClass} ${className} ${stateClass} ${disabled ? 'disabled' : ''}`}
            onClick={handleClick}
            disabled={disabled || internalState !== 'idle'}
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

            {/* Loading State */}
            {internalState === 'loading' && (
                <span className="btn-spinner">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <circle cx="12" cy="12" r="10" fill="none" strokeWidth="3" stroke="currentColor" strokeDasharray="31.4" strokeLinecap="round">
                            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                        </circle>
                    </svg>
                </span>
            )}

            {/* Success State */}
            {internalState === 'success' && (
                <span className="btn-state-icon success-icon">
                    <Check size={20} strokeWidth={3} />
                </span>
            )}

            {/* Error State */}
            {internalState === 'error' && (
                <span className="btn-state-icon error-icon">
                    <X size={20} strokeWidth={3} />
                </span>
            )}

            <span className={`btn-content ${internalState !== 'idle' ? 'hidden' : ''}`}>
                {children}
            </span>
        </button>
    );
};

export default RippleButton;
