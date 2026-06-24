import { X, Trash2, Plus, Minus, ShoppingBag, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './CartDrawer.css';

const CartDrawer = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { cartItems, removeFromCart, incrementQuantity, decrementQuantity, getCartTotal, clearCart, loading } = useCart();

    // Upsell suggestions (could be fetched from API)
    const upsellItems = [
        { id: 'upsell-1', name: 'Golden Key', price: 49, image: '/images/golden-key.png' },
        { id: 'upsell-2', name: '500 Coins', price: 99, image: '/images/coins.png' },
        { id: 'upsell-3', name: 'Crate Key', price: 29, image: '/images/crate-key.png' },
    ];

    const handleCheckout = () => {
        onClose();
        navigate('/checkout');
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div className="cart-overlay" onClick={onClose}></div>

            {/* Drawer */}
            <div className="cart-drawer">
                <div className="cart-header">
                    <h2><ShoppingBag size={24} /> Your Cart</h2>
                    <button className="cart-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="cart-body">
                    {cartItems.length === 0 ? (
                        <div className="cart-empty">
                            <ShoppingBag size={64} strokeWidth={1} />
                            <p>Your cart is empty</p>
                            <button className="btn btn-primary" onClick={onClose}>
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Scrollable Cart Items */}
                            <div className="cart-items-scroll">
                                <div className="cart-items">
                                    {cartItems.map(item => (
                                        <div key={item.id} className="cart-item">
                                            <img src={item.image} alt={item.name} className="cart-item-image" />
                                            <div className="cart-item-details">
                                                <h4>{item.name}</h4>
                                                <span className="cart-item-price">
                                                    {item.priceDisplay || `₹${item.price}`}
                                                </span>
                                            </div>
                                            <div className="cart-item-quantity">
                                                <button
                                                    onClick={() => decrementQuantity(item.id)}
                                                    className="qty-btn"
                                                    disabled={loading}
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span>{item.quantity}</span>
                                                <button
                                                    onClick={() => incrementQuantity(item.id)}
                                                    className="qty-btn"
                                                    disabled={loading}
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            <button
                                                className="cart-item-remove"
                                                onClick={() => removeFromCart(item.id)}
                                                disabled={loading}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Upsell Section */}
                                <div className="cart-upsell">
                                    <div className="upsell-header">
                                        <Sparkles size={16} />
                                        <span>You might also like</span>
                                    </div>
                                    <div className="upsell-scroll">
                                        {upsellItems.map(item => (
                                            <div key={item.id} className="upsell-item">
                                                <img src={item.image} alt={item.name} className="upsell-image" />
                                                <span className="upsell-name">{item.name}</span>
                                                <span className="upsell-price">₹{item.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Sticky Footer */}
                            <div className="cart-footer-sticky">
                                {/* Total & Checkout */}
                                <div className="cart-summary">
                                    <div className="cart-total">
                                        <span>Total:</span>
                                        <span className="total-amount">₹{getCartTotal().toFixed(2)}</span>
                                    </div>
                                    <p className="coupon-hint">💡 Have a coupon? Apply it at checkout!</p>
                                    <button
                                        className="btn btn-primary checkout-btn"
                                        onClick={handleCheckout}
                                        disabled={loading}
                                    >
                                        Proceed to Checkout
                                    </button>
                                    <button
                                        className="btn btn-outline clear-btn"
                                        onClick={clearCart}
                                        disabled={loading}
                                    >
                                        Clear Cart
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default CartDrawer;

