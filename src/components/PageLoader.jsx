import React from 'react';
import './PageLoader.css';

// Premium page loading skeleton with shimmer effect
const PageLoader = () => {
    return (
        <div className="page-loader">
            <div className="page-loader-content">
                {/* Animated Logo/Spinner */}
                <div className="loader-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <div className="spinner-core"></div>
                </div>

                {/* Loading Text */}
                <div className="loader-text">
                    <span className="loader-text-main">Loading</span>
                    <span className="loader-dots">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default PageLoader;
