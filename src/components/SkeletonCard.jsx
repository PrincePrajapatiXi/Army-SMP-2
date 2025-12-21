import React from 'react';
import './SkeletonCard.css';

const SkeletonCard = () => {
    return (
        <div className="skeleton-card">
            <div className="skeleton-image shimmer"></div>
            <div className="skeleton-content">
                <div className="skeleton-title shimmer"></div>
                <div className="skeleton-category shimmer"></div>
                <div className="skeleton-price shimmer"></div>
                <div className="skeleton-button shimmer"></div>
            </div>
        </div>
    );
};

// Grid of skeleton cards for loading state
export const SkeletonGrid = ({ count = 8 }) => {
    return (
        <div className="skeleton-grid">
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </div>
    );
};

export default SkeletonCard;
