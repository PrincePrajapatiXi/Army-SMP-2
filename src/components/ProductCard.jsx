import { ShoppingCart, Heart } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import './ProductCard.css';

const getCategoryColor = (category, explicitColor) => {
    // Normalize color to lowercase for comparison
    const color = explicitColor?.toLowerCase();
    const catParams = category?.toLowerCase();

    // STRICTLY enforce category themes as per user request
    switch (catParams) {
        case 'ranks':
            return '#00BFFF'; // Sky Blue
        case 'keys':
            return '#FF4444'; // Red
        case 'crates':
            return '#44FF44'; // Green
        case 'coins':
            return '#FFD700'; // Yellow
        case 'items':
            return '#aaaaaa'; // Grey for items
    }

    // List of colors to consider as "default/none"
    const defaultColors = [
        '#ffffff', '#ffffffff', '#fff',
        '#000000', '#000000ff', '#000',
        '#808080', '#gray', '#grey',
        'rgba(255, 255, 255, 1)', 'rgba(0, 0, 0, 1)'
    ];

    // If not a themed category, use specific color if valid
    if (color && !defaultColors.includes(color)) {
        return explicitColor;
    }

    if (!category) return 'rgba(255, 255, 255, 0.1)';

    // Fallback: Generate a consistent unique color for new/unknown categories
    let hash = 0;
    for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsl(${h}, 80%, 60%)`; // Vibrant neon-like color
};

const ProductCard = ({ product, onBuy }) => {
    const { isInWishlist, toggleWishlist } = useWishlist();
    const cardColor = getCategoryColor(product.category, product.color);
    const hasColor = cardColor !== 'rgba(255, 255, 255, 0.1)';
    const wishlisted = isInWishlist(product.id);

    const handleWishlistClick = (e) => {
        e.stopPropagation();
        toggleWishlist(product);
    };

    return (
        <div className="product-card" onClick={() => onBuy(product)} style={{
            border: hasColor ? `1px solid ${cardColor}` : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: hasColor ? `0 0 15px ${cardColor}40` : 'none'
        }}>
            {/* Wishlist Heart Button */}
            <button
                className={`wishlist-btn ${wishlisted ? 'active' : ''}`}
                onClick={handleWishlistClick}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
                <Heart
                    size={20}
                    fill={wishlisted ? '#ff4757' : 'none'}
                    stroke={wishlisted ? '#ff4757' : 'currentColor'}
                />
            </button>

            <div className="card-image-container" style={{
                background: hasColor ? `radial-gradient(circle at center, ${cardColor}20 0%, transparent 70%)` : 'none'
            }}>
                <img src={product.image} alt={product.name} className="card-image" />
            </div>

            <div className="card-content">
                <h3 className="card-title" style={{
                    color: hasColor ? cardColor : 'var(--text-primary)',
                    textShadow: hasColor ? `0 0 10px ${cardColor}40` : 'none'
                }}>{product.name}</h3>

                <div className="card-footer">
                    <span className="card-price">
                        {product.priceDisplay || (typeof product.price === 'number' ? `₹${product.price}` : product.price)}
                    </span>
                    <button className="btn btn-primary btn-buy" onClick={(e) => {
                        e.stopPropagation();
                        onBuy(product);
                    }} style={{
                        backgroundColor: hasColor ? cardColor : 'var(--primary)',
                        borderColor: hasColor ? cardColor : 'var(--primary)',
                        color: (hasColor && (cardColor === '#FFD700' || cardColor === '#44FF44')) ? '#000' : '#fff',
                        boxShadow: hasColor ? `0 0 10px ${cardColor}60` : 'none'
                    }}>
                        Buy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
