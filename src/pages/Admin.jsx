import React, { useState, useEffect } from 'react';
import {
    Lock, LogOut, Package, TrendingUp, Users, DollarSign,
    ShoppingCart, Clock, CheckCircle, XCircle, AlertCircle,
    Calendar, Filter, RefreshCw
} from 'lucide-react';
import './Admin.css';

const API_BASE_URL = 'https://army-smp-2.onrender.com/api';

// Simple password for admin (in production, use proper auth)
const ADMIN_PASSWORD = 'armysmp2admin';

const Admin = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [statusFilter, setStatusFilter] = useState('all');

    // Check if already logged in
    useEffect(() => {
        const adminAuth = sessionStorage.getItem('adminAuth');
        if (adminAuth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    // Fetch orders when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchOrders();
        }
    }, [isAuthenticated]);

    const handleLogin = (e) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            sessionStorage.setItem('adminAuth', 'true');
            setLoginError('');
        } else {
            setLoginError('Invalid password');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('adminAuth');
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/orders`, {
                credentials: 'include'
            });
            const data = await response.json();
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchOrders(); // Refresh
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    // Helper to get IST date string
    const getISTDateString = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // Calculate Analytics
    const todayIST = getISTDateString(new Date());

    const analytics = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        todayOrders: orders.filter(o => getISTDateString(o.createdAt) === todayIST).length,
        todayRevenue: orders
            .filter(o => getISTDateString(o.createdAt) === todayIST)
            .reduce((sum, o) => sum + (o.total || 0), 0)
    };

    // Filter orders
    const filteredOrders = statusFilter === 'all'
        ? orders
        : orders.filter(o => o.status === statusFilter);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle size={16} />;
            case 'cancelled': return <XCircle size={16} />;
            case 'processing': return <Clock size={16} />;
            default: return <AlertCircle size={16} />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Login Screen
    if (!isAuthenticated) {
        return (
            <div className="admin-login-page">
                <div className="admin-login-box">
                    <div className="login-icon">
                        <Lock size={48} />
                    </div>
                    <h1>Admin Panel</h1>
                    <p>Enter password to access admin dashboard</p>

                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            placeholder="Enter admin password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="admin-input"
                        />
                        {loginError && <p className="login-error">{loginError}</p>}
                        <button type="submit" className="btn btn-primary admin-login-btn">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <h2>🛡️ Admin</h2>
                </div>
                <nav className="sidebar-nav">
                    <button
                        className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <TrendingUp size={20} />
                        Dashboard
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        <Package size={20} />
                        Orders
                    </button>
                </nav>
                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={20} />
                    Logout
                </button>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                {/* Header */}
                <header className="admin-header">
                    <h1>{activeTab === 'dashboard' ? '📊 Sales Analytics' : '📦 Order Management'}</h1>
                    <button className="refresh-btn" onClick={fetchOrders} disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                        Refresh
                    </button>
                </header>

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && (
                    <div className="dashboard-content">
                        {/* Stats Cards */}
                        <div className="stats-grid">
                            <div className="stat-card revenue">
                                <div className="stat-icon">
                                    <DollarSign size={24} />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-label">Total Revenue</span>
                                    <span className="stat-value">₹{analytics.totalRevenue.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="stat-card orders">
                                <div className="stat-icon">
                                    <ShoppingCart size={24} />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-label">Total Orders</span>
                                    <span className="stat-value">{analytics.totalOrders}</span>
                                </div>
                            </div>

                            <div className="stat-card today">
                                <div className="stat-icon">
                                    <Calendar size={24} />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-label">Today's Orders</span>
                                    <span className="stat-value">{analytics.todayOrders}</span>
                                </div>
                            </div>

                            <div className="stat-card today-revenue">
                                <div className="stat-icon">
                                    <TrendingUp size={24} />
                                </div>
                                <div className="stat-info">
                                    <span className="stat-label">Today's Revenue</span>
                                    <span className="stat-value">₹{analytics.todayRevenue.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Order Status Summary */}
                        <div className="status-summary">
                            <h3>Order Status</h3>
                            <div className="status-bars">
                                <div className="status-bar-item">
                                    <div className="status-bar-label">
                                        <span className="status-dot pending"></span>
                                        Pending
                                    </div>
                                    <div className="status-bar-value">{analytics.pendingOrders}</div>
                                </div>
                                <div className="status-bar-item">
                                    <div className="status-bar-label">
                                        <span className="status-dot completed"></span>
                                        Completed
                                    </div>
                                    <div className="status-bar-value">{analytics.completedOrders}</div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="recent-orders">
                            <h3>Recent Orders</h3>
                            <div className="orders-table-wrapper">
                                <table className="orders-table">
                                    <thead>
                                        <tr>
                                            <th>Order #</th>
                                            <th>Customer</th>
                                            <th>Items</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.slice(0, 5).map(order => (
                                            <tr key={order.id || order.orderNumber}>
                                                <td className="order-num">{order.orderNumber}</td>
                                                <td>{order.minecraftUsername}</td>
                                                <td>{order.items?.length || 0} items</td>
                                                <td className="order-total">{order.totalDisplay}</td>
                                                <td>
                                                    <span className={`status-badge ${order.status}`}>
                                                        {getStatusIcon(order.status)}
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td>{formatDate(order.createdAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <div className="orders-content">
                        {/* Filters */}
                        <div className="orders-filters">
                            <Filter size={18} />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Orders</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                            <span className="filter-count">{filteredOrders.length} orders</span>
                        </div>

                        {/* Orders List */}
                        <div className="orders-list-admin">
                            {filteredOrders.map(order => (
                                <div key={order.id || order.orderNumber} className="admin-order-card">
                                    <div className="order-card-header">
                                        <div className="order-main-info">
                                            <span className="order-number">{order.orderNumber}</span>
                                            <span className="order-date">{formatDate(order.createdAt)}</span>
                                        </div>
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.id || order.orderNumber, e.target.value)}
                                            className={`status-select ${order.status}`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="processing">Processing</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>

                                    <div className="order-card-body">
                                        <div className="order-customer">
                                            <p><strong>🎮 Username:</strong> {order.minecraftUsername}</p>
                                            <p><strong>📧 Email:</strong> {order.email || 'N/A'}</p>
                                            <p><strong>🎯 Platform:</strong> {order.platform || 'Java'}</p>
                                        </div>
                                        <div className="order-items-list">
                                            <strong>📦 Items:</strong>
                                            {order.items?.map((item, idx) => (
                                                <div key={idx} className="item-row">
                                                    {item.name} × {item.quantity} = ₹{item.subtotal}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="order-card-footer">
                                        {order.couponInfo?.couponCode && (
                                            <span className="coupon-info">
                                                🎁 {order.couponInfo.couponCode} (-₹{order.couponInfo.discount})
                                            </span>
                                        )}
                                        <span className="order-total-badge">{order.totalDisplay}</span>
                                    </div>
                                </div>
                            ))}

                            {filteredOrders.length === 0 && (
                                <div className="no-orders-admin">
                                    <Package size={48} />
                                    <p>No orders found</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Admin;
