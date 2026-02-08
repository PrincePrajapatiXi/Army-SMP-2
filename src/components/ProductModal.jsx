import { X, ShoppingCart, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';
import { triggerHaptic } from '../hooks/useHaptics';
import ImageGallery from './ImageGallery';
import './ProductModal.css';

const Modal = ({ isOpen, onClose, product }) => {
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);
    const { addToCart } = useCart();
    const toast = useToast();

    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('modal-open');
            setQuantity(1);
            setAddedToCart(false);
            // Scroll to top when modal opens so user can see the full modal
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isOpen]);

    const handleDecrement = () => {
        if (quantity > 1) setQuantity(prev => prev - 1);
    };

    const handleIncrement = () => {
        setQuantity(prev => prev + 1);
    };

    const handleAddToCart = () => {
        addToCart(product, quantity);
        setAddedToCart(true);
        triggerHaptic('success');
        toast.success(`${product.name} added to cart!`);
        setTimeout(() => {
            setAddedToCart(false);
            onClose();
        }, 800);
    };

    if (!isOpen || !product) return null;

    return (
        <div className="product-modal-overlay" onClick={onClose}>
            <div className="product-modal" onClick={e => e.stopPropagation()}>
                <div className="product-modal-header">
                    <h2>{product.name}</h2>
                    <button className="modal-close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="product-modal-body">
                    {/* Swipeable Image Gallery */}
                    <ImageGallery
                        images={product.images || [product.image || '/images/stone.png']}
                        alt={product.name}
                    />

                    {/* Feature List - split description by comma */}
                    <div className="product-features-list">
                        {(product.description || "Unlock exclusive features with this package")
                            .split(',')
                            .map((feature, index) => feature.trim())
                            .filter(feature => feature.length > 0)
                            .map((feature, index) => (
                                <div key={index} className="feature-item">
                                    <Check size={16} className="feature-check" />
                                    <span>{feature}</span>
                                </div>
                            ))
                        }
                    </div>

                    <div className="product-modal-actions">
                        <span className="product-modal-price">{product.price}</span>
                        <div className="quantity-control">
                            <button onClick={handleDecrement} disabled={quantity <= 1}>-</button>
                            <span>{quantity}</span>
                            <button onClick={handleIncrement}>+</button>
                        </div>
                    </div>

                    <button
                        className={`add-to-cart-btn ${addedToCart ? 'added' : ''}`}
                        onClick={handleAddToCart}
                    >
                        {addedToCart ? (
                            <><Check size={18} /> Added!</>
                        ) : (
                            <><ShoppingCart size={18} /> Add to Cart</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;

