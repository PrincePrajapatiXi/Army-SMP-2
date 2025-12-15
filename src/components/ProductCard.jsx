import { ShoppingCart } from 'lucide-react';
import './ProductCard.css';

const ProductCard = ({ product, onBuy }) => {
    return (
        <div className="product-card" onClick={() => onBuy(product)}>
            <div className="card-image-container">
                <img src={product.image} alt={product.name} className="card-image" />
            </div>

            <div className="card-content">
                <h3 className="card-title">{product.name}</h3>

                <div className="card-footer">
                    <span className="card-price">{product.price}</span>
                    <button className="btn btn-primary btn-buy" onClick={(e) => {
                        e.stopPropagation();
                        onBuy(product);
                    }}>
                        Buy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
