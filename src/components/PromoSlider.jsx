import { useState, useEffect, useRef } from 'react';
import './PromoSlider.css';

const PromoSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    const sliderRef = useRef(null);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    // Sponsor/Promo data - easily add more sponsors here!
    const promos = [
        {
            id: 1,
            logo: '/images/dragohost-logo.png',
            name: 'DragoHost',
            tagline: 'Premium Minecraft Hosting',
            description: 'DragoHost offers true 24/7 premium servers with guaranteed 100% uptime and premium control panel.',
            features: ['24/7 Support', '100% Uptime', 'Premium Panel', 'DDoS Protection'],
            link: 'https://discord.gg/D9pGnUM2tH',
            buttonText: 'Join Discord',
            gradient: 'linear-gradient(135deg, #1e3a5f, #0d1b2a)'
        },
        {
            id: 2,
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
            id: 3,
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

    // Auto slide every 5 seconds
    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % promos.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying, promos.length]);

    // Handle navigation
    const goToSlide = (index) => {
        setCurrentSlide(index);
        setIsAutoPlaying(false);
        // Resume auto-play after 10 seconds of inactivity
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % promos.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + promos.length) % promos.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    };

    // Touch/Swipe handlers
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                nextSlide(); // Swipe left = next
            } else {
                prevSlide(); // Swipe right = prev
            }
        }
    };

    // Mouse drag handlers
    const handleMouseDown = (e) => {
        touchStartX.current = e.clientX;
    };

    const handleMouseUp = (e) => {
        const diff = touchStartX.current - e.clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
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
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                >
                    {/* Navigation Arrows */}
                    <button className="slider-arrow prev" onClick={prevSlide}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <button className="slider-arrow next" onClick={nextSlide}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>

                    {/* Slides Container */}
                    <div
                        className="slides-container"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                        {promos.map((promo, index) => (
                            <div
                                key={promo.id}
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
                                onClick={() => goToSlide(index)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PromoSlider;
