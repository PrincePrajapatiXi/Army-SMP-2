import React, { useState, useEffect } from 'react';
import {
    LogOut, Package, TrendingUp, Box, Ticket, Megaphone,
    RefreshCw, BarChart3, Users
} from 'lucide-react';
import './Admin.css';

// Hooks
import useOrders from './hooks/useOrders';
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
        const adminAuth = sessionStorage.getItem('adminAuth');
        if (adminAuth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    // Fetch data when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            ordersHook.fetchOrders();
            productsHook.fetchProducts();
            couponsHook.fetchCoupons();
            promotionsHook.fetchPromotions();
            usersHook.fetchUsers();
        }
    }, [isAuthenticated]);

    const handleLogout = () => {
        setIsAuthenticated(false);
        sessionStorage.removeItem('adminAuth');
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
        return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
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
                        {activeTab === 'promotions' && '📣 Promotion Banners'}
                        {activeTab === 'users' && '👥 User Management'}
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
                {activeTab === 'dashboard' && (
                    <Dashboard
                        orders={ordersHook.orders}
                        analytics={ordersHook.getAnalytics()}
                    />
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <OrdersTab
                        orders={ordersHook.orders}
                        filteredOrders={ordersHook.getFilteredOrders()}
                        statusFilter={ordersHook.statusFilter}
                        setStatusFilter={ordersHook.setStatusFilter}
                        selectedOrders={ordersHook.selectedOrders}
                        setSelectedOrders={ordersHook.setSelectedOrders}
                        toggleSelectOrder={ordersHook.toggleSelectOrder}
                        updateOrderStatus={ordersHook.updateOrderStatus}
                        handleBulkDelete={ordersHook.handleBulkDelete}
                        startDate={ordersHook.startDate}
                        setStartDate={ordersHook.setStartDate}
                        endDate={ordersHook.endDate}
                        setEndDate={ordersHook.setEndDate}
                        clearDateFilter={ordersHook.clearDateFilter}
                        orderSearch={ordersHook.orderSearch}
                        setOrderSearch={ordersHook.setOrderSearch}
                    />
                )}

                {/* Products Tab */}
                {activeTab === 'products' && (
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
                )}

                {/* Coupons Tab */}
                {activeTab === 'coupons' && (
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
                )}

                {/* Promotions Tab */}
                {activeTab === 'promotions' && (
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
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <UsersTab
                        users={usersHook.users}
                        filteredUsers={usersHook.getFilteredUsers()}
                        loading={usersHook.loading}
                        userSearch={usersHook.userSearch}
                        setUserSearch={usersHook.setUserSearch}
                        toggleBlockUser={usersHook.toggleBlockUser}
                        sendPasswordReset={usersHook.sendPasswordReset}
                    />
                )}
            </main>
        </div>
    );
};

export default Admin;
