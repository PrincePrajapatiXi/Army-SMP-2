import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Check, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ordersApi } from '../services/api';
import './Checkout.css';

const Checkout = () => {
    const navigate = useNavigate();
    const { cartItems, getCartTotal, clearCart } = useCart();
    const [minecraftUsername, setMinecraftUsername] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [orderSuccess, setOrderSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!minecraftUsername.trim()) {
            setError('Please enter your Minecraft username');
            return;
        }

        if (cartItems.length === 0) {
            setError('Your cart is empty');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const result = await ordersApi.create(minecraftUsername.trim(), email.trim() || null);

            setOrderSuccess(result.order);
            await clearCart();

        } catch (err) {
            console.error('Order failed:', err);
            setError(err.message || 'Failed to create order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Success State
    if (orderSuccess) {
        return (
            <div className="checkout-page">
                <div className="checkout-container">
                    <div className="order-success">
                        <div className="success-icon">
                            <Check size={48} />
                        </div>
                        <h1>Order Placed Successfully!</h1>
                        <p className="order-number">Order #: {orderSuccess.orderNumber}</p>

                        <div className="order-details">
                            <p><strong>Minecraft Username:</strong> {orderSuccess.minecraftUsername}</p>
                            <p><strong>Total:</strong> {orderSuccess.totalDisplay}</p>
                            <p><strong>Status:</strong> <span className="status-badge">Pending</span></p>
                        </div>

                        <div className="order-items-summary">
                            <h3>Order Items:</h3>
                            {orderSuccess.items.map(item => (
                                <div key={item.id} className="order-item">
                                    <span>{item.name} × {item.quantity}</span>
                                    <span>₹{item.subtotal}</span>
                                </div>
                            ))}
                        </div>

                        <p className="delivery-note">
                            Your items will be delivered to your Minecraft account within 24 hours.
                            Join our Discord for support!
                        </p>

                        <div className="success-actions">
                            <Link to="/store" className="btn btn-primary">
                                Continue Shopping
                            </Link>
                            <Link to="/" className="btn btn-outline">
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Empty Cart
    if (cartItems.length === 0) {
        return (
            <div className="checkout-page">
                <div className="checkout-container">
                    <div className="empty-checkout">
                        <ShoppingBag size={64} strokeWidth={1} />
                        <h2>Your cart is empty</h2>
                        <p>Add some items before checking out!</p>
                        <Link to="/store" className="btn btn-primary">
                            Browse Store
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="checkout-page">
            <div className="checkout-container">
                <div className="checkout-header">
                    <button onClick={() => navigate(-1)} className="back-btn">
                        <ArrowLeft size={20} />
                        Back
                    </button>
                    <h1>Checkout</h1>
                </div>

                <div className="checkout-content">
                    {/* Order Summary */}
                    <div className="order-summary">
                        <h2>Order Summary</h2>
                        <div className="summary-items">
                            {cartItems.map(item => (
                                <div key={item.id} className="summary-item">
                                    <img src={item.image} alt={item.name} />
                                    <div className="item-info">
                                        <h4>{item.name}</h4>
                                        <span className="item-qty">× {item.quantity}</span>
                                    </div>
                                    <span className="item-price">
                                        ₹{(item.price * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="summary-total">
                            <span>Total:</span>
                            <span className="total-amount">₹{getCartTotal().toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Checkout Form */}
                    <form onSubmit={handleSubmit} className="checkout-form">
                        <h2>Delivery Information</h2>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="minecraft-username">
                                Minecraft Username <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="minecraft-username"
                                value={minecraftUsername}
                                onChange={(e) => setMinecraftUsername(e.target.value)}
                                placeholder="Enter your Minecraft username"
                                disabled={loading}
                                required
                            />
                            <small>Items will be delivered to this account</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">
                                Email (Optional)
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="For order confirmation"
                                disabled={loading}
                            />
                            <small>We'll send order updates to this email</small>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary checkout-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={20} className="spinner" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <ShoppingBag size={20} />
                                    Place Order - ₹{getCartTotal().toFixed(2)}
                                </>
                            )}
                        </button>

                        <p className="payment-note">
                            Payment will be collected separately. Our team will contact you via Discord.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
