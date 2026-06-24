import React from 'react';
import './SkeletonCard.css';

export const SkeletonCard = () => {
    return (
        <div className="skeleton-card">
            <div className="skeleton-image"></div>
            <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-footer">
                    <div className="skeleton-price"></div>
                    <div className="skeleton-btn"></div>
                </div>
            </div>
        </div>
    );
};

export const SkeletonGrid = ({ count = 8 }) => {
    return (
        <div className="store-grid">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
};

export default SkeletonCard;
