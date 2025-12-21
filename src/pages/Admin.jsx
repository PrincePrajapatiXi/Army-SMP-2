import React, { useState, useEffect, useRef } from 'react';
import {
    Lock, LogOut, Package, TrendingUp, DollarSign,
    ShoppingCart, CheckCircle, XCircle, AlertCircle,
    Calendar, Filter, RefreshCw, Trash2, BarChart3, X,
    Box, Edit, Plus, Image, Search, Ticket, ToggleLeft, ToggleRight
} from 'lucide-react';
import './Admin.css';

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://army-smp-2.onrender.com/api';

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
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [chartPeriod, setChartPeriod] = useState('week');
    const chartRef = useRef(null);
    const pieChartRef = useRef(null);

    // Product Management State
    const [products, setProducts] = useState([]);
    const [showProductModal, setShowProductModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productLoading, setProductLoading] = useState(false);
    const [showProductDeleteConfirm, setShowProductDeleteConfirm] = useState(null);
    const [productForm, setProductForm] = useState({
        name: '',
        price: '',
        category: 'ranks',
        image: '/images/stone.png',
        description: '',
        color: '#ffffff',
        features: ''
    });

    // Order Search State
    const [orderSearch, setOrderSearch] = useState('');

    // Coupon Management State
    const [coupons, setCoupons] = useState([]);
    const [couponLoading, setCouponLoading] = useState(false);
    const [showCouponModal, setShowCouponModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [showCouponDeleteConfirm, setShowCouponDeleteConfirm] = useState(null);
    const [couponForm, setCouponForm] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: '',
        maxDiscount: '',
        usageLimit: '',
        expiresAt: ''
    });

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
            fetchProducts();
            fetchCoupons();
        }
    }, [isAuthenticated]);

    // Initialize charts when orders or period change
    useEffect(() => {
        if (isAuthenticated && orders.length > 0 && activeTab === 'dashboard') {
            initCharts();
        }
    }, [orders, isAuthenticated, activeTab, chartPeriod]);

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

    // ==================== PRODUCT MANAGEMENT FUNCTIONS ====================

    const fetchProducts = async () => {
        setProductLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/products`);
            const data = await response.json();
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setProductLoading(false);
        }
    };

    const resetProductForm = () => {
        setProductForm({
            name: '',
            price: '',
            category: 'ranks',
            image: '/images/stone.png',
            description: '',
            color: '#ffffff',
            features: ''
        });
        setEditingProduct(null);
    };

    const openAddModal = () => {
        resetProductForm();
        setShowProductModal(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name,
            price: product.price.toString(),
            category: product.category,
            image: product.image,
            description: product.description || '',
            color: product.color || '#ffffff',
            features: (product.features || []).join(', ')
        });
        setShowProductModal(true);
    };

    const handleProductSubmit = async (e) => {
        e.preventDefault();
        setProductLoading(true);

        const productData = {
            name: productForm.name,
            price: parseFloat(productForm.price),
            category: productForm.category,
            image: productForm.image,
            description: productForm.description,
            color: productForm.color,
            features: productForm.features.split(',').map(f => f.trim()).filter(f => f)
        };

        try {
            const url = editingProduct
                ? `${API_BASE_URL}/admin/products/${editingProduct.id}`
                : `${API_BASE_URL}/admin/products`;

            const response = await fetch(url, {
                method: editingProduct ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });

            const data = await response.json();

            if (data.success) {
                setShowProductModal(false);
                resetProductForm();
                fetchProducts();
            } else {
                alert(data.error || 'Failed to save product');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product');
        } finally {
            setProductLoading(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                setShowProductDeleteConfirm(null);
                fetchProducts();
            } else {
                alert(data.error || 'Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete product');
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

    // ==================== COUPON MANAGEMENT FUNCTIONS ====================

    const fetchCoupons = async () => {
        setCouponLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/coupons`);
            const data = await response.json();
            setCoupons(data || []);
        } catch (error) {
            console.error('Error fetching coupons:', error);
        } finally {
            setCouponLoading(false);
        }
    };

    const resetCouponForm = () => {
        setCouponForm({
            code: '',
            discountType: 'percentage',
            discountValue: '',
            minOrderAmount: '',
            maxDiscount: '',
            usageLimit: '',
            expiresAt: ''
        });
        setEditingCoupon(null);
    };

    const openAddCouponModal = () => {
        resetCouponForm();
        setShowCouponModal(true);
    };

    const openEditCouponModal = (coupon) => {
        setEditingCoupon(coupon);
        setCouponForm({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue.toString(),
            minOrderAmount: coupon.minOrderAmount?.toString() || '',
            maxDiscount: coupon.maxDiscount?.toString() || '',
            usageLimit: coupon.usageLimit?.toString() || '',
            expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : ''
        });
        setShowCouponModal(true);
    };

    const handleCouponSubmit = async (e) => {
        e.preventDefault();
        setCouponLoading(true);

        const couponData = {
            code: couponForm.code,
            discountType: couponForm.discountType,
            discountValue: parseFloat(couponForm.discountValue),
            minOrderAmount: couponForm.minOrderAmount ? parseFloat(couponForm.minOrderAmount) : 0,
            maxDiscount: couponForm.maxDiscount ? parseFloat(couponForm.maxDiscount) : null,
            usageLimit: couponForm.usageLimit ? parseInt(couponForm.usageLimit) : null,
            expiresAt: couponForm.expiresAt || null
        };

        try {
            const url = editingCoupon
                ? `${API_BASE_URL}/admin/coupons/${editingCoupon._id}`
                : `${API_BASE_URL}/admin/coupons`;

            const response = await fetch(url, {
                method: editingCoupon ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(couponData)
            });

            const data = await response.json();

            if (data.success) {
                setShowCouponModal(false);
                resetCouponForm();
                fetchCoupons();
            } else {
                alert(data.error || 'Failed to save coupon');
            }
        } catch (error) {
            console.error('Error saving coupon:', error);
            alert('Failed to save coupon');
        } finally {
            setCouponLoading(false);
        }
    };

    const handleDeleteCoupon = async (couponId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/coupons/${couponId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                setShowCouponDeleteConfirm(null);
                fetchCoupons();
            } else {
                alert(data.error || 'Failed to delete coupon');
            }
        } catch (error) {
            console.error('Error deleting coupon:', error);
            alert('Failed to delete coupon');
        }
    };

    const toggleCouponActive = async (couponId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/coupons/${couponId}/toggle`, {
                method: 'PUT'
            });

            const data = await response.json();

            if (data.success) {
                fetchCoupons();
            } else {
                alert(data.error || 'Failed to toggle coupon');
            }
        } catch (error) {
            console.error('Error toggling coupon:', error);
            alert('Failed to toggle coupon');
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

        // Revenue Chart - Based on selected period
        const revenueCtx = document.getElementById('revenueChart');
        if (revenueCtx) {
            const labels = [];
            const revenueData = [];

            // Get date range based on period
            const getPeriodData = () => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                switch (chartPeriod) {
                    case 'today':
                        // Hourly data for today
                        for (let hour = 0; hour <= 23; hour++) {
                            labels.push(`${hour}:00`);
                            const hourRevenue = orders
                                .filter(o => {
                                    const orderDate = new Date(o.createdAt);
                                    return orderDate.toDateString() === today.toDateString()
                                        && orderDate.getHours() === hour
                                        && o.status !== 'cancelled';
                                })
                                .reduce((sum, o) => sum + (o.total || 0), 0);
                            revenueData.push(hourRevenue);
                        }
                        break;

                    case 'week':
                        // Last 7 days
                        for (let i = 6; i >= 0; i--) {
                            const date = new Date();
                            date.setDate(date.getDate() - i);
                            labels.push(date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }));
                            const dayRevenue = orders
                                .filter(o => {
                                    const orderDate = new Date(o.createdAt);
                                    return orderDate.toDateString() === date.toDateString() && o.status !== 'cancelled';
                                })
                                .reduce((sum, o) => sum + (o.total || 0), 0);
                            revenueData.push(dayRevenue);
                        }
                        break;

                    case 'month':
                        // Last 30 days (grouped by week)
                        for (let i = 3; i >= 0; i--) {
                            const weekEnd = new Date();
                            weekEnd.setDate(weekEnd.getDate() - (i * 7));
                            const weekStart = new Date(weekEnd);
                            weekStart.setDate(weekStart.getDate() - 6);

                            labels.push(`${weekStart.getDate()}/${weekStart.getMonth() + 1} - ${weekEnd.getDate()}/${weekEnd.getMonth() + 1}`);

                            const weekRevenue = orders
                                .filter(o => {
                                    const orderDate = new Date(o.createdAt);
                                    orderDate.setHours(0, 0, 0, 0);
                                    return orderDate >= weekStart && orderDate <= weekEnd && o.status !== 'cancelled';
                                })
                                .reduce((sum, o) => sum + (o.total || 0), 0);
                            revenueData.push(weekRevenue);
                        }
                        break;

                    case 'year':
                        // Last 12 months
                        for (let i = 11; i >= 0; i--) {
                            const date = new Date();
                            date.setMonth(date.getMonth() - i);
                            labels.push(date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }));

                            const monthRevenue = orders
                                .filter(o => {
                                    const orderDate = new Date(o.createdAt);
                                    return orderDate.getMonth() === date.getMonth()
                                        && orderDate.getFullYear() === date.getFullYear()
                                        && o.status !== 'cancelled';
                                })
                                .reduce((sum, o) => sum + (o.total || 0), 0);
                            revenueData.push(monthRevenue);
                        }
                        break;
                }
            };

            getPeriodData();

            chartRef.current = {
                chartInstance: new window.Chart(revenueCtx, {
                    type: 'line',
                    data: {
                        labels: labels,
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
                            pointRadius: chartPeriod === 'today' ? 3 : 5
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
                                ticks: {
                                    color: '#888',
                                    maxRotation: chartPeriod === 'today' ? 0 : 45,
                                    font: { size: chartPeriod === 'today' ? 9 : 11 }
                                }
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
        totalRevenue: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.total || 0), 0),
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
        todayOrders: orders.filter(o => getISTDateString(o.createdAt) === todayIST).length,
        todayRevenue: orders
            .filter(o => getISTDateString(o.createdAt) === todayIST && o.status !== 'cancelled')
            .reduce((sum, o) => sum + (o.total || 0), 0)
    };

    // Filter orders by status, date range, and search
    const filteredOrders = orders.filter(o => {
        // Search filter
        if (orderSearch.trim()) {
            const searchLower = orderSearch.toLowerCase().trim();
            const matchesSearch =
                o.orderNumber?.toLowerCase().includes(searchLower) ||
                o.minecraftUsername?.toLowerCase().includes(searchLower) ||
                o.email?.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
        }

        // Status filter
        if (statusFilter !== 'all' && o.status !== statusFilter) return false;

        // Date range filter
        if (startDate || endDate) {
            const orderDate = new Date(o.createdAt);
            orderDate.setHours(0, 0, 0, 0);

            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (orderDate < start) return false;
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (orderDate > end) return false;
            }
        }

        return true;
    });

    const clearDateFilter = () => {
        setStartDate('');
        setEndDate('');
    };

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
                <button
                    className={`mobile-nav-item ${activeTab === 'products' ? 'active' : ''}`}
                    onClick={() => setActiveTab('products')}
                >
                    <Box size={20} />
                    <span>Products</span>
                </button>
                <button
                    className={`mobile-nav-item ${activeTab === 'coupons' ? 'active' : ''}`}
                    onClick={() => setActiveTab('coupons')}
                >
                    <Ticket size={20} />
                    <span>Coupons</span>
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
                    <button
                        className={`sidebar-item ${activeTab === 'products' ? 'active' : ''}`}
                        onClick={() => setActiveTab('products')}
                    >
                        <Box size={20} />
                        <span>Products</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === 'coupons' ? 'active' : ''}`}
                        onClick={() => setActiveTab('coupons')}
                    >
                        <Ticket size={20} />
                        <span>Coupons</span>
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
                    <h1>
                        {activeTab === 'dashboard' && '📊 Sales Analytics'}
                        {activeTab === 'orders' && '📦 Order Management'}
                        {activeTab === 'products' && '🛍️ Product Management'}
                        {activeTab === 'coupons' && '🎟️ Coupon Management'}
                    </h1>
                    <button
                        className="refresh-btn"
                        onClick={() => { fetchOrders(); fetchProducts(); fetchCoupons(); }}
                        disabled={loading || productLoading || couponLoading}
                    >
                        <RefreshCw size={18} className={(loading || productLoading || couponLoading) ? 'spinning' : ''} />
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
                                <div className="chart-header">
                                    <h3>📈 Revenue</h3>
                                    <div className="period-selector">
                                        <button
                                            className={`period-btn ${chartPeriod === 'today' ? 'active' : ''}`}
                                            onClick={() => setChartPeriod('today')}
                                        >Today</button>
                                        <button
                                            className={`period-btn ${chartPeriod === 'week' ? 'active' : ''}`}
                                            onClick={() => setChartPeriod('week')}
                                        >Week</button>
                                        <button
                                            className={`period-btn ${chartPeriod === 'month' ? 'active' : ''}`}
                                            onClick={() => setChartPeriod('month')}
                                        >Month</button>
                                        <button
                                            className={`period-btn ${chartPeriod === 'year' ? 'active' : ''}`}
                                            onClick={() => setChartPeriod('year')}
                                        >Year</button>
                                    </div>
                                </div>
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
                                                <td className="order-num" data-label="Order #">{order.orderNumber}</td>
                                                <td data-label="Customer">{order.minecraftUsername}</td>
                                                <td data-label="Items">{order.items?.length || 0} items</td>
                                                <td className="order-total" data-label="Total">{order.totalDisplay}</td>
                                                <td data-label="Status">
                                                    <span className={`status-badge ${order.status}`}>
                                                        {getStatusIcon(order.status)}
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td data-label="Date">{formatDate(order.createdAt)}</td>
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
                                {/* Search Box */}
                                <div className="order-search-box">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search orders..."
                                        value={orderSearch}
                                        onChange={(e) => setOrderSearch(e.target.value)}
                                        className="search-input"
                                    />
                                    {orderSearch && (
                                        <button
                                            className="clear-search-btn"
                                            onClick={() => setOrderSearch('')}
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

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

                                {/* Date Range Filter */}
                                <div className="date-filter">
                                    <Calendar size={16} />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="date-input"
                                        placeholder="From"
                                    />
                                    <span className="date-separator">to</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="date-input"
                                        placeholder="To"
                                    />
                                    {(startDate || endDate) && (
                                        <button className="clear-date-btn" onClick={clearDateFilter}>
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

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

                {/* Products Tab */}
                {activeTab === 'products' && (
                    <div className="products-content">
                        {/* Products Toolbar */}
                        <div className="products-toolbar">
                            <div className="products-info">
                                <Box size={18} />
                                <span>{products.length} products</span>
                            </div>
                            <button className="add-product-btn" onClick={openAddModal}>
                                <Plus size={18} />
                                <span>Add Product</span>
                            </button>
                        </div>

                        {/* Products Grid */}
                        <div className="products-grid">
                            {products.map(product => (
                                <div key={product.id} className="admin-product-card">
                                    <div className="product-card-image">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            onError={(e) => { e.target.src = '/images/stone.png'; }}
                                        />
                                        <div
                                            className="product-color-badge"
                                            style={{ backgroundColor: product.color }}
                                        />
                                    </div>
                                    <div className="product-card-info">
                                        <h4>{product.name}</h4>
                                        <span className="product-category">{product.category}</span>
                                        <span className="product-price">{product.priceDisplay}</span>
                                    </div>
                                    <div className="product-card-actions">
                                        <button
                                            className="edit-btn"
                                            onClick={() => openEditModal(product)}
                                        >
                                            <Edit size={16} />
                                            Edit
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => setShowProductDeleteConfirm(product.id)}
                                        >
                                            <Trash2 size={16} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {products.length === 0 && (
                            <div className="no-products-admin">
                                <Box size={48} />
                                <p>No products found</p>
                                <button className="add-product-btn" onClick={openAddModal}>
                                    <Plus size={18} />
                                    <span>Add First Product</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Coupons Tab */}
                {activeTab === 'coupons' && (
                    <div className="coupons-content">
                        {/* Coupons Toolbar */}
                        <div className="coupons-toolbar">
                            <div className="coupons-info">
                                <Ticket size={18} />
                                <span>{coupons.length} coupons</span>
                            </div>
                            <button className="add-coupon-btn" onClick={openAddCouponModal}>
                                <Plus size={18} />
                                <span>Add Coupon</span>
                            </button>
                        </div>

                        {/* Coupons Grid */}
                        <div className="coupons-grid">
                            {coupons.map(coupon => (
                                <div key={coupon._id} className={`coupon-card ${!coupon.isActive ? 'inactive' : ''}`}>
                                    <div className="coupon-card-header">
                                        <span className="coupon-code">{coupon.code}</span>
                                        <button
                                            className={`toggle-btn ${coupon.isActive ? 'active' : ''}`}
                                            onClick={() => toggleCouponActive(coupon._id)}
                                            title={coupon.isActive ? 'Deactivate' : 'Activate'}
                                        >
                                            {coupon.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                        </button>
                                    </div>
                                    <div className="coupon-card-body">
                                        <div className="coupon-discount">
                                            {coupon.discountType === 'percentage'
                                                ? `${coupon.discountValue}% OFF`
                                                : `₹${coupon.discountValue} OFF`
                                            }
                                        </div>
                                        <div className="coupon-details">
                                            {coupon.minOrderAmount > 0 && (
                                                <span>Min: ₹{coupon.minOrderAmount}</span>
                                            )}
                                            {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                                                <span>Max: ₹{coupon.maxDiscount}</span>
                                            )}
                                            {coupon.usageLimit && (
                                                <span>Uses: {coupon.usedCount}/{coupon.usageLimit}</span>
                                            )}
                                            {!coupon.usageLimit && (
                                                <span>Uses: {coupon.usedCount}/∞</span>
                                            )}
                                        </div>
                                        {coupon.expiresAt && (
                                            <div className="coupon-expiry">
                                                Expires: {new Date(coupon.expiresAt).toLocaleDateString('en-IN')}
                                            </div>
                                        )}
                                    </div>
                                    <div className="coupon-card-actions">
                                        <button
                                            className="edit-btn"
                                            onClick={() => openEditCouponModal(coupon)}
                                        >
                                            <Edit size={16} />
                                            Edit
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => setShowCouponDeleteConfirm(coupon._id)}
                                        >
                                            <Trash2 size={16} />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {coupons.length === 0 && (
                            <div className="no-coupons-admin">
                                <Ticket size={48} />
                                <p>No coupons found</p>
                                <button className="add-coupon-btn" onClick={openAddCouponModal}>
                                    <Plus size={18} />
                                    <span>Create First Coupon</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Product Add/Edit Modal */}
                {showProductModal && (
                    <div className="modal-overlay" onClick={() => { setShowProductModal(false); resetProductForm(); }}>
                        <div className="product-modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}</h3>
                                <button
                                    className="modal-close-btn"
                                    onClick={() => { setShowProductModal(false); resetProductForm(); }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleProductSubmit} className="product-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Product Name *</label>
                                        <input
                                            type="text"
                                            value={productForm.name}
                                            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                                            placeholder="e.g., Diamond Rank"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Price (₹) *</label>
                                        <input
                                            type="number"
                                            value={productForm.price}
                                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                                            placeholder="e.g., 100"
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Category *</label>
                                        <select
                                            value={productForm.category}
                                            onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                                            required
                                        >
                                            <option value="ranks">Ranks</option>
                                            <option value="keys">Keys</option>
                                            <option value="coins">Coins</option>
                                            <option value="items">Items</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Color</label>
                                        <div className="color-input-wrapper">
                                            <input
                                                type="color"
                                                value={productForm.color}
                                                onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
                                                className="color-picker"
                                            />
                                            <input
                                                type="text"
                                                value={productForm.color}
                                                onChange={(e) => setProductForm({ ...productForm, color: e.target.value })}
                                                placeholder="#ffffff"
                                                className="color-text"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Image Path</label>
                                    <div className="image-input-wrapper">
                                        <Image size={18} />
                                        <input
                                            type="text"
                                            value={productForm.image}
                                            onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                                            placeholder="/images/stone.png"
                                        />
                                    </div>
                                    <small className="form-hint">Use: /images/stone.png, /images/Beacon.png, or /images/bedrock.png</small>
                                </div>

                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={productForm.description}
                                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                                        placeholder="Brief description of the product..."
                                        rows={3}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Features (comma separated)</label>
                                    <textarea
                                        value={productForm.features}
                                        onChange={(e) => setProductForm({ ...productForm, features: e.target.value })}
                                        placeholder="Feature 1, Feature 2, Feature 3..."
                                        rows={2}
                                    />
                                </div>

                                <div className="modal-form-actions">
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={() => { setShowProductModal(false); resetProductForm(); }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-save"
                                        disabled={productLoading}
                                    >
                                        {productLoading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Product Delete Confirmation Modal */}
                {showProductDeleteConfirm && (
                    <div className="modal-overlay" onClick={() => setShowProductDeleteConfirm(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3>⚠️ Delete Product</h3>
                            <p>Are you sure you want to delete this product?</p>
                            <p className="warning-text">This action cannot be undone!</p>
                            <div className="modal-actions">
                                <button
                                    className="btn-cancel"
                                    onClick={() => setShowProductDeleteConfirm(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-delete"
                                    onClick={() => handleDeleteProduct(showProductDeleteConfirm)}
                                >
                                    Delete Product
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Coupon Add/Edit Modal */}
                {showCouponModal && (
                    <div className="modal-overlay" onClick={() => { setShowCouponModal(false); resetCouponForm(); }}>
                        <div className="coupon-modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>{editingCoupon ? '✏️ Edit Coupon' : '➕ Add New Coupon'}</h3>
                                <button
                                    className="modal-close-btn"
                                    onClick={() => { setShowCouponModal(false); resetCouponForm(); }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCouponSubmit} className="coupon-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Coupon Code *</label>
                                        <input
                                            type="text"
                                            value={couponForm.code}
                                            onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                                            placeholder="e.g., SAVE20"
                                            required
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Discount Type *</label>
                                        <select
                                            value={couponForm.discountType}
                                            onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                                            required
                                        >
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount (₹)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Discount Value *</label>
                                        <input
                                            type="number"
                                            value={couponForm.discountValue}
                                            onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                                            placeholder={couponForm.discountType === 'percentage' ? 'e.g., 20' : 'e.g., 50'}
                                            min="1"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Min Order Amount</label>
                                        <input
                                            type="number"
                                            value={couponForm.minOrderAmount}
                                            onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })}
                                            placeholder="0 = No minimum"
                                            min="0"
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    {couponForm.discountType === 'percentage' && (
                                        <div className="form-group">
                                            <label>Max Discount (₹)</label>
                                            <input
                                                type="number"
                                                value={couponForm.maxDiscount}
                                                onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })}
                                                placeholder="Leave empty for no cap"
                                                min="1"
                                            />
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label>Usage Limit</label>
                                        <input
                                            type="number"
                                            value={couponForm.usageLimit}
                                            onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                                            placeholder="Leave empty for unlimited"
                                            min="1"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Expiry Date</label>
                                    <input
                                        type="date"
                                        value={couponForm.expiresAt}
                                        onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                                    />
                                    <small className="form-hint">Leave empty for no expiry</small>
                                </div>

                                <div className="modal-form-actions">
                                    <button
                                        type="button"
                                        className="btn-cancel"
                                        onClick={() => { setShowCouponModal(false); resetCouponForm(); }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-save"
                                        disabled={couponLoading}
                                    >
                                        {couponLoading ? 'Saving...' : (editingCoupon ? 'Update Coupon' : 'Add Coupon')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Coupon Delete Confirmation Modal */}
                {showCouponDeleteConfirm && (
                    <div className="modal-overlay" onClick={() => setShowCouponDeleteConfirm(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <h3>⚠️ Delete Coupon</h3>
                            <p>Are you sure you want to delete this coupon?</p>
                            <p className="warning-text">This action cannot be undone!</p>
                            <div className="modal-actions">
                                <button
                                    className="btn-cancel"
                                    onClick={() => setShowCouponDeleteConfirm(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="btn-delete"
                                    onClick={() => handleDeleteCoupon(showCouponDeleteConfirm)}
                                >
                                    Delete Coupon
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Admin;
