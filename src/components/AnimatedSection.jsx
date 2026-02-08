import React from 'react';
import useScrollReveal from '../hooks/useScrollReveal';
import './AnimatedSection.css';

/**
 * Wrapper component for scroll-triggered animations
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child elements to animate
 * @param {string} props.animation - Animation type: 'fadeUp', 'fadeDown', 'fadeLeft', 'fadeRight', 'scaleIn', 'blurIn'
 * @param {number} props.delay - Animation delay in seconds
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 * @param {number} props.threshold - Visibility threshold (0-1)
 * @param {string} props.as - HTML element to render (default: 'div')
 */
const AnimatedSection = ({
    children,
    animation = 'fadeUp',
    delay = 0,
    className = '',
    style = {},
    threshold = 0.1,
    as: Component = 'div',
    ...props
}) => {
    const { ref, isVisible } = useScrollReveal({ threshold });

    const animationClass = {
        fadeUp: 'fade-up',
        fadeDown: 'fade-down',
        fadeLeft: 'fade-left',
        fadeRight: 'fade-right',
        scaleIn: 'scale-in',
        blurIn: 'blur-in'
    }[animation] || 'fade-up';

    return (
        <Component
            ref={ref}
            className={`animated-section ${animationClass} ${isVisible ? 'visible' : ''} ${className}`}
            style={{
                ...style,
                transitionDelay: `${delay}s`
            }}
            {...props}
        >
            {children}
        </Component>
    );
};

/**
 * Component for staggered grid animations
 */
export const AnimatedGrid = ({
    children,
    className = '',
    staggerDelay = 0.05,
    animation = 'fadeUp',
    ...props
}) => {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.05 });

    return (
        <div
            ref={ref}
            className={`animated-grid ${isVisible ? 'visible' : ''} ${className}`}
            {...props}
        >
            {React.Children.map(children, (child, index) => {
                if (!React.isValidElement(child)) return child;

                return React.cloneElement(child, {
                    className: `${child.props.className || ''} scroll-reveal ${animation === 'fadeUp' ? 'fade-up' : ''} ${isVisible ? 'visible' : ''}`,
                    style: {
                        ...child.props.style,
                        transitionDelay: `${index * staggerDelay}s`
                    }
                });
            })}
        </div>
    );
};

export default AnimatedSection;

