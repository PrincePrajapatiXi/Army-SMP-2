import React, { useState, useEffect } from 'react';
import {
    Shield, AlertTriangle, UserX, Eye, CheckCircle, XCircle,
    TrendingUp, Clock, Filter, RefreshCw, ChevronDown, ChevronUp
} from 'lucide-react';
import './SecurityTab.css';

const API_BASE_URL = 'https://army-smp-2.onrender.com/api';

const SecurityTab = ({ authFetch }) => {
    const [fraudAlerts, setFraudAlerts] = useState([]);
    const [fraudStats, setFraudStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [riskFilter, setRiskFilter] = useState('all');
    const [expandedAlert, setExpandedAlert] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchFraudData();
    }, [statusFilter, riskFilter]);

    const fetchFraudData = async () => {
        setLoading(true);
        try {
            const [alertsRes, statsRes] = await Promise.all([
                authFetch(`${API_BASE_URL}/fraud/alerts?status=${statusFilter}&riskLevel=${riskFilter}`),
                authFetch(`${API_BASE_URL}/fraud/stats`)
            ]);

            const alertsData = await alertsRes.json();
            const statsData = await statsRes.json();

            setFraudAlerts(alertsData.alerts || []);
            setFraudStats(statsData);
        } catch (error) {
            console.error('Error fetching fraud data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAlertAction = async (alertId, status, actionTaken = 'none') => {
        setActionLoading(alertId);
        try {
            await authFetch(`${API_BASE_URL}/fraud/alerts/${alertId}`, {
                method: 'PUT',
                body: JSON.stringify({ status, actionTaken })
            });
            fetchFraudData();
        } catch (error) {
            console.error('Error updating alert:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'critical': return '#ff4757';
            case 'high': return '#ff6b35';
            case 'medium': return '#ffa502';
            case 'low': return '#2ed573';
            default: return '#747d8c';
        }
    };

    const getRiskIcon = (level) => {
        switch (level) {
            case 'critical': return '🔴';
            case 'high': return '🟠';
            case 'medium': return '🟡';
            case 'low': return '🟢';
            default: return '⚪';
        }
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    return (
        <div className="security-tab">
            {/* Stats Cards */}
            <div className="security-stats-grid">
                <div className="security-stat-card critical">
                    <div className="stat-icon">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Pending Alerts</span>
                        <span className="stat-value">{fraudStats?.pending || 0}</span>
                    </div>
                </div>

                <div className="security-stat-card warning">
                    <div className="stat-icon">
                        <Shield size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Critical Risk</span>
                        <span className="stat-value">{fraudStats?.critical || 0}</span>
                    </div>
                </div>

                <div className="security-stat-card info">
                    <div className="stat-icon">
                        <UserX size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Blocked Users</span>
                        <span className="stat-value">{fraudStats?.blockedUsers || 0}</span>
                    </div>
                </div>

                <div className="security-stat-card success">
                    <div className="stat-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Today's Alerts</span>
                        <span className="stat-value">{fraudStats?.todayCount || 0}</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="security-filters">
                <div className="filter-group">
                    <label>Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="approved">Approved</option>
                        <option value="dismissed">Dismissed</option>
                        <option value="blocked">Blocked</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Risk Level</label>
                    <select
                        value={riskFilter}
                        onChange={(e) => setRiskFilter(e.target.value)}
                    >
                        <option value="all">All Risks</option>
                        <option value="critical">🔴 Critical</option>
                        <option value="high">🟠 High</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="low">🟢 Low</option>
                    </select>
                </div>

                <button
                    className="refresh-btn"
                    onClick={fetchFraudData}
                    disabled={loading}
                >
                    <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                    Refresh
                </button>
            </div>

            {/* Alerts List */}
            <div className="fraud-alerts-list">
                <h3>
                    <AlertTriangle size={20} />
                    Fraud Alerts ({fraudAlerts.length})
                </h3>

                {loading ? (
                    <div className="loading-state">
                        <RefreshCw size={32} className="spinning" />
                        <p>Loading alerts...</p>
                    </div>
                ) : fraudAlerts.length === 0 ? (
                    <div className="empty-state">
                        <Shield size={48} />
                        <p>No fraud alerts found</p>
                        <span>All orders are looking good! 🎉</span>
                    </div>
                ) : (
                    <div className="alerts-container">
                        {fraudAlerts.map(alert => (
                            <div
                                key={alert._id}
                                className={`fraud-alert-card ${alert.riskLevel} ${expandedAlert === alert._id ? 'expanded' : ''}`}
                            >
                                <div
                                    className="alert-header"
                                    onClick={() => setExpandedAlert(expandedAlert === alert._id ? null : alert._id)}
                                >
                                    <div className="alert-risk">
                                        <span
                                            className="risk-badge"
                                            style={{ backgroundColor: getRiskColor(alert.riskLevel) }}
                                        >
                                            {getRiskIcon(alert.riskLevel)} {alert.riskLevel.toUpperCase()}
                                        </span>
                                        <span className="risk-score">Score: {alert.riskScore}</span>
                                    </div>

                                    <div className="alert-meta">
                                        <span className="alert-order">#{alert.orderNumber}</span>
                                        <span className="alert-time">
                                            <Clock size={14} />
                                            {formatTimeAgo(alert.createdAt)}
                                        </span>
                                    </div>

                                    <div className="alert-status">
                                        <span className={`status-badge ${alert.status}`}>
                                            {alert.status}
                                        </span>
                                        {expandedAlert === alert._id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                <div className="alert-summary">
                                    <div className="summary-item">
                                        <span className="label">User:</span>
                                        <span className="value">{alert.userEmail}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="label">Amount:</span>
                                        <span className="value">₹{alert.orderValue}</span>
                                    </div>
                                    <div className="summary-item">
                                        <span className="label">Minecraft:</span>
                                        <span className="value">{alert.minecraftUsername}</span>
                                    </div>
                                </div>

                                {expandedAlert === alert._id && (
                                    <div className="alert-details">
                                        <div className="flags-section">
                                            <h4>⚠️ Detected Flags</h4>
                                            <ul className="flags-list">
                                                {alert.flags.map((flag, idx) => (
                                                    <li key={idx}>
                                                        <span className="flag-type">{flag.type.replace(/_/g, ' ')}</span>
                                                        <span className="flag-desc">{flag.description}</span>
                                                        <span className="flag-points">+{flag.points} pts</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="tracking-section">
                                            <h4>📍 Tracking Info</h4>
                                            <div className="tracking-grid">
                                                <div>
                                                    <span className="label">IP:</span>
                                                    <span className="value">{alert.ipAddress}</span>
                                                </div>
                                                <div>
                                                    <span className="label">User Agent:</span>
                                                    <span className="value truncate">{alert.userAgent}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {alert.status === 'pending' && (
                                            <div className="alert-actions">
                                                <button
                                                    className="action-btn approve"
                                                    onClick={() => handleAlertAction(alert._id, 'approved')}
                                                    disabled={actionLoading === alert._id}
                                                >
                                                    <CheckCircle size={16} />
                                                    Approve Order
                                                </button>
                                                <button
                                                    className="action-btn review"
                                                    onClick={() => handleAlertAction(alert._id, 'reviewed')}
                                                    disabled={actionLoading === alert._id}
                                                >
                                                    <Eye size={16} />
                                                    Mark Reviewed
                                                </button>
                                                <button
                                                    className="action-btn block"
                                                    onClick={() => handleAlertAction(alert._id, 'blocked', 'blocked')}
                                                    disabled={actionLoading === alert._id}
                                                >
                                                    <UserX size={16} />
                                                    Block User
                                                </button>
                                                <button
                                                    className="action-btn dismiss"
                                                    onClick={() => handleAlertAction(alert._id, 'dismissed')}
                                                    disabled={actionLoading === alert._id}
                                                >
                                                    <XCircle size={16} />
                                                    Dismiss
                                                </button>
                                            </div>
                                        )}

                                        {alert.reviewedAt && (
                                            <div className="review-info">
                                                <span>Reviewed by: {alert.reviewedBy}</span>
                                                <span>At: {new Date(alert.reviewedAt).toLocaleString()}</span>
                                                {alert.notes && <span>Notes: {alert.notes}</span>}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecurityTab;

