import React, { useState, useEffect } from 'react';
import './CookieConsent.css';

const COOKIE_CONSENT_KEY = 'armysmp_cookie_consent';

const CookieConsent = () => {
    const [showBanner, setShowBanner] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!consent) {
            // Delay showing banner for better UX
            const timer = setTimeout(() => {
                setShowBanner(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAcceptAll = () => {
        const consentData = {
            essential: true,
            analytics: true,
            preferences: true,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
        setShowBanner(false);
    };

    const handleEssentialOnly = () => {
        const consentData = {
            essential: true,
            analytics: false,
            preferences: false,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
        setShowBanner(false);
    };

    const handleCustomize = () => {
        setShowDetails(!showDetails);
    };

    if (!showBanner) return null;

    return (
        <div className={`cookie-consent-overlay ${showBanner ? 'show' : ''}`}>
            <div className={`cookie-consent-banner ${showDetails ? 'expanded' : ''}`}>
                <div className="cookie-icon">🍪</div>

                <div className="cookie-content">
                    <h3>Cookie Notice</h3>
                    <p>
                        Hum aapki website experience ko behtar banane ke liye cookies use karte hain.
                        Yeh aapki preferences aur login information ko yaad rakhne mein madad karti hain.
                    </p>

                    {showDetails && (
                        <div className="cookie-details">
                            <div className="cookie-category">
                                <div className="category-header">
                                    <span className="category-icon">🔐</span>
                                    <strong>Essential Cookies</strong>
                                    <span className="required-badge">Required</span>
                                </div>
                                <p>Website ke basic functions ke liye zaroori - login, cart, etc.</p>
                            </div>

                            <div className="cookie-category">
                                <div className="category-header">
                                    <span className="category-icon">📊</span>
                                    <strong>Analytics Cookies</strong>
                                </div>
                                <p>Website usage ko samajhne aur improve karne ke liye.</p>
                            </div>

                            <div className="cookie-category">
                                <div className="category-header">
                                    <span className="category-icon">🎨</span>
                                    <strong>Preference Cookies</strong>
                                </div>
                                <p>Theme, language aur personalization settings ke liye.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="cookie-actions">
                    <button
                        className="cookie-btn cookie-btn-accept"
                        onClick={handleAcceptAll}
                    >
                        ✓ Accept All
                    </button>
                    <button
                        className="cookie-btn cookie-btn-essential"
                        onClick={handleEssentialOnly}
                    >
                        Essential Only
                    </button>
                    <button
                        className="cookie-btn cookie-btn-customize"
                        onClick={handleCustomize}
                    >
                        {showDetails ? 'Hide Details' : 'Learn More'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Utility function to check cookie consent
export const getCookieConsent = () => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) return null;
    try {
        return JSON.parse(consent);
    } catch {
        return null;
    }
};

// Utility function to check if specific cookie type is allowed
export const isCookieAllowed = (type) => {
    const consent = getCookieConsent();
    if (!consent) return false;
    return consent[type] === true;
};

// Utility function to reset cookie consent (for settings page)
export const resetCookieConsent = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
};

export default CookieConsent;
