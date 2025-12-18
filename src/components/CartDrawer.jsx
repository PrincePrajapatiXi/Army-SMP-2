import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartDrawer.css';

const CartDrawer = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { cartItems, removeFromCart, incrementQuantity, decrementQuantity, getCartTotal, clearCart, loading } = useCart();

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

                            <div className="cart-footer">
                                <div className="cart-total">
                                    <span>Total:</span>
                                    <span className="total-amount">₹{getCartTotal().toFixed(2)}</span>
                                </div>
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
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default CartDrawer;
