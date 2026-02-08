import React from 'react';
import './SkeletonCard.css';

// Micro Skeleton Card for 3-column mobile layout
const SkeletonCard = () => {
    return (
        <div className="skeleton-card">
            <div className="skeleton-image shimmer"></div>
            <div className="skeleton-content">
                <div className="skeleton-title shimmer"></div>
                <div className="skeleton-footer">
                    <div className="skeleton-price shimmer"></div>
                    <div className="skeleton-btn shimmer"></div>
                </div>
            </div>
        </div>
    );
};

// Grid of skeleton cards for loading state (6 = 2 complete rows on mobile)
export const SkeletonGrid = ({ count = 6 }) => {
    return (
        <div className="skeleton-grid">
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </div>
    );
};

export default SkeletonCard;

