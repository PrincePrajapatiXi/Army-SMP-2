import { ShoppingCart } from 'lucide-react';
import './ProductCard.css';

const ProductCard = ({ product, onBuy }) => {
    return (
        <div className="product-card" onClick={() => onBuy(product)} style={{
            border: product.color ? `1px solid ${product.color}` : '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: product.color ? `0 0 15px ${product.color}40` : 'none'
        }}>
            <div className="card-image-container" style={{
                background: product.color ? `radial-gradient(circle at center, ${product.color}20 0%, transparent 70%)` : 'none'
            }}>
                <img src={product.image} alt={product.name} className="card-image" />
            </div>

            <div className="card-content">
                <h3 className="card-title" style={{
                    color: product.color || 'var(--text-primary)',
                    textShadow: product.color ? `0 0 10px ${product.color}40` : 'none'
                }}>{product.name}</h3>

                <div className="card-footer">
                    <span className="card-price">
                        {product.priceDisplay || (typeof product.price === 'number' ? `₹${product.price}` : product.price)}
                    </span>
                    <button className="btn btn-primary btn-buy" onClick={(e) => {
                        e.stopPropagation();
                        onBuy(product);
                    }} style={{
                        backgroundColor: product.color || 'var(--primary)',
                        borderColor: product.color || 'var(--primary)',
                        color: product.color === '#ffffffff' || product.color === 'rgba(255, 255, 255, 1)' ? '#000' : '#fff',
                        boxShadow: product.color ? `0 0 10px ${product.color}60` : 'none'
                    }}>
                        Buy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
