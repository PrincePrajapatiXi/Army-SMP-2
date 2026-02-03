import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Search, Package, Clock, CheckCircle, XCircle, AlertCircle,
    ArrowLeft, History, Filter, ChevronDown, ChevronUp,
    Download, RefreshCw, TrendingUp, ShoppingBag, CreditCard,
    Calendar, Hash, Loader2, Star, Receipt
} from 'lucide-react';
import { ordersApi } from '../services/api';
import { useCart } from '../context/CartContext';
import { jsPDF } from 'jspdf';
import './OrderHistory.css';

const OrderHistory = () => {
    const navigate = useNavigate();
    const { addToCart } = useCart();

    // Search state
    const [searchType, setSearchType] = useState('username');
    const [searchValue, setSearchValue] = useState('');
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searched, setSearched] = useState(false);

    // Filter & Sort state
    const [activeFilter, setActiveFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('newest');
    const [orderNumberSearch, setOrderNumberSearch] = useState('');

    // Expanded orders state
    const [expandedOrders, setExpandedOrders] = useState({});

    // Statistics
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalSpent: 0,
        topProduct: null,
        displayTotalOrders: 0,
        displayTotalSpent: 0
    });

    // Calculate statistics when orders change
    useEffect(() => {
        if (orders.length > 0) {
            const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);

            // Find most purchased product
            const productCounts = {};
            orders.forEach(order => {
                order.items?.forEach(item => {
                    const name = item.name;
                    productCounts[name] = (productCounts[name] || 0) + item.quantity;
                });
            });

            let topProduct = null;
            let maxCount = 0;
            Object.entries(productCounts).forEach(([name, count]) => {
                if (count > maxCount) {
                    maxCount = count;
                    topProduct = { name, count };
                }
            });

            setStats({
                totalOrders: orders.length,
                totalSpent: totalSpent,
                topProduct: topProduct,
                displayTotalOrders: 0,
                displayTotalSpent: 0
            });

            // Animate counters
            animateCounter('totalOrders', orders.length);
            animateCounter('totalSpent', totalSpent);
        } else {
            setStats({
                totalOrders: 0,
                totalSpent: 0,
                topProduct: null,
                displayTotalOrders: 0,
                displayTotalSpent: 0
            });
        }
    }, [orders]);

    // Animate counter effect
    const animateCounter = (key, target) => {
        let current = 0;
        const increment = target / 30;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            setStats(prev => ({
                ...prev,
                [`display${key.charAt(0).toUpperCase() + key.slice(1)}`]: Math.floor(current)
            }));
        }, 30);
    };

    // Filter and sort orders
    useEffect(() => {
        let result = [...orders];

        // Apply status filter
        if (activeFilter !== 'all') {
            result = result.filter(order =>
                order.status?.toLowerCase() === activeFilter
            );
        }

        // Apply order number search
        if (orderNumberSearch.trim()) {
            result = result.filter(order =>
                order.orderNumber?.toLowerCase().includes(orderNumberSearch.toLowerCase())
            );
        }

        // Apply sort
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        setFilteredOrders(result);
    }, [orders, activeFilter, sortOrder, orderNumberSearch]);

    const handleSearch = async (e) => {
        e.preventDefault();

        if (!searchValue.trim()) {
            setError('Please enter your Minecraft username or email');
            return;
        }

        setLoading(true);
        setError('');
        setSearched(true);
        setExpandedOrders({});

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

    const toggleOrderExpand = (orderId) => {
        setExpandedOrders(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
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

    const getTimelineStep = (status) => {
        switch (status?.toLowerCase()) {
            case 'pending': return 1;
            case 'processing': return 2;
            case 'completed': return 3;
            case 'cancelled': return -1;
            default: return 1;
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

    const formatDateShort = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Generate PDF Invoice
    const generateInvoice = (order) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Colors
        const primaryColor = [255, 107, 53];
        const darkColor = [30, 30, 35];
        const grayColor = [120, 120, 130];

        // Header
        doc.setFillColor(...darkColor);
        doc.rect(0, 0, pageWidth, 45, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('ARMY SMP 2', 20, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('INVOICE', 20, 35);

        // Order number on right
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.text(order.orderNumber, pageWidth - 20, 25, { align: 'right' });
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text(formatDateShort(order.createdAt), pageWidth - 20, 35, { align: 'right' });

        // Customer Info
        let yPos = 60;
        doc.setTextColor(...darkColor);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Bill To:', 20, yPos);

        yPos += 8;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);
        doc.text(`Minecraft Username: ${order.minecraftUsername}`, 20, yPos);

        if (order.email) {
            yPos += 6;
            doc.text(`Email: ${order.email}`, 20, yPos);
        }

        yPos += 6;
        doc.text(`Platform: ${order.platform || 'Java'}`, 20, yPos);

        // Items Table
        yPos += 20;
        doc.setFillColor(245, 245, 250);
        doc.rect(15, yPos - 5, pageWidth - 30, 12, 'F');

        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('Item', 20, yPos + 3);
        doc.text('Qty', 120, yPos + 3);
        doc.text('Price', 145, yPos + 3);
        doc.text('Total', pageWidth - 25, yPos + 3, { align: 'right' });

        yPos += 15;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);

        order.items?.forEach(item => {
            doc.text(item.name.substring(0, 40), 20, yPos);
            doc.text(String(item.quantity), 120, yPos);
            doc.text(`₹${item.price}`, 145, yPos);
            doc.text(`₹${item.subtotal}`, pageWidth - 25, yPos, { align: 'right' });
            yPos += 8;
        });

        // Divider
        yPos += 5;
        doc.setDrawColor(220, 220, 225);
        doc.line(15, yPos, pageWidth - 15, yPos);

        // Totals
        yPos += 12;
        doc.setTextColor(...grayColor);
        doc.text('Subtotal:', 130, yPos);
        doc.text(`₹${order.subtotal || order.total}`, pageWidth - 25, yPos, { align: 'right' });

        if (order.couponInfo?.discount) {
            yPos += 8;
            doc.setTextColor(34, 197, 94);
            doc.text(`Discount (${order.couponInfo.couponCode}):`, 130, yPos);
            doc.text(`-₹${order.couponInfo.discount}`, pageWidth - 25, yPos, { align: 'right' });
        }

        yPos += 12;
        doc.setFillColor(...primaryColor);
        doc.rect(125, yPos - 6, pageWidth - 140, 14, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Total:', 130, yPos + 2);
        doc.text(order.totalDisplay || `₹${order.total}`, pageWidth - 25, yPos + 2, { align: 'right' });

        // Payment Info
        yPos += 25;
        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Payment Information', 20, yPos);

        yPos += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...grayColor);
        doc.text(`Method: ${order.paymentMethod || 'UPI'}`, 20, yPos);

        if (order.transactionId) {
            yPos += 6;
            doc.text(`Transaction ID: ${order.transactionId}`, 20, yPos);
        }

        yPos += 6;
        doc.text(`Status: ${order.status?.toUpperCase() || 'PENDING'}`, 20, yPos);

        // Footer
        const footerY = doc.internal.pageSize.getHeight() - 20;
        doc.setFontSize(8);
        doc.setTextColor(...grayColor);
        doc.text('Thank you for your purchase! Join us at store.armysmp.fun', pageWidth / 2, footerY, { align: 'center' });
        doc.text('For support, contact us on Discord', pageWidth / 2, footerY + 5, { align: 'center' });

        // Save
        doc.save(`ArmySMP_Invoice_${order.orderNumber}.pdf`);
    };

    // Re-order functionality
    const handleReorder = async (order) => {
        try {
            // Add all items to cart
            for (const item of order.items) {
                await addToCart({
                    id: item.id,
                    name: item.name,
                    price: item.price
                }, item.quantity);
            }
            // Navigate to checkout
            navigate('/checkout');
        } catch (err) {
            console.error('Error re-ordering:', err);
        }
    };

    const filterButtons = [
        { key: 'all', label: 'All', icon: Package },
        { key: 'pending', label: 'Pending', icon: AlertCircle },
        { key: 'processing', label: 'Processing', icon: Clock },
        { key: 'completed', label: 'Completed', icon: CheckCircle },
        { key: 'cancelled', label: 'Cancelled', icon: XCircle }
    ];

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
                        <div className="title-icon">
                            <History size={32} />
                        </div>
                        <h1>Order History</h1>
                    </div>
                    <p>Track your orders with advanced features</p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="search-form glass-card">
                    <div className="search-type-toggle">
                        <button
                            type="button"
                            className={`toggle-btn ${searchType === 'username' ? 'active' : ''}`}
                            onClick={() => setSearchType('username')}
                        >
                            <span className="toggle-icon">🎮</span>
                            Minecraft Username
                        </button>
                        <button
                            type="button"
                            className={`toggle-btn ${searchType === 'email' ? 'active' : ''}`}
                            onClick={() => setSearchType('email')}
                        >
                            <span className="toggle-icon">📧</span>
                            Email
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
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search size={18} />
                                    Find Orders
                                </>
                            )}
                        </button>
                    </div>

                    {error && <p className="error-text">{error}</p>}
                </form>

                {/* Statistics Dashboard */}
                {searched && !loading && orders.length > 0 && (
                    <div className="stats-dashboard">
                        <div className="stat-card glass-card">
                            <div className="stat-icon orders">
                                <ShoppingBag size={24} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">{stats.displayTotalOrders}</span>
                                <span className="stat-label">Total Orders</span>
                            </div>
                        </div>
                        <div className="stat-card glass-card">
                            <div className="stat-icon spent">
                                <CreditCard size={24} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value">₹{stats.displayTotalSpent}</span>
                                <span className="stat-label">Total Spent</span>
                            </div>
                        </div>
                        <div className="stat-card glass-card">
                            <div className="stat-icon top">
                                <Star size={24} />
                            </div>
                            <div className="stat-content">
                                <span className="stat-value top-product">
                                    {stats.topProduct?.name || '-'}
                                </span>
                                <span className="stat-label">
                                    {stats.topProduct ? `Purchased ${stats.topProduct.count}×` : 'Top Product'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Bar */}
                {searched && !loading && orders.length > 0 && (
                    <div className="filter-bar glass-card">
                        <div className="filter-buttons">
                            {filterButtons.map(({ key, label, icon: Icon }) => (
                                <button
                                    key={key}
                                    className={`filter-btn ${activeFilter === key ? 'active' : ''}`}
                                    onClick={() => setActiveFilter(key)}
                                >
                                    <Icon size={16} />
                                    {label}
                                    {key === 'all' && (
                                        <span className="filter-count">{orders.length}</span>
                                    )}
                                    {key !== 'all' && (
                                        <span className="filter-count">
                                            {orders.filter(o => o.status?.toLowerCase() === key).length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="filter-extras">
                            <div className="sort-dropdown">
                                <Calendar size={16} />
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value)}
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                            </div>
                            <div className="order-search">
                                <Hash size={16} />
                                <input
                                    type="text"
                                    placeholder="Search order #..."
                                    value={orderNumberSearch}
                                    onChange={(e) => setOrderNumberSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Results */}
                {searched && !loading && (
                    <div className="orders-section">
                        {filteredOrders.length > 0 ? (
                            <>
                                <h2 className="results-title">
                                    Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                                    {activeFilter !== 'all' && ` with status "${activeFilter}"`}
                                </h2>
                                <div className="orders-list">
                                    {filteredOrders.map((order) => (
                                        <div
                                            key={order.id || order.orderNumber}
                                            className={`order-card glass-card ${expandedOrders[order.id] ? 'expanded' : ''}`}
                                        >
                                            {/* Order Header */}
                                            <div
                                                className="order-header"
                                                onClick={() => toggleOrderExpand(order.id)}
                                            >
                                                <div className="order-info">
                                                    <span className="order-number">
                                                        <Receipt size={16} />
                                                        {order.orderNumber}
                                                    </span>
                                                    <span className="order-date">{formatDate(order.createdAt)}</span>
                                                </div>
                                                <div className="order-header-right">
                                                    <div className={`order-status ${getStatusClass(order.status)}`}>
                                                        {getStatusIcon(order.status)}
                                                        <span>{order.status?.toUpperCase() || 'PENDING'}</span>
                                                    </div>
                                                    <button className="expand-btn">
                                                        {expandedOrders[order.id] ? (
                                                            <ChevronUp size={20} />
                                                        ) : (
                                                            <ChevronDown size={20} />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Order Timeline */}
                                            <div className="order-timeline">
                                                {order.status?.toLowerCase() === 'cancelled' ? (
                                                    <div className="timeline-cancelled">
                                                        <XCircle size={18} />
                                                        <span>Order Cancelled</span>
                                                    </div>
                                                ) : (
                                                    <div className="timeline-steps">
                                                        <div className={`timeline-step ${getTimelineStep(order.status) >= 1 ? 'active' : ''} ${getTimelineStep(order.status) === 1 ? 'current' : ''}`}>
                                                            <div className="step-dot">
                                                                <AlertCircle size={14} />
                                                            </div>
                                                            <span>Pending</span>
                                                        </div>
                                                        <div className="timeline-line"></div>
                                                        <div className={`timeline-step ${getTimelineStep(order.status) >= 2 ? 'active' : ''} ${getTimelineStep(order.status) === 2 ? 'current' : ''}`}>
                                                            <div className="step-dot">
                                                                <Clock size={14} />
                                                            </div>
                                                            <span>Processing</span>
                                                        </div>
                                                        <div className="timeline-line"></div>
                                                        <div className={`timeline-step ${getTimelineStep(order.status) >= 3 ? 'active' : ''} ${getTimelineStep(order.status) === 3 ? 'current' : ''}`}>
                                                            <div className="step-dot">
                                                                <CheckCircle size={14} />
                                                            </div>
                                                            <span>Completed</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Order Items */}
                                            <div className="order-items-list">
                                                {order.items.map((item, index) => (
                                                    <div key={index} className="order-item-row">
                                                        <div className="item-info">
                                                            <span className="item-name">{item.name}</span>
                                                            <span className="item-qty">× {item.quantity}</span>
                                                        </div>
                                                        <span className="item-price">₹{item.subtotal}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Expanded Details */}
                                            <div className={`order-details ${expandedOrders[order.id] ? 'show' : ''}`}>
                                                <div className="details-grid">
                                                    <div className="detail-item">
                                                        <span className="detail-label">Username</span>
                                                        <span className="detail-value">{order.minecraftUsername}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Platform</span>
                                                        <span className="detail-value">{order.platform || 'Java'}</span>
                                                    </div>
                                                    <div className="detail-item">
                                                        <span className="detail-label">Payment Method</span>
                                                        <span className="detail-value">{order.paymentMethod || 'UPI'}</span>
                                                    </div>
                                                    {order.transactionId && (
                                                        <div className="detail-item">
                                                            <span className="detail-label">Transaction ID</span>
                                                            <span className="detail-value mono">{order.transactionId}</span>
                                                        </div>
                                                    )}
                                                    {order.couponInfo?.couponCode && (
                                                        <div className="detail-item">
                                                            <span className="detail-label">Coupon Applied</span>
                                                            <span className="detail-value">
                                                                <span className="coupon-badge">{order.couponInfo.couponCode}</span>
                                                                <span className="discount-amount">-₹{order.couponInfo.discount}</span>
                                                            </span>
                                                        </div>
                                                    )}
                                                    {order.email && (
                                                        <div className="detail-item full-width">
                                                            <span className="detail-label">Email</span>
                                                            <span className="detail-value">{order.email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Order Footer */}
                                            <div className="order-footer">
                                                <div className="order-total">
                                                    <span className="total-label">Total Paid</span>
                                                    <span className="total-amount">{order.totalDisplay}</span>
                                                </div>
                                                <div className="order-actions">
                                                    <button
                                                        className="action-btn invoice"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            generateInvoice(order);
                                                        }}
                                                    >
                                                        <Download size={16} />
                                                        Invoice
                                                    </button>
                                                    <button
                                                        className="action-btn reorder"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleReorder(order);
                                                        }}
                                                    >
                                                        <RefreshCw size={16} />
                                                        Order Again
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : orders.length > 0 ? (
                            <div className="no-orders glass-card">
                                <Filter size={64} strokeWidth={1} />
                                <h3>No Matching Orders</h3>
                                <p>No orders found matching your filter criteria</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setActiveFilter('all');
                                        setOrderNumberSearch('');
                                    }}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <div className="no-orders glass-card">
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

                {/* Loading State */}
                {loading && (
                    <div className="loading-state glass-card">
                        <Loader2 size={48} className="spin" />
                        <h3>Searching Orders...</h3>
                        <p>Please wait while we fetch your order history</p>
                    </div>
                )}

                {/* Initial State */}
                {!searched && !loading && (
                    <div className="initial-state glass-card">
                        <div className="initial-icon">
                            <Package size={80} strokeWidth={1} />
                        </div>
                        <h3>Track Your Orders</h3>
                        <p>Enter your Minecraft username or email above to view your complete order history with advanced tracking features</p>
                        <div className="feature-hints">
                            <span>📊 Statistics</span>
                            <span>📦 Timeline</span>
                            <span>🔍 Filters</span>
                            <span>📄 Invoices</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderHistory;
