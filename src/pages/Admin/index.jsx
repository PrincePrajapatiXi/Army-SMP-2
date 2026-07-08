import React, { useState, useEffect } from 'react';
import {
    LogOut, Package, TrendingUp, Box, Ticket, Megaphone,
    RefreshCw, BarChart3, Users, Star, Award, ShieldAlert, History
} from 'lucide-react';
import './Admin.css';

// Hooks
import useOrders from './hooks/useOrders';
import { API_BASE_URL } from '../../services/api';
import useProducts from './hooks/useProducts';
import useCoupons from './hooks/useCoupons';
import usePromotions from './hooks/usePromotions';
import useUsers from './hooks/useUsers';

// Components
import AdminLogin from './AdminLogin';
import Dashboard from './components/Dashboard';
import OrdersTab from './components/OrdersTab';
import ProductsTab from './components/ProductsTab';
import CouponsTab from './components/CouponsTab';
import PromotionsTab from './components/PromotionsTab';
import UsersTab from './components/UsersTab';
import FeaturedRanksTab from './components/FeaturedRanksTab';
import BadgesTab from './components/BadgesTab';
import FirewallPanel from './components/FirewallPanel';
import AuditLogsTab from './components/AuditLogsTab';

const Admin = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');

    // Custom Hooks
    const ordersHook = useOrders();
    const productsHook = useProducts();
    const couponsHook = useCoupons();
    const promotionsHook = usePromotions();
    const usersHook = useUsers();

    // Check if already logged in
    useEffect(() => {
        const adminAuth = sessionStorage.getItem('adminAuth_v2');
        const adminToken = sessionStorage.getItem('adminToken');
        // Need both the auth flag AND the token for valid authentication
        if (adminAuth === 'true' && adminToken) {
            setIsAuthenticated(true);
        } else {
            // Clear partial auth state
            sessionStorage.removeItem('adminAuth_v2');
            sessionStorage.removeItem('adminToken');
        }
    }, []);

    // Fetch data when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            // Verify session is not banned
            const verifySession = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/admin/users`, {
                        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}` }
                    });
                    if (response.status === 403) {
                        const data = await response.json();
                        if (data.banned) {
                            sessionStorage.removeItem('adminAuth_v2');
                            sessionStorage.removeItem('adminToken');
                            window.location.reload();
                            return;
                        }
                    }
                } catch (e) {
                    console.error('Ban check failed', e);
                }
                
                // If not banned, fetch all data
                ordersHook.fetchOrders();
                productsHook.fetchProducts();
                couponsHook.fetchCoupons();
                promotionsHook.fetchPromotions();
                usersHook.fetchUsers();
            };
            verifySession();
        }
    }, [isAuthenticated]);

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('adminAuth_v2');
        sessionStorage.removeItem('adminToken');
        ordersHook.setSelectedOrders([]);
    };

    const handleRefresh = () => {
        ordersHook.fetchOrders();
        productsHook.fetchProducts();
        couponsHook.fetchCoupons();
        promotionsHook.fetchPromotions();
        usersHook.fetchUsers();
    };

    const isLoading = ordersHook.loading || productsHook.loading || couponsHook.loading || promotionsHook.loading || usersHook.loading;

    // Login Screen
    if (!isAuthenticated) {
        return <AdminLogin onLoginSuccess={(token) => {
            sessionStorage.setItem('adminToken', token);
            sessionStorage.setItem('adminAuth_v2', 'true');
            setIsAuthenticated(true);
        }} />;
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
                <button
                    className={`mobile-nav-item ${activeTab === 'promotions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('promotions')}
                >
                    <Megaphone size={20} />
                    <span>Promos</span>
                </button>
                <button
                    className={`mobile-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <Users size={20} />
                    <span>Users</span>
                </button>
                <button
                    className={`mobile-nav-item ${activeTab === 'badges' ? 'active' : ''}`}
                    onClick={() => setActiveTab('badges')}
                >
                    <Award size={20} />
                    <span>Badges</span>
                </button>
                <button
                    className={`mobile-nav-item ${activeTab === 'firewall' ? 'active' : ''}`}
                    onClick={() => setActiveTab('firewall')}
                >
                    <ShieldAlert size={20} />
                    <span>Firewall</span>
                </button>
                <button
                    className={`mobile-nav-item ${activeTab === 'audit-logs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('audit-logs')}
                >
                    <History size={20} />
                    <span>Audit Logs</span>
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
                        className={`sidebar-item ${activeTab === 'featured' ? 'active' : ''}`}
                        onClick={() => setActiveTab('featured')}
                    >
                        <Star size={20} />
                        <span>Featured Ranks</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === 'coupons' ? 'active' : ''}`}
                        onClick={() => setActiveTab('coupons')}
                    >
                        <Ticket size={20} />
                        <span>Coupons</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === 'promotions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('promotions')}
                    >
                        <Megaphone size={20} />
                        <span>Promotions</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <Users size={20} />
                        <span>Users</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === 'badges' ? 'active' : ''}`}
                        onClick={() => setActiveTab('badges')}
                    >
                        <Award size={20} />
                        <span>Badges</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === 'firewall' ? 'active' : ''}`}
                        onClick={() => setActiveTab('firewall')}
                    >
                        <ShieldAlert size={20} />
                        <span>Firewall</span>
                    </button>
                    <button
                        className={`sidebar-item ${activeTab === 'audit-logs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('audit-logs')}
                    >
                        <History size={20} />
                        <span>Audit Logs</span>
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
                        {activeTab === 'featured' && '⭐ Featured Ranks'}
                        {activeTab === 'coupons' && '🎟️ Coupon Management'}
                        {activeTab === 'promotions' && '📣 Promotion Banners'}
                        {activeTab === 'users' && '👥 User Management'}
                        {activeTab === 'badges' && '🎖️ Badge Management'}
                        {activeTab === 'firewall' && '🛡️ WAF & IPS Firewall'}
                        {activeTab === 'audit-logs' && '📜 Audit Logs'}
                    </h1>
                    <button
                        className="refresh-btn"
                        onClick={handleRefresh}
                        disabled={isLoading}
                    >
                        <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
                        <span>Refresh</span>
                    </button>
                </header>

                {/* Dashboard Tab */}
                <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
                    <Dashboard
                        orders={ordersHook.orders}
                        analytics={ordersHook.getAnalytics()}
                    />
                </div>

                {/* Orders Tab */}
                <div style={{ display: activeTab === 'orders' ? 'block' : 'none' }}>
                    <OrdersTab
                        orders={ordersHook.orders}
                        filteredOrders={ordersHook.getFilteredOrders()}
                        statusFilter={ordersHook.statusFilter}
                        setStatusFilter={ordersHook.setStatusFilter}
                        selectedOrders={ordersHook.selectedOrders}
                        setSelectedOrders={ordersHook.setSelectedOrders}
                        toggleSelectOrder={ordersHook.toggleSelectOrder}
                        updateOrderStatus={ordersHook.updateOrderStatus}
                        updatePaymentStatus={ordersHook.updatePaymentStatus}
                        handleBulkDelete={ordersHook.handleBulkDelete}
                        startDate={ordersHook.startDate}
                        setStartDate={ordersHook.setStartDate}
                        endDate={ordersHook.endDate}
                        setEndDate={ordersHook.setEndDate}
                        clearDateFilter={ordersHook.clearDateFilter}
                        orderSearch={ordersHook.orderSearch}
                        setOrderSearch={ordersHook.setOrderSearch}
                    />
                </div>

                {/* Products Tab */}
                <div style={{ display: activeTab === 'products' ? 'block' : 'none' }}>
                    <ProductsTab
                        products={productsHook.products}
                        loading={productsHook.loading}
                        form={productsHook.form}
                        setForm={productsHook.setForm}
                        showModal={productsHook.showModal}
                        editingProduct={productsHook.editingProduct}
                        showDeleteConfirm={productsHook.showDeleteConfirm}
                        setShowDeleteConfirm={productsHook.setShowDeleteConfirm}
                        openAddModal={productsHook.openAddModal}
                        openEditModal={productsHook.openEditModal}
                        handleSubmit={productsHook.handleSubmit}
                        handleDelete={productsHook.handleDelete}
                        closeModal={productsHook.closeModal}
                    />
                </div>

                {/* Featured Ranks Tab */}
                <div style={{ display: activeTab === 'featured' ? 'block' : 'none' }}>
                    <FeaturedRanksTab
                        products={productsHook.products}
                        loading={productsHook.loading}
                        openEditModal={(product) => {
                            productsHook.openEditModal(product);
                            setActiveTab('products');
                        }}
                        updateFeaturedStatus={productsHook.updateFeaturedStatus}
                        updateDisplayOrder={productsHook.updateDisplayOrder}
                    />
                </div>

                {/* Coupons Tab */}
                <div style={{ display: activeTab === 'coupons' ? 'block' : 'none' }}>
                    <CouponsTab
                        coupons={couponsHook.coupons}
                        loading={couponsHook.loading}
                        form={couponsHook.form}
                        setForm={couponsHook.setForm}
                        showModal={couponsHook.showModal}
                        editingCoupon={couponsHook.editingCoupon}
                        showDeleteConfirm={couponsHook.showDeleteConfirm}
                        setShowDeleteConfirm={couponsHook.setShowDeleteConfirm}
                        openAddModal={couponsHook.openAddModal}
                        openEditModal={couponsHook.openEditModal}
                        handleSubmit={couponsHook.handleSubmit}
                        handleDelete={couponsHook.handleDelete}
                        toggleActive={couponsHook.toggleActive}
                        closeModal={couponsHook.closeModal}
                    />
                </div>

                {/* Promotions Tab */}
                <div style={{ display: activeTab === 'promotions' ? 'block' : 'none' }}>
                    <PromotionsTab
                        promotions={promotionsHook.promotions}
                        loading={promotionsHook.loading}
                        form={promotionsHook.form}
                        setForm={promotionsHook.setForm}
                        showModal={promotionsHook.showModal}
                        editingPromotion={promotionsHook.editingPromotion}
                        showDeleteConfirm={promotionsHook.showDeleteConfirm}
                        setShowDeleteConfirm={promotionsHook.setShowDeleteConfirm}
                        openAddModal={promotionsHook.openAddModal}
                        openEditModal={promotionsHook.openEditModal}
                        handleSubmit={promotionsHook.handleSubmit}
                        handleDelete={promotionsHook.handleDelete}
                        toggleActive={promotionsHook.toggleActive}
                        closeModal={promotionsHook.closeModal}
                    />
                </div>

                {/* Users Tab */}
                <div style={{ display: activeTab === 'users' ? 'block' : 'none' }}>
                    <UsersTab
                        users={usersHook.users}
                        filteredUsers={usersHook.getFilteredUsers()}
                        loading={usersHook.loading}
                        userSearch={usersHook.userSearch}
                        setUserSearch={usersHook.setUserSearch}
                        toggleBlockUser={usersHook.toggleBlockUser}
                        sendPasswordReset={usersHook.sendPasswordReset}
                        refreshUsers={usersHook.fetchUsers}
                    />
                </div>

                {/* Badges Tab */}
                <div style={{ display: activeTab === 'badges' ? 'block' : 'none' }}>
                    <BadgesTab />
                </div>

                {/* Firewall Tab */}
                <div style={{ display: activeTab === 'firewall' ? 'block' : 'none' }}>
                    <FirewallPanel />
                </div>

                {/* Audit Logs Tab */}
                <div style={{ display: activeTab === 'audit-logs' ? 'block' : 'none' }}>
                    <AuditLogsTab />
                </div>
            </main>
        </div>
    );
};

export default Admin;

