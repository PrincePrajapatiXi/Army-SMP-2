import React, { useState, useEffect, useRef } from 'react';
import {
    Lock, LogOut, Package, TrendingUp, DollarSign,
    ShoppingCart, CheckCircle, XCircle, AlertCircle,
    Calendar, Filter, RefreshCw, Trash2, BarChart3
} from 'lucide-react';
import './Admin.css';

const API_BASE_URL = 'https://army-smp-2.onrender.com/api';

const Admin = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const chartRef = useRef(null);
    const pieChartRef = useRef(null);

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

    // Initialize charts when orders change
    useEffect(() => {
        if (isAuthenticated && orders.length > 0 && activeTab === 'dashboard') {
            initCharts();
        }
    }, [orders, isAuthenticated, activeTab]);

    // Secure Login via Backend API
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError('');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (data.success) {
                setIsAuthenticated(true);
                sessionStorage.setItem('adminAuth', 'true');
                setLoginError('');
            } else {
                setLoginError(data.error || 'Invalid password');
            }
        } catch (error) {
            console.error('Login error:', error);
            setLoginError('Login failed. Please try again.');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('adminAuth');
        setSelectedOrders([]);
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
            fetchOrders();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    // Bulk Delete Functions
    const toggleSelectOrder = (orderId) => {
        setSelectedOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map(o => o.id || o.orderNumber));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedOrders.length === 0) return;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/orders/bulk`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderIds: selectedOrders })
            });

            const data = await response.json();
            if (data.success) {
                setSelectedOrders([]);
                setShowDeleteConfirm(false);
                fetchOrders();
            }
        } catch (error) {
            console.error('Bulk delete error:', error);
        }
    };

    // Charts initialization
    const initCharts = () => {
        // Load Chart.js if not loaded
        if (!window.Chart) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => setTimeout(renderCharts, 100);
            document.head.appendChild(script);
        } else {
            renderCharts();
        }
    };

    const renderCharts = () => {
        if (!window.Chart) return;

        // Destroy existing charts
        if (chartRef.current?.chartInstance) {
            chartRef.current.chartInstance.destroy();
        }
        if (pieChartRef.current?.chartInstance) {
            pieChartRef.current.chartInstance.destroy();
        }

        // Revenue Chart - Last 7 days
        const revenueCtx = document.getElementById('revenueChart');
        if (revenueCtx) {
            const last7Days = [];
            const revenueData = [];

            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                last7Days.push(dateStr);

                const dayRevenue = orders
                    .filter(o => {
                        const orderDate = new Date(o.createdAt);
                        return orderDate.toDateString() === date.toDateString();
                    })
                    .reduce((sum, o) => sum + (o.total || 0), 0);
                revenueData.push(dayRevenue);
            }

            chartRef.current = {
                chartInstance: new window.Chart(revenueCtx, {
                    type: 'line',
                    data: {
                        labels: last7Days,
                        datasets: [{
                            label: 'Revenue (₹)',
                            data: revenueData,
                            borderColor: '#ff6b35',
                            backgroundColor: 'rgba(255, 107, 53, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: '#ff6b35',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 5
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: { color: 'rgba(255,255,255,0.1)' },
                                ticks: { color: '#888' }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { color: '#888' }
                            }
                        }
                    }
                })
            };
        }

        // Status Pie Chart
        const pieCtx = document.getElementById('statusPieChart');
        if (pieCtx) {
            const statusData = [
                orders.filter(o => o.status === 'pending').length,
                orders.filter(o => o.status === 'completed').length,
                orders.filter(o => o.status === 'cancelled').length
            ];

            pieChartRef.current = {
                chartInstance: new window.Chart(pieCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Pending', 'Completed', 'Cancelled'],
                        datasets: [{
                            data: statusData,
                            backgroundColor: ['#ffaa00', '#22c55e', '#ef4444'],
                            borderWidth: 0,
                            hoverOffset: 10
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: { color: '#ccc', padding: 15 }
                            }
                        },
                        cutout: '60%'
                    }
                })
            };
        }
    };

    // Helper functions
    const getISTDateString = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    const todayIST = getISTDateString(new Date());

    const analytics = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, o) => sum + (o.total || 0), 0),
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
        todayOrders: orders.filter(o => getISTDateString(o.createdAt) === todayIST).length,
        todayRevenue: orders
            .filter(o => getISTDateString(o.createdAt) === todayIST)
            .reduce((sum, o) => sum + (o.total || 0), 0)
    };

    const filteredOrders = statusFilter === 'all'
        ? orders
        : orders.filter(o => o.status === statusFilter);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle size={16} />;
            case 'cancelled': return <XCircle size={16} />;
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
                            disabled={loginLoading}
                        />
                        {loginError && <p className="login-error">{loginError}</p>}
                        <button
                            type="submit"
                            className="btn btn-primary admin-login-btn"
                            disabled={loginLoading}
                        >
                            {loginLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page">
            {/* Mobile Bottom Nav */}
            <nav className="admin-mobile-nav">
                <button
                    className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <BarChart3 size={20} />
                    <span>Dashboard</span>
                </button>
                <button
                    className={`mobile-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                >
                    <Package size={20} />
                    <span>Orders</span>
                </button>
                <button className="mobile-nav-item logout" onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </nav>

            {/* Sidebar - Desktop */}
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
                        <span>Dashboard</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === 'orders' ? 'active' : ''}`}
                        onClick={() => setActiveTab('orders')}
                    >
                        <Package size={20} />
                        <span>Orders</span>
                    </button>
                </nav>
                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                {/* Header */}
                <header className="admin-header">
                    <h1>{activeTab === 'dashboard' ? '📊 Sales Analytics' : '📦 Order Management'}</h1>
                    <button className="refresh-btn" onClick={fetchOrders} disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                        <span>Refresh</span>
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

                        {/* Charts Section */}
                        <div className="charts-section">
                            <div className="chart-card">
                                <h3>📈 Revenue (Last 7 Days)</h3>
                                <div className="chart-container">
                                    <canvas id="revenueChart"></canvas>
                                </div>
                            </div>
                            <div className="chart-card pie-chart-card">
                                <h3>📊 Order Status</h3>
                                <div className="chart-container pie-container">
                                    <canvas id="statusPieChart"></canvas>
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
                                <div className="status-bar-item">
                                    <div className="status-bar-label">
                                        <span className="status-dot cancelled"></span>
                                        Cancelled
                                    </div>
                                    <div className="status-bar-value">{analytics.cancelledOrders}</div>
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
                        {/* Filters & Bulk Actions */}
                        <div className="orders-toolbar">
                            <div className="orders-filters">
                                <Filter size={18} />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="all">All Orders</option>
                                    <option value="pending">Pending</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <span className="filter-count">{filteredOrders.length} orders</span>
                            </div>

                            {/* Bulk Actions */}
                            <div className="bulk-actions">
                                <label className="select-all-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                    <span>Select All</span>
                                </label>
                                {selectedOrders.length > 0 && (
                                    <button
                                        className="bulk-delete-btn"
                                        onClick={() => setShowDeleteConfirm(true)}
                                    >
                                        <Trash2 size={16} />
                                        Delete ({selectedOrders.length})
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Delete Confirmation Modal */}
                        {showDeleteConfirm && (
                            <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                                <div className="modal-content" onClick={e => e.stopPropagation()}>
                                    <h3>⚠️ Confirm Delete</h3>
                                    <p>Are you sure you want to delete {selectedOrders.length} order(s)?</p>
                                    <p className="warning-text">This action cannot be undone!</p>
                                    <div className="modal-actions">
                                        <button
                                            className="btn-cancel"
                                            onClick={() => setShowDeleteConfirm(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={handleBulkDelete}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Orders List */}
                        <div className="orders-list-admin">
                            {filteredOrders.map(order => (
                                <div
                                    key={order.id || order.orderNumber}
                                    className={`admin-order-card ${selectedOrders.includes(order.id || order.orderNumber) ? 'selected' : ''}`}
                                >
                                    <div className="order-card-header">
                                        <div className="order-select-info">
                                            <input
                                                type="checkbox"
                                                checked={selectedOrders.includes(order.id || order.orderNumber)}
                                                onChange={() => toggleSelectOrder(order.id || order.orderNumber)}
                                                className="order-checkbox"
                                            />
                                            <div className="order-main-info">
                                                <span className="order-number">{order.orderNumber}</span>
                                                <span className="order-date">{formatDate(order.createdAt)}</span>
                                            </div>
                                        </div>
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.id || order.orderNumber, e.target.value)}
                                            className={`status-select ${order.status}`}
                                        >
                                            <option value="pending">Pending</option>
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
