import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Check, Loader2, MessageCircle, Tag, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ordersApi } from '../services/api';
import { validateCoupon as validateCouponLocal } from '../data/coupons';
import Confetti from '../components/Confetti';
import './Checkout.css';

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://army-smp-2.onrender.com/api';

const Checkout = () => {
    const navigate = useNavigate();
    const { cartItems, getCartTotal, clearCart } = useCart();
    const [minecraftUsername, setMinecraftUsername] = useState('');
    const [email, setEmail] = useState('');
    const [platform, setPlatform] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [orderSuccess, setOrderSuccess] = useState(null);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);

    const subtotal = getCartTotal();
    const discountAmount = appliedCoupon?.discountAmount || 0;
    const finalTotal = subtotal - discountAmount;

    // Apply coupon - try API first (MongoDB), fallback to local
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) {
            setCouponError('Please enter a coupon code');
            return;
        }

        setCouponLoading(true);
        setCouponError('');

        try {
            // Try API first (coupons from Admin Panel / MongoDB)
            const response = await fetch(`${API_BASE_URL}/coupons/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: couponCode.trim(),
                    orderTotal: subtotal
                })
            });

            const data = await response.json();

            if (data.success) {
                setAppliedCoupon({
                    valid: true,
                    coupon: { code: data.couponCode },
                    discountAmount: data.discount,
                    message: `Coupon applied! You save ₹${data.discount.toFixed(2)}!`
                });
                setCouponCode('');
                setCouponError('');
            } else {
                // API coupon not found, try local coupons
                const localResult = validateCouponLocal(couponCode.trim(), subtotal);
                if (localResult.valid) {
                    setAppliedCoupon(localResult);
                    setCouponCode('');
                    setCouponError('');
                } else {
                    setCouponError(data.error || localResult.error);
                    setAppliedCoupon(null);
                }
            }
        } catch (err) {
            // API failed, fallback to local validation
            console.log('API coupon validation failed, using local:', err);
            const localResult = validateCouponLocal(couponCode.trim(), subtotal);
            if (localResult.valid) {
                setAppliedCoupon(localResult);
                setCouponCode('');
                setCouponError('');
            } else {
                setCouponError(localResult.error);
                setAppliedCoupon(null);
            }
        } finally {
            setCouponLoading(false);
        }
    };

    // Remove coupon
    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!minecraftUsername.trim()) {
            setError('Please enter your Minecraft username');
            return;
        }

        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }

        if (!platform) {
            setError('Please select your platform (Java or Bedrock)');
            return;
        }

        if (cartItems.length === 0) {
            setError('Your cart is empty');
            return;
        }

        // Always try to send order to backend first (for email notification)
        // This ensures emails are sent even if cart was in local storage mode
        try {
            setLoading(true);
            setError(null);

            // Format items for API
            const orderItems = cartItems.map(item => ({
                id: item.id,
                name: item.name,
                price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[^0-9.-]+/g, '')),
                quantity: item.quantity,
                subtotal: (typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[^0-9.-]+/g, ''))) * item.quantity
            }));

            const result = await ordersApi.create(minecraftUsername.trim(), email.trim(), orderItems, platform, {
                couponCode: appliedCoupon?.coupon?.code || null,
                discount: discountAmount,
                subtotal: subtotal,
                finalTotal: finalTotal
            });

            setOrderSuccess({
                ...result.order,
                couponApplied: appliedCoupon?.coupon?.code || null,
                discount: discountAmount,
                subtotal: subtotal,
                total: finalTotal,
                totalDisplay: `₹${finalTotal.toFixed(2)}`
            });
            await clearCart();

        } catch (err) {
            console.error('Order failed:', err);
            // If API fails, switch to local mode
            const orderDetails = {
                orderNumber: `LOCAL-${Date.now().toString(36).toUpperCase()}`,
                minecraftUsername: minecraftUsername.trim(),
                email: email.trim(),
                platform: platform,
                items: cartItems.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    subtotal: item.price * item.quantity
                })),
                subtotal: subtotal,
                discount: discountAmount,
                couponApplied: appliedCoupon?.coupon?.code || null,
                total: finalTotal,
                totalDisplay: `₹${finalTotal.toFixed(2)}`,
                status: 'pending'
            };

            setOrderSuccess(orderDetails);
            await clearCart();
        } finally {
            setLoading(false);
        }
    };

    // Get display price
    const getDisplayPrice = (item) => {
        const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[^0-9.-]+/g, ''));
        return `₹${(price * item.quantity).toFixed(2)}`;
    };

    // Success State
    if (orderSuccess) {
        const isLocalOrder = orderSuccess.orderNumber?.startsWith('LOCAL-');

        return (
            <div className="checkout-page">
                {/* Confetti Celebration */}
                <Confetti isActive={true} duration={5000} particleCount={200} />

                <div className="checkout-container">
                    <div className="order-success">
                        <div className="success-icon">
                            <Check size={48} />
                        </div>
                        <h1>Order Placed Successfully!</h1>
                        <p className="order-number">Order #: {orderSuccess.orderNumber}</p>

                        <div className="order-details">
                            <p><strong>Minecraft Username:</strong> {orderSuccess.minecraftUsername}</p>
                            {orderSuccess.couponApplied && (
                                <p><strong>Coupon Applied:</strong> <span className="coupon-badge">{orderSuccess.couponApplied}</span></p>
                            )}
                            {orderSuccess.discount > 0 && (
                                <p><strong>Discount:</strong> <span className="discount-text">-₹{orderSuccess.discount.toFixed(2)}</span></p>
                            )}
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

                        {isLocalOrder ? (
                            <div className="discord-contact">
                                <MessageCircle size={24} />
                                <p>
                                    <strong>Contact us on Discord to complete your order!</strong><br />
                                    Share your order number and payment details.
                                </p>
                                <a href="https://discord.gg/EBmGM2jsdt" target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                                    Join Discord
                                </a>
                            </div>
                        ) : (
                            <p className="delivery-note">
                                Your items will be delivered to your Minecraft account within 24 hours.
                                Join our Discord for support!
                            </p>
                        )}

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
                                    <div className="item-image-placeholder" style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '8px',
                                        background: item.color ? `linear-gradient(135deg, ${item.color}40, ${item.color}20)` : 'rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: `1px solid ${item.color || 'rgba(255,255,255,0.1)'}`,
                                        fontSize: '20px'
                                    }}>
                                        {item.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="item-info">
                                        <h4>{item.name}</h4>
                                        <span className="item-qty">× {item.quantity}</span>
                                    </div>
                                    <span className="item-price">
                                        {getDisplayPrice(item)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Coupon Section */}
                        <div className="coupon-section">
                            <h3><Tag size={18} /> Apply Coupon</h3>

                            {appliedCoupon ? (
                                <div className="coupon-applied">
                                    <div className="coupon-applied-info">
                                        <span className="coupon-code-tag">{appliedCoupon.coupon.code}</span>
                                        <span className="coupon-savings">-₹{appliedCoupon.discountAmount.toFixed(2)} saved!</span>
                                    </div>
                                    <button
                                        className="coupon-remove-btn"
                                        onClick={handleRemoveCoupon}
                                        type="button"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="coupon-input-row">
                                    <input
                                        type="text"
                                        placeholder="Enter coupon code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        className="coupon-input"
                                        disabled={couponLoading}
                                    />
                                    <button
                                        type="button"
                                        className="coupon-apply-btn"
                                        onClick={handleApplyCoupon}
                                        disabled={couponLoading}
                                    >
                                        {couponLoading ? 'Applying...' : 'Apply'}
                                    </button>
                                </div>
                            )}

                            {couponError && (
                                <p className="coupon-error">{couponError}</p>
                            )}

                            {appliedCoupon && (
                                <p className="coupon-success">{appliedCoupon.message}</p>
                            )}
                        </div>

                        {/* Price Summary */}
                        <div className="price-breakdown">
                            <div className="price-row">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="price-row discount-row">
                                    <span>Discount</span>
                                    <span className="discount-amount">-₹{discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        <div className="summary-total">
                            <span>Total:</span>
                            <span className="total-amount">₹{finalTotal.toFixed(2)}</span>
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
                                Email <span className="required">*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                disabled={loading}
                                required
                            />
                            <small>We'll send order updates to this email</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="platform">
                                Platform <span className="required">*</span>
                            </label>
                            <select
                                id="platform"
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                disabled={loading}
                                required
                                className="platform-select"
                            >
                                <option value="">Select your platform</option>
                                <option value="Java">☕ Java Edition</option>
                                <option value="Bedrock">🪨 Bedrock Edition</option>
                            </select>
                            <small>Choose the Minecraft edition you play on</small>
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
                                    Place Order - ₹{finalTotal.toFixed(2)}
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
