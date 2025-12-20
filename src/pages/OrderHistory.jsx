import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, Clock, CheckCircle, XCircle, AlertCircle, ArrowLeft, History } from 'lucide-react';
import { ordersApi } from '../services/api';
import './OrderHistory.css';

const OrderHistory = () => {
    const [searchType, setSearchType] = useState('username'); // 'username' or 'email'
    const [searchValue, setSearchValue] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!searchValue.trim()) {
            setError('Please enter your Minecraft username or email');
            return;
        }

        setLoading(true);
        setError('');
        setSearched(true);

        try {
            let result;
            if (searchType === 'username') {
                result = await ordersApi.getByUsername(searchValue.trim());
            } else {
                result = await ordersApi.getByEmail(searchValue.trim());
            }
            setOrders(result || []);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError('Failed to fetch orders. Please try again.');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return <CheckCircle size={18} className="status-icon completed" />;
            case 'cancelled':
                return <XCircle size={18} className="status-icon cancelled" />;
            case 'processing':
                return <Clock size={18} className="status-icon processing" />;
            default:
                return <AlertCircle size={18} className="status-icon pending" />;
        }
    };

    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'status-completed';
            case 'cancelled': return 'status-cancelled';
            case 'processing': return 'status-processing';
            default: return 'status-pending';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="order-history-page">
            <div className="order-history-container">
                {/* Header */}
                <div className="history-header">
                    <Link to="/" className="back-link">
                        <ArrowLeft size={20} />
                        Back to Home
                    </Link>
                    <div className="header-title">
                        <History size={32} />
                        <h1>Order History</h1>
                    </div>
                    <p>Track your orders by entering your Minecraft username or email</p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-type-toggle">
                        <button
                            type="button"
                            className={`toggle-btn ${searchType === 'username' ? 'active' : ''}`}
                            onClick={() => setSearchType('username')}
                        >
                            🎮 Minecraft Username
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${searchType === 'email' ? 'active' : ''}`}
                            onClick={() => setSearchType('email')}
                        >
                            📧 Email
                        </button>
                    </div>

                    <div className="search-input-row">
                        <div className="search-input-wrapper">
                            <Search size={20} className="search-icon" />
                            <input
                                type={searchType === 'email' ? 'email' : 'text'}
                                placeholder={searchType === 'username'
                                    ? 'Enter your Minecraft username...'
                                    : 'Enter your email address...'}
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary search-btn"
                            disabled={loading}
                        >
                            {loading ? 'Searching...' : 'Find Orders'}
                        </button>
                    </div>

                    {error && <p className="error-text">{error}</p>}
                </form>

                {/* Results */}
                {searched && !loading && (
                    <div className="orders-section">
                        {orders.length > 0 ? (
                            <>
                                <h2 className="results-title">
                                    Found {orders.length} order{orders.length !== 1 ? 's' : ''}
                                </h2>
                                <div className="orders-list">
                                    {orders.map((order) => (
                                        <div key={order.id || order.orderNumber} className="order-card">
                                            <div className="order-header">
                                                <div className="order-info">
                                                    <span className="order-number">#{order.orderNumber}</span>
                                                    <span className="order-date">{formatDate(order.createdAt)}</span>
                                                </div>
                                                <div className={`order-status ${getStatusClass(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    <span>{order.status?.toUpperCase() || 'PENDING'}</span>
                                                </div>
                                            </div>

                                            <div className="order-body">
                                                <div className="order-items">
                                                    <h4><Package size={16} /> Items</h4>
                                                    {order.items.map((item, index) => (
                                                        <div key={index} className="order-item-row">
                                                            <span className="item-name">{item.name} × {item.quantity}</span>
                                                            <span className="item-price">₹{item.subtotal}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="order-meta">
                                                    <p><strong>Platform:</strong> {order.platform || 'Java'}</p>
                                                    <p><strong>Username:</strong> {order.minecraftUsername}</p>
                                                    {order.couponInfo?.couponCode && (
                                                        <p>
                                                            <strong>Coupon:</strong>
                                                            <span className="coupon-tag">{order.couponInfo.couponCode}</span>
                                                            <span className="discount-tag">-₹{order.couponInfo.discount}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="order-footer">
                                                <span className="total-label">Total Paid:</span>
                                                <span className="total-amount">{order.totalDisplay}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="no-orders">
                                <Package size={64} strokeWidth={1} />
                                <h3>No Orders Found</h3>
                                <p>We couldn't find any orders for "{searchValue}"</p>
                                <p className="hint">Make sure you entered the correct {searchType === 'username' ? 'Minecraft username' : 'email address'}</p>
                                <Link to="/store" className="btn btn-primary">
                                    Browse Store
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Initial State */}
                {!searched && !loading && (
                    <div className="initial-state">
                        <Package size={80} strokeWidth={1} />
                        <h3>Track Your Orders</h3>
                        <p>Enter your Minecraft username or email above to view your order history</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;
