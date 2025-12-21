import React, { useEffect, useRef, useState } from 'react';
import {
    DollarSign, ShoppingCart, Calendar, TrendingUp,
    CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

const Dashboard = ({ orders, analytics }) => {
    const chartRef = useRef(null);
    const pieChartRef = useRef(null);
    const [chartPeriod, setChartPeriod] = useState('week');

    useEffect(() => {
        if (orders.length > 0) {
            initCharts();
        }
    }, [orders, chartPeriod]);

    const initCharts = () => {
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

        // Revenue Chart
        const revenueCtx = document.getElementById('revenueChart');
        if (revenueCtx) {
            const labels = [];
            const revenueData = [];

            const getPeriodData = () => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                switch (chartPeriod) {
                    case 'today':
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

    return (
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
    );
};

export default Dashboard;
