import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import './BackToTop.css';

/**
 * Back to Top Button Component
 * Floating button that appears when user scrolls down
 * Smoothly scrolls to top when clicked
 */
const BackToTop = ({ showAfter = 300 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            // Show button after scrolling down
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            setIsVisible(scrollTop > showAfter);

            // Calculate scroll progress
            const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const progress = (scrollTop / docHeight) * 100;
            setScrollProgress(Math.min(progress, 100));
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [showAfter]);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <button
            className={`back-to-top ${isVisible ? 'visible' : ''}`}
            onClick={scrollToTop}
            aria-label="Back to top"
            title="Back to top"
        >
            {/* Progress ring */}
            <svg className="progress-ring" viewBox="0 0 40 40">
                <circle
                    className="progress-ring-bg"
                    cx="20"
                    cy="20"
                    r="18"
                    fill="none"
                    strokeWidth="2"
                />
                <circle
                    className="progress-ring-fill"
                    cx="20"
                    cy="20"
                    r="18"
                    fill="none"
                    strokeWidth="2"
                    strokeDasharray={`${2 * Math.PI * 18}`}
                    strokeDashoffset={`${2 * Math.PI * 18 * (1 - scrollProgress / 100)}`}
                />
            </svg>
            <ArrowUp size={20} className="back-to-top-icon" />
        </button>
    );
};

export default BackToTop;
