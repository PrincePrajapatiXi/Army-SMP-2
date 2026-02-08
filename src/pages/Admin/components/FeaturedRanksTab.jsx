import React, { useMemo } from 'react';
import { Star, Edit, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';

const FeaturedRanksTab = ({
    products,
    loading,
    openEditModal,
    updateFeaturedStatus,
    updateDisplayOrder
}) => {
    // Get featured products sorted by displayOrder
    const featuredProducts = useMemo(() => {
        return products
            .filter(p => p.isFeatured)
            .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }, [products]);

    // Get non-featured Ranks products that can be promoted
    const availableRanks = useMemo(() => {
        return products.filter(p => p.category === 'ranks' && !p.isFeatured);
    }, [products]);

    const handleToggleFeatured = async (product) => {
        if (updateFeaturedStatus) {
            await updateFeaturedStatus(product.id, !product.isFeatured);
        }
    };

    const moveUp = async (product, index) => {
        if (index === 0 || !updateDisplayOrder) return;
        await updateDisplayOrder(product.id, (product.displayOrder || index) - 1);
    };

    const moveDown = async (product, index) => {
        if (index === featuredProducts.length - 1 || !updateDisplayOrder) return;
        await updateDisplayOrder(product.id, (product.displayOrder || index) + 1);
    };

    return (
        <div className="featured-ranks-content">
            {/* Info Banner */}
            <div className="featured-info-banner">
                <Star size={24} />
                <div>
                    <h3>Featured Ranks</h3>
                    <p>Products marked as "Featured" will appear in the Featured Ranks section on the Homepage. You can manage them here.</p>
                </div>
            </div>

            {/* Current Featured Products */}
            <div className="featured-section-card">
                <div className="section-header">
                    <h3>
                        <Star size={20} />
                        Currently Featured ({featuredProducts.length})
                    </h3>
                </div>

                {featuredProducts.length === 0 ? (
                    <div className="no-featured">
                        <Star size={48} />
                        <p>No products are featured yet.</p>
                        <p className="hint">Mark products as "Featured" in the Products tab to show them on Homepage.</p>
                    </div>
                ) : (
                    <div className="featured-list">
                        {featuredProducts.map((product, index) => (
                            <div key={product.id} className="featured-item">
                                <div className="featured-item-order">
                                    <button
                                        className="order-btn"
                                        onClick={() => moveUp(product, index)}
                                        disabled={index === 0}
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                    <span className="order-number">{index + 1}</span>
                                    <button
                                        className="order-btn"
                                        onClick={() => moveDown(product, index)}
                                        disabled={index === featuredProducts.length - 1}
                                    >
                                        <ArrowDown size={16} />
                                    </button>
                                </div>

                                <div className="featured-item-image">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        onError={(e) => { e.target.src = '/images/stone.png'; }}
                                    />
                                </div>

                                <div className="featured-item-info">
                                    <h4>{product.name}</h4>
                                    <span className="product-category">{product.category}</span>
                                    <span className="product-price">{product.priceDisplay}</span>
                                    {product.features && product.features.length > 0 && (
                                        <div className="features-preview">
                                            {product.features.slice(0, 3).map((f, i) => (
                                                <span key={i} className="feature-tag">✓ {f}</span>
                                            ))}
                                            {product.features.length > 3 && (
                                                <span className="more-features">+{product.features.length - 3} more</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="featured-item-actions">
                                    <button
                                        className="action-btn edit"
                                        onClick={() => openEditModal(product)}
                                    >
                                        <Edit size={16} />
                                        Edit
                                    </button>
                                    <button
                                        className="action-btn remove"
                                        onClick={() => handleToggleFeatured(product)}
                                    >
                                        <EyeOff size={16} />
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Available Ranks to Feature */}
            {availableRanks.length > 0 && (
                <div className="featured-section-card">
                    <div className="section-header">
                        <h3>
                            <Eye size={20} />
                            Available Ranks to Feature ({availableRanks.length})
                        </h3>
                    </div>

                    <div className="available-ranks-grid">
                        {availableRanks.map(product => (
                            <div key={product.id} className="available-rank-card">
                                <div className="rank-image">
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        onError={(e) => { e.target.src = '/images/stone.png'; }}
                                    />
                                </div>
                                <div className="rank-info">
                                    <h4>{product.name}</h4>
                                    <span className="product-price">{product.priceDisplay}</span>
                                </div>
                                <button
                                    className="feature-btn"
                                    onClick={() => handleToggleFeatured(product)}
                                >
                                    <Star size={16} />
                                    Feature
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeaturedRanksTab;

