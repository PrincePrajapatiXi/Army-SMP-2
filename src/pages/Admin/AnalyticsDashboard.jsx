import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Users,
    Package,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './AnalyticsDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AnalyticsDashboard = () => {
    const { adminToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [overview, setOverview] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [orderStatus, setOrderStatus] = useState([]);
    const [period, setPeriod] = useState('7days');

    useEffect(() => {
        fetchAnalytics();
    }, [adminToken, period]);

    const fetchAnalytics = async () => {
        if (!adminToken) return;

        try {
            setLoading(true);
            setError(null);

            const headers = { 'Authorization': `Bearer ${adminToken}` };

            // Fetch all data in parallel
            const [overviewRes, revenueRes, categoryRes, productsRes, statusRes] = await Promise.all([
                fetch(`${API_URL}/analytics/overview`, { headers }),
                fetch(`${API_URL}/analytics/revenue-chart?period=${period}`, { headers }),
                fetch(`${API_URL}/analytics/category-breakdown`, { headers }),
                fetch(`${API_URL}/analytics/top-products`, { headers }),
                fetch(`${API_URL}/analytics/order-status`, { headers })
            ]);

            const [overviewData, revenueDataRes, categoryDataRes, productsData, statusData] = await Promise.all([
                overviewRes.json(),
                revenueRes.json(),
                categoryRes.json(),
                productsRes.json(),
                statusRes.json()
            ]);

            if (overviewData.success) setOverview(overviewData.data);
            if (revenueDataRes.success) setRevenueData(revenueDataRes.data);
            if (categoryDataRes.success) setCategoryData(categoryDataRes.data);
            if (productsData.success) setTopProducts(productsData.data);
            if (statusData.success) setOrderStatus(statusData.data);

        } catch (err) {
            console.error('Error fetching analytics:', err);
            setError('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // Calculate max revenue for chart scaling
    const maxRevenue = revenueData.length > 0
        ? Math.max(...revenueData.map(d => d.revenue))
        : 0;

    if (loading && !overview) {
        return (
            <div className="analytics-loading">
                <RefreshCw className="spin" size={32} />
                <p>Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="analytics-error">
                <AlertCircle size={32} />
                <p>{error}</p>
                <button onClick={fetchAnalytics} className="btn btn-primary">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="analytics-dashboard">
            {/* Period Selector */}
            <div className="analytics-header">
                <h2>Analytics Overview</h2>
                <div className="period-selector">
                    <button
                        className={period === '7days' ? 'active' : ''}
                        onClick={() => setPeriod('7days')}
                    >
                        7 Days
                    </button>
                    <button
                        className={period === '30days' ? 'active' : ''}
                        onClick={() => setPeriod('30days')}
                    >
                        30 Days
                    </button>
                    <button
                        className={period === '12months' ? 'active' : ''}
                        onClick={() => setPeriod('12months')}
                    >
                        12 Months
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card revenue">
                    <div className="stat-icon">
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Total Revenue</span>
                        <span className="stat-value">{formatCurrency(overview?.revenue?.total || 0)}</span>
                        <div className={`stat-change ${overview?.revenue?.growth >= 0 ? 'positive' : 'negative'}`}>
                            {overview?.revenue?.growth >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            <span>{Math.abs(overview?.revenue?.growth || 0)}% vs last month</span>
                        </div>
                    </div>
                </div>

                <div className="stat-card orders">
                    <div className="stat-icon">
                        <ShoppingBag size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Total Orders</span>
                        <span className="stat-value">{overview?.orders?.total || 0}</span>
                        <span className="stat-sub">
                            {overview?.orders?.pending || 0} pending
                        </span>
                    </div>
                </div>

                <div className="stat-card users">
                    <div className="stat-icon">
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Total Users</span>
                        <span className="stat-value">{overview?.users?.total || 0}</span>
                        <span className="stat-sub">
                            +{overview?.users?.newThisMonth || 0} this month
                        </span>
                    </div>
                </div>

                <div className="stat-card products">
                    <div className="stat-icon">
                        <Package size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-label">Products</span>
                        <span className="stat-value">{overview?.products?.active || 0}</span>
                        <span className="stat-sub">
                            {overview?.products?.total || 0} total
                        </span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                {/* Revenue Chart */}
                <div className="chart-card">
                    <h3>Revenue Trend</h3>
                    <div className="bar-chart">
                        {revenueData.length > 0 ? (
                            revenueData.map((item, index) => (
                                <div key={index} className="bar-container">
                                    <div
                                        className="bar"
                                        style={{
                                            height: `${maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0}%`
                                        }}
                                        title={`${item.date}: ${formatCurrency(item.revenue)}`}
                                    >
                                        <span className="bar-tooltip">
                                            {formatCurrency(item.revenue)}
                                        </span>
                                    </div>
                                    <span className="bar-label">
                                        {period === '12months'
                                            ? item.date.split('-')[1]
                                            : item.date.split('-')[2]
                                        }
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="no-data">No data available</div>
                        )}
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="chart-card">
                    <h3>Sales by Category</h3>
                    <div className="category-chart">
                        {categoryData.length > 0 ? (
                            categoryData.map((cat, index) => {
                                const totalRevenue = categoryData.reduce((sum, c) => sum + c.revenue, 0);
                                const percentage = totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0;
                                const colors = ['#ff6b35', '#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6'];

                                return (
                                    <div key={index} className="category-item">
                                        <div className="category-info">
                                            <span
                                                className="category-dot"
                                                style={{ backgroundColor: colors[index % colors.length] }}
                                            />
                                            <span className="category-name">{cat.category}</span>
                                        </div>
                                        <div className="category-bar-wrapper">
                                            <div
                                                className="category-bar"
                                                style={{
                                                    width: `${percentage}%`,
                                                    backgroundColor: colors[index % colors.length]
                                                }}
                                            />
                                        </div>
                                        <span className="category-value">{formatCurrency(cat.revenue)}</span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="no-data">No category data</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="bottom-row">
                {/* Top Products */}
                <div className="list-card">
                    <h3>Top Selling Products</h3>
                    <div className="products-list">
                        {topProducts.length > 0 ? (
                            topProducts.slice(0, 5).map((product, index) => (
                                <div key={index} className="product-item">
                                    <span className="product-rank">#{index + 1}</span>
                                    <div className="product-info">
                                        <span className="product-name">{product.name}</span>
                                        <span className="product-sold">{product.sold} sold</span>
                                    </div>
                                    <span className="product-revenue">{formatCurrency(product.revenue)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="no-data">No product data</div>
                        )}
                    </div>
                </div>

                {/* Order Status */}
                <div className="list-card">
                    <h3>Order Status</h3>
                    <div className="status-chart">
                        {orderStatus.length > 0 ? (
                            <>
                                <div className="donut-chart">
                                    {/* Simple CSS donut chart */}
                                    <svg viewBox="0 0 100 100" className="donut">
                                        {orderStatus.reduce((acc, status, index) => {
                                            const total = orderStatus.reduce((sum, s) => sum + s.count, 0);
                                            const percentage = (status.count / total) * 100;
                                            const offset = acc.offset;
                                            acc.offset += percentage;
                                            acc.elements.push(
                                                <circle
                                                    key={index}
                                                    cx="50"
                                                    cy="50"
                                                    r="40"
                                                    fill="transparent"
                                                    stroke={status.color}
                                                    strokeWidth="15"
                                                    strokeDasharray={`${percentage * 2.51} ${251 - percentage * 2.51}`}
                                                    strokeDashoffset={`${-offset * 2.51}`}
                                                />
                                            );
                                            return acc;
                                        }, { offset: 0, elements: [] }).elements}
                                    </svg>
                                    <div className="donut-center">
                                        <span className="donut-total">
                                            {orderStatus.reduce((sum, s) => sum + s.count, 0)}
                                        </span>
                                        <span className="donut-label">Orders</span>
                                    </div>
                                </div>
                                <div className="status-legend">
                                    {orderStatus.map((status, index) => (
                                        <div key={index} className="legend-item">
                                            <span
                                                className="legend-dot"
                                                style={{ backgroundColor: status.color }}
                                            />
                                            <span className="legend-label">{status.label}</span>
                                            <span className="legend-count">{status.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="no-data">No status data</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
