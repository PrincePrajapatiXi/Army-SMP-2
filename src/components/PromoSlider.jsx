import { useState, useEffect, useRef } from 'react';
import './PromoSlider.css';

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://army-smp-2.onrender.com/api';

// Fallback promos if API is empty
const defaultPromos = [
    {
        _id: '1',
        logo: '/images/dragohost-logo.png',
        name: 'DragoHost',
        tagline: 'Premium Minecraft Hosting',
        description: 'DragoHost Offers True 24/7 Premium Servers For its Customers With A Premium Panel And A Guaranteed 100% Uptime Of The Servers You Host With Us!',
        features: ['24/7 Support', '100% Uptime', 'Premium Panel', 'DDoS Protection'],
        link: 'https://discord.gg/D9pGnUM2tH',
        buttonText: 'Join Discord',
        gradient: 'linear-gradient(135deg, #1e3a5f, #0d1b2a)'
    },
    {
        _id: '2',
        logo: '/images/stone.png',
        name: 'YourBrand',
        tagline: 'Your Amazing Service',
        description: 'Want your brand featured here? Contact us for promotional partnerships and reach thousands of Minecraft players!',
        features: ['Wide Reach', 'Gaming Audience', 'Premium Placement', 'Custom Design'],
        link: 'https://discord.gg/EBmGM2jsdt',
        buttonText: 'Contact Us',
        gradient: 'linear-gradient(135deg, #4a1942, #2d132c)'
    },
    {
        _id: '3',
        logo: '/images/Beacon.png',
        name: 'PartnerSpot',
        tagline: 'Advertise With Us',
        description: 'Reach our active Minecraft community! Premium advertising slots available for gaming brands, servers, and services.',
        features: ['High Visibility', 'Active Users', 'Gaming Niche', 'Affordable Rates'],
        link: 'https://discord.gg/EBmGM2jsdt',
        buttonText: 'Get Featured',
        gradient: 'linear-gradient(135deg, #1a4731, #0d2818)'
    }
];

const PromoSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [promos, setPromos] = useState(defaultPromos);
    const sliderRef = useRef(null);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);
    const progressRef = useRef(null);
    const isDragging = useRef(false);

    const SLIDE_DURATION = 6000; // 6 seconds per slide

    // Fetch promotions from API
    useEffect(() => {
        const fetchPromos = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/promotions`);
                const data = await response.json();
                if (data && data.length > 0) {
                    setPromos(data);
                }
                // If API returns empty, keep default promos
            } catch (error) {
                console.log('Using default promotions');
            }
        };
        fetchPromos();
    }, []);

    // Progress bar animation
    useEffect(() => {
        if (!isAutoPlaying || isPaused) {
            return;
        }

        setProgress(0);
        const startTime = Date.now();

        const updateProgress = () => {
            const elapsed = Date.now() - startTime;
            const newProgress = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
            setProgress(newProgress);

            if (newProgress < 100) {
                progressRef.current = requestAnimationFrame(updateProgress);
            } else {
                setCurrentSlide((prev) => (prev + 1) % promos.length);
            }
        };

        progressRef.current = requestAnimationFrame(updateProgress);

        return () => {
            if (progressRef.current) {
                cancelAnimationFrame(progressRef.current);
            }
        };
    }, [currentSlide, isAutoPlaying, isPaused, promos.length]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                prevSlide();
            } else if (e.key === 'ArrowRight') {
                nextSlide();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handle navigation
    const goToSlide = (index) => {
        setCurrentSlide(index);
        setProgress(0);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % promos.length);
        setProgress(0);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + promos.length) % promos.length);
        setProgress(0);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    // Pause on hover
    const handleMouseEnter = () => setIsPaused(true);
    const handleMouseLeave = () => {
        setIsPaused(false);
        isDragging.current = false;
    };

    // Touch/Swipe handlers
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        touchEndX.current = e.touches[0].clientX;
        setIsPaused(true);
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        setIsPaused(false);
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
        // Reset touch values
        touchStartX.current = 0;
        touchEndX.current = 0;
    };

    // Mouse drag handlers - only on slides container, not buttons
    const handleMouseDown = (e) => {
        // Don't start drag if clicking on buttons
        if (e.target.closest('.slider-arrow') || e.target.closest('.dot') || e.target.closest('.promo-cta')) {
            return;
        }
        isDragging.current = true;
        touchStartX.current = e.clientX;
    };

    const handleMouseUp = (e) => {
        if (!isDragging.current) return;

        const diff = touchStartX.current - e.clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
        isDragging.current = false;
        touchStartX.current = 0;
    };

    // Handle button clicks separately to prevent interference
    const handlePrevClick = (e) => {
        e.stopPropagation();
        prevSlide();
    };

    const handleNextClick = (e) => {
        e.stopPropagation();
        nextSlide();
    };

    const handleDotClick = (e, index) => {
        e.stopPropagation();
        goToSlide(index);
    };

    return (
        <section className="promo-slider-section">
            <div className="container">
                <div className="promo-slider-header">
                    <h2>🤝 Our Partners & Sponsors</h2>
                    <p>Trusted by amazing brands in the gaming community</p>
                </div>

                <div
                    className="promo-slider"
                    ref={sliderRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                >
                    {/* Progress Bar */}
                    <div className="slider-progress-bar">
                        <div
                            className="slider-progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Navigation Arrows */}
                    <button className="slider-arrow prev" onClick={handlePrevClick} aria-label="Previous slide">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <button className="slider-arrow next" onClick={handleNextClick} aria-label="Next slide">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>

                    {/* Slide Counter */}
                    <div className="slide-counter">
                        <span className="current">{currentSlide + 1}</span>
                        <span className="separator">/</span>
                        <span className="total">{promos.length}</span>
                    </div>

                    {/* Slides Container */}
                    <div
                        className="slides-container"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                        {promos.map((promo, index) => (
                            <div
                                key={promo._id || promo.id || index}
                                className={`promo-slide ${index === currentSlide ? 'active' : ''}`}
                                style={{ background: promo.gradient }}
                            >
                                <div className="promo-content">
                                    <div className="promo-logo-wrap">
                                        <img
                                            src={promo.logo}
                                            alt={promo.name}
                                            className="promo-logo"
                                            onError={(e) => { e.target.src = '/images/stone.png'; }}
                                        />
                                    </div>

                                    <div className="promo-text">
                                        <h3 className="promo-name">
                                            Sponsored by <span>{promo.name}</span>
                                        </h3>
                                        <p className="promo-tagline">{promo.tagline}</p>
                                        <p className="promo-description">{promo.description}</p>

                                        <div className="promo-features">
                                            {promo.features.map((feature, i) => (
                                                <span key={i} className="feature-tag">✓ {feature}</span>
                                            ))}
                                        </div>

                                        <a
                                            href={promo.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="promo-cta"
                                        >
                                            {promo.buttonText}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Dots Navigation */}
                    <div className="slider-dots">
                        {promos.map((_, index) => (
                            <button
                                key={index}
                                className={`dot ${index === currentSlide ? 'active' : ''}`}
                                onClick={(e) => handleDotClick(e, index)}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>

                    {/* Pause Indicator */}
                    {isPaused && (
                        <div className="pause-indicator">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                                <rect x="6" y="4" width="4" height="16" />
                                <rect x="14" y="4" width="4" height="16" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default PromoSlider;
