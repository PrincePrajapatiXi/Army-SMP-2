import React, { useState, useEffect, useContext } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, Sparkles, Package } from 'lucide-react';
import { CartContext } from '../context/CartContext';
import './RecommendedProducts.css';

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://army-smp-2.onrender.com/api';

const RecommendedProducts = ({
    type = 'trending', // 'trending', 'personalized', 'together'
    title = 'Recommended Products',
    userEmail = null,
    productId = null,
    limit = 6,
    showAddToCart = true
}) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scrollPosition, setScrollPosition] = useState(0);
    const { addToCart } = useContext(CartContext);

    const containerRef = React.useRef(null);

    useEffect(() => {
        fetchRecommendations();
    }, [type, userEmail, productId]);

    const fetchRecommendations = async () => {
        setLoading(true);
        try {
            let endpoint = '';

            switch (type) {
                case 'personalized':
                    if (userEmail) {
                        endpoint = `/predictions/user/${encodeURIComponent(userEmail)}?limit=${limit}`;
                    } else {
                        endpoint = `/predictions/trending?limit=${limit}`;
                    }
                    break;
                case 'together':
                    if (productId) {
                        endpoint = `/predictions/together/${productId}?limit=${limit}`;
                    } else {
                        return; // No product ID, skip
                    }
                    break;
                case 'trending':
                default:
                    endpoint = `/predictions/trending?limit=${limit}`;
                    break;
            }

            const response = await fetch(`${API_BASE_URL}${endpoint}`);
            const data = await response.json();
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const scroll = (direction) => {
        const container = containerRef.current;
        if (!container) return;

        const scrollAmount = 280; // Card width + gap
        const newPosition = direction === 'left'
            ? Math.max(0, scrollPosition - scrollAmount)
            : scrollPosition + scrollAmount;

        container.scrollTo({
            left: newPosition,
            behavior: 'smooth'
        });
        setScrollPosition(newPosition);
    };

    const handleScroll = () => {
        const container = containerRef.current;
        if (container) {
            setScrollPosition(container.scrollLeft);
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'trending':
                return <TrendingUp size={20} />;
            case 'personalized':
                return <Sparkles size={20} />;
            case 'together':
                return <Package size={20} />;
            default:
                return <TrendingUp size={20} />;
        }
    };

    const handleAddToCart = (product) => {
        addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image
        });
    };

    if (!loading && products.length === 0) {
        return null; // Don't render if no products
    }

    return (
        <div className="recommended-products">
            <div className="recommended-header">
                <div className="recommended-title">
                    {getIcon()}
                    <h3>{title}</h3>
                    {type === 'trending' && <span className="badge hot">🔥 HOT</span>}
                </div>

                {products.length > 3 && (
                    <div className="scroll-controls">
                        <button
                            className="scroll-btn"
                            onClick={() => scroll('left')}
                            disabled={scrollPosition <= 0}
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            className="scroll-btn"
                            onClick={() => scroll('right')}
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </div>

            <div
                className="recommended-container"
                ref={containerRef}
                onScroll={handleScroll}
            >
                {loading ? (
                    // Skeleton Loading
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="recommended-card skeleton">
                            <div className="skeleton-image"></div>
                            <div className="skeleton-text"></div>
                            <div className="skeleton-price"></div>
                        </div>
                    ))
                ) : (
                    products.map((product, index) => (
                        <div
                            key={product.id || product._id || index}
                            className="recommended-card"
                            style={{ '--card-delay': `${index * 0.1}s` }}
                        >
                            {product.purchaseCount && (
                                <span className="trending-badge">
                                    {product.purchaseCount}+ sold
                                </span>
                            )}

                            <div className="card-image">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    onError={(e) => { e.target.src = '/images/stone.png'; }}
                                />
                            </div>

                            <div className="card-content">
                                <h4 className="card-name">{product.name}</h4>
                                <div className="card-price">
                                    ₹{product.price?.toFixed(2) || '0.00'}
                                </div>

                                {showAddToCart && (
                                    <button
                                        className="add-to-cart-btn"
                                        onClick={() => handleAddToCart(product)}
                                    >
                                        Add to Cart
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecommendedProducts;
