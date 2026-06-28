import React, { useState, useEffect, useCallback } from 'react';
import {
    Shield, Ban, Globe, Clock, RefreshCw, Trash2, Plus,
    ShieldAlert, Activity, Zap, Eye, AlertTriangle, ShieldCheck,
    Search, Server, Lock, Unlock, XCircle, Crosshair
} from 'lucide-react';

import { API_BASE_URL } from '../../../services/api';

const FirewallPanel = () => {
    const [bannedIPs, setBannedIPs] = useState([]);
    const [securityStats, setSecurityStats] = useState(null);
    const [securityLogs, setSecurityLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState('overview');
    const [actionLoading, setActionLoading] = useState(null);

    // Manual ban form
    const [showBanForm, setShowBanForm] = useState(false);
    const [banForm, setBanForm] = useState({ ip: '', reason: '', durationDays: 7 });

    const authFetch = useCallback(async (url, options = {}) => {
        const token = sessionStorage.getItem('adminToken');
        return fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        });
    }, []);

    const fetchSecurityData = useCallback(async () => {
        setLoading(true);
        try {
            const [bansRes, statsRes, logsRes] = await Promise.all([
                authFetch(`${API_BASE_URL}/admin/security/banned-ips`),
                authFetch(`${API_BASE_URL}/admin/security/stats`),
                authFetch(`${API_BASE_URL}/admin/security/logs`)
            ]);

            const bansData = await bansRes.json();
            const statsData = await statsRes.json();
            const logsData = await logsRes.json();

            if (bansData.success) setBannedIPs(bansData.bans || []);
            if (statsData.success) setSecurityStats(statsData.stats);
            if (logsData.success) setSecurityLogs(logsData.logs || []);
        } catch (error) {
            console.error('Error fetching security data:', error);
        } finally {
            setLoading(false);
        }
    }, [authFetch]);

    useEffect(() => {
        fetchSecurityData();
    }, [fetchSecurityData]);

    const handleUnban = async (banId, ip) => {
        if (!confirm(`Unban IP ${ip}?`)) return;
        setActionLoading(banId);
        try {
            const res = await authFetch(`${API_BASE_URL}/admin/security/banned-ips/${banId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                setBannedIPs(prev => prev.filter(b => b.id !== banId));
            }
        } catch (error) {
            console.error('Unban error:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleManualBan = async (e) => {
        e.preventDefault();
        if (!banForm.ip) return;
        setActionLoading('manual-ban');
        try {
            const res = await authFetch(`${API_BASE_URL}/admin/security/ban-ip`, {
                method: 'POST',
                body: JSON.stringify(banForm)
            });
            const data = await res.json();
            if (data.success) {
                setShowBanForm(false);
                setBanForm({ ip: '', reason: '', durationDays: 7 });
                fetchSecurityData();
            }
        } catch (error) {
            console.error('Manual ban error:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const formatTimeRemaining = (ms) => {
        const totalSecs = Math.ceil(ms / 1000);
        const days = Math.floor(totalSecs / 86400);
        const hours = Math.floor((totalSecs % 86400) / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
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

    const getReasonBadge = (reason) => {
        const configs = {
            'admin_login_failed': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: '🔐', label: 'Admin Login' },
            'waf_blocked': { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '🛡️', label: 'WAF Block' },
            'ips_blocked': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', icon: '🔰', label: 'IPS Block' },
            'manual_ban': { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: '✋', label: 'Manual Ban' }
        };
        return configs[reason] || { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', icon: '❓', label: reason };
    };

    const getLogTypeConfig = (type) => {
        const configs = {
            'sqlInjection': { color: '#ef4444', label: 'SQL Injection' },
            'xss': { color: '#f97316', label: 'XSS Attack' },
            'pathTraversal': { color: '#eab308', label: 'Path Traversal' },
            'commandInjection': { color: '#dc2626', label: 'Command Injection' },
            'maliciousBot': { color: '#8b5cf6', label: 'Malicious Bot' },
            'invalidMethod': { color: '#6b7280', label: 'Invalid Method' },
            'bannedIP': { color: '#ef4444', label: 'Banned IP' },
            'rateLimit': { color: '#f59e0b', label: 'Rate Limit' },
            'scanDetection': { color: '#eab308', label: 'Scan Detected' },
            'honeypot': { color: '#dc2626', label: 'Honeypot Trap' },
            'bruteForce': { color: '#ef4444', label: 'Brute Force' }
        };
        return configs[type] || { color: '#6b7280', label: type };
    };

    // ==================== OVERVIEW SECTION ====================
    const renderOverview = () => (
        <div className="fw-overview">
            {/* Stats Grid */}
            <div className="fw-stats-grid">
                <div className="fw-stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
                    <div className="fw-stat-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                        <Ban size={22} />
                    </div>
                    <div className="fw-stat-info">
                        <span className="fw-stat-value">{securityStats?.bans?.totalActiveBans || 0}</span>
                        <span className="fw-stat-label">Active Bans</span>
                    </div>
                </div>

                <div className="fw-stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div className="fw-stat-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                        <Shield size={22} />
                    </div>
                    <div className="fw-stat-info">
                        <span className="fw-stat-value">{securityStats?.waf?.totalBlocked || 0}</span>
                        <span className="fw-stat-label">WAF Blocks</span>
                    </div>
                </div>

                <div className="fw-stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                    <div className="fw-stat-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' }}>
                        <Activity size={22} />
                    </div>
                    <div className="fw-stat-info">
                        <span className="fw-stat-value">{securityStats?.ips?.totalBlocked || 0}</span>
                        <span className="fw-stat-label">IPS Blocks</span>
                    </div>
                </div>

                <div className="fw-stat-card" style={{ borderLeft: '4px solid #22c55e' }}>
                    <div className="fw-stat-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                        <Zap size={22} />
                    </div>
                    <div className="fw-stat-info">
                        <span className="fw-stat-value">{securityStats?.bans?.last24hBans || 0}</span>
                        <span className="fw-stat-label">Last 24h Bans</span>
                    </div>
                </div>
            </div>

            {/* WAF Breakdown */}
            <div className="fw-breakdown-grid">
                <div className="fw-breakdown-card">
                    <h3><Shield size={18} /> WAF Attack Breakdown</h3>
                    <div className="fw-breakdown-items">
                        {[
                            { label: 'SQL Injection', value: securityStats?.waf?.sqlInjection || 0, color: '#ef4444' },
                            { label: 'XSS Attacks', value: securityStats?.waf?.xss || 0, color: '#f97316' },
                            { label: 'Path Traversal', value: securityStats?.waf?.pathTraversal || 0, color: '#eab308' },
                            { label: 'Command Injection', value: securityStats?.waf?.commandInjection || 0, color: '#dc2626' },
                            { label: 'Malicious Bots', value: securityStats?.waf?.maliciousBot || 0, color: '#8b5cf6' },
                            { label: 'Invalid Methods', value: securityStats?.waf?.invalidMethod || 0, color: '#6b7280' }
                        ].map(item => (
                            <div key={item.label} className="fw-breakdown-item">
                                <div className="fw-breakdown-left">
                                    <span className="fw-dot" style={{ background: item.color }}></span>
                                    <span className="fw-breakdown-label">{item.label}</span>
                                </div>
                                <span className="fw-breakdown-value" style={{ color: item.color }}>
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="fw-breakdown-card">
                    <h3><Activity size={18} /> IPS Detection Breakdown</h3>
                    <div className="fw-breakdown-items">
                        {[
                            { label: 'Rate Limit', value: securityStats?.ips?.rateLimitBlocks || 0, color: '#f59e0b' },
                            { label: 'Scan Detection', value: securityStats?.ips?.scanDetectionBlocks || 0, color: '#eab308' },
                            { label: 'Honeypot Traps', value: securityStats?.ips?.honeypotBlocks || 0, color: '#dc2626' },
                            { label: 'Brute Force', value: securityStats?.ips?.bruteForceBlocks || 0, color: '#ef4444' }
                        ].map(item => (
                            <div key={item.label} className="fw-breakdown-item">
                                <div className="fw-breakdown-left">
                                    <span className="fw-dot" style={{ background: item.color }}></span>
                                    <span className="fw-breakdown-label">{item.label}</span>
                                </div>
                                <span className="fw-breakdown-value" style={{ color: item.color }}>
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="fw-breakdown-card">
                    <h3><Ban size={18} /> Ban Distribution</h3>
                    <div className="fw-breakdown-items">
                        {[
                            { label: 'Admin Login Bans', value: securityStats?.bans?.adminLoginBans || 0, color: '#ef4444' },
                            { label: 'WAF Bans', value: securityStats?.bans?.wafBans || 0, color: '#f59e0b' },
                            { label: 'IPS Bans', value: securityStats?.bans?.ipsBans || 0, color: '#8b5cf6' },
                            { label: 'Total (All Time)', value: securityStats?.bans?.totalBansEver || 0, color: '#6b7280' }
                        ].map(item => (
                            <div key={item.label} className="fw-breakdown-item">
                                <div className="fw-breakdown-left">
                                    <span className="fw-dot" style={{ background: item.color }}></span>
                                    <span className="fw-breakdown-label">{item.label}</span>
                                </div>
                                <span className="fw-breakdown-value" style={{ color: item.color }}>
                                    {item.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    // ==================== BANNED IPS SECTION ====================
    const renderBannedIPs = () => (
        <div className="fw-banned-section">
            <div className="fw-section-header">
                <h3><Ban size={18} /> Banned IPs ({bannedIPs.length})</h3>
                <button
                    className="fw-btn fw-btn-danger"
                    onClick={() => setShowBanForm(true)}
                >
                    <Plus size={16} /> Ban IP
                </button>
            </div>

            {/* Manual Ban Form */}
            {showBanForm && (
                <div className="fw-ban-form">
                    <form onSubmit={handleManualBan}>
                        <div className="fw-form-grid">
                            <div className="fw-form-group">
                                <label>IP Address *</label>
                                <input
                                    type="text"
                                    value={banForm.ip}
                                    onChange={(e) => setBanForm({ ...banForm, ip: e.target.value })}
                                    placeholder="e.g. 192.168.1.100"
                                    required
                                />
                            </div>
                            <div className="fw-form-group">
                                <label>Duration (days)</label>
                                <input
                                    type="number"
                                    value={banForm.durationDays}
                                    onChange={(e) => setBanForm({ ...banForm, durationDays: parseInt(e.target.value) || 7 })}
                                    min={1}
                                    max={365}
                                />
                            </div>
                            <div className="fw-form-group" style={{ gridColumn: '1 / -1' }}>
                                <label>Reason</label>
                                <input
                                    type="text"
                                    value={banForm.reason}
                                    onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                                    placeholder="Reason for ban"
                                />
                            </div>
                        </div>
                        <div className="fw-form-actions">
                            <button type="submit" className="fw-btn fw-btn-danger" disabled={actionLoading === 'manual-ban'}>
                                {actionLoading === 'manual-ban' ? 'Banning...' : 'Ban IP'}
                            </button>
                            <button type="button" className="fw-btn fw-btn-ghost" onClick={() => setShowBanForm(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Banned IPs List */}
            {bannedIPs.length === 0 ? (
                <div className="fw-empty-state">
                    <ShieldCheck size={48} />
                    <p>No active IP bans</p>
                    <span>All clear! No IPs are currently banned.</span>
                </div>
            ) : (
                <div className="fw-bans-list">
                    {bannedIPs.map(ban => {
                        const reasonConfig = getReasonBadge(ban.reason);
                        return (
                            <div key={ban.id} className="fw-ban-card">
                                <div className="fw-ban-main">
                                    <div className="fw-ban-ip">
                                        <Globe size={16} style={{ color: '#ef4444' }} />
                                        <span className="fw-ip-text">{ban.ip}</span>
                                    </div>
                                    <span
                                        className="fw-reason-badge"
                                        style={{ color: reasonConfig.color, background: reasonConfig.bg }}
                                    >
                                        {reasonConfig.icon} {reasonConfig.label}
                                    </span>
                                </div>

                                <div className="fw-ban-details">
                                    {ban.description && (
                                        <p className="fw-ban-desc">{ban.description}</p>
                                    )}
                                    <div className="fw-ban-meta">
                                        <span>
                                            <Clock size={13} />
                                            Expires: {formatTimeRemaining(ban.remainingMs)}
                                        </span>
                                        <span>
                                            Banned: {formatTimeAgo(ban.bannedAt)}
                                        </span>
                                        <span>
                                            By: {ban.bannedBy}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    className="fw-btn fw-btn-unban"
                                    onClick={() => handleUnban(ban.id, ban.ip)}
                                    disabled={actionLoading === ban.id}
                                >
                                    {actionLoading === ban.id ? (
                                        <RefreshCw size={14} className="spinning" />
                                    ) : (
                                        <Unlock size={14} />
                                    )}
                                    Unban
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // ==================== SECURITY LOGS SECTION ====================
    const renderLogs = () => (
        <div className="fw-logs-section">
            <div className="fw-section-header">
                <h3><Eye size={18} /> Security Logs ({securityLogs.length})</h3>
                <span className="fw-logs-note">Last 100 events (in-memory, resets on server restart)</span>
            </div>

            {securityLogs.length === 0 ? (
                <div className="fw-empty-state">
                    <ShieldCheck size={48} />
                    <p>No security events</p>
                    <span>No attacks or suspicious activity detected.</span>
                </div>
            ) : (
                <div className="fw-logs-list">
                    {securityLogs.map((log, idx) => {
                        const typeConfig = getLogTypeConfig(log.type);
                        return (
                            <div key={idx} className="fw-log-item">
                                <div className="fw-log-source"
                                    style={{
                                        background: log.source === 'WAF'
                                            ? 'rgba(245,158,11,0.12)'
                                            : 'rgba(139,92,246,0.12)',
                                        color: log.source === 'WAF' ? '#f59e0b' : '#8b5cf6'
                                    }}
                                >
                                    {log.source}
                                </div>
                                <div className="fw-log-content">
                                    <div className="fw-log-top">
                                        <span className="fw-log-type"
                                            style={{ color: typeConfig.color }}
                                        >
                                            {typeConfig.label}
                                        </span>
                                        <span className="fw-log-path">{log.path}</span>
                                    </div>
                                    <div className="fw-log-bottom">
                                        <span className="fw-log-ip">
                                            <Globe size={12} /> {log.ip}
                                        </span>
                                        {log.details && (
                                            <span className="fw-log-details">{log.details}</span>
                                        )}
                                        <span className="fw-log-time">
                                            <Clock size={12} /> {formatTimeAgo(log.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    // ==================== MAIN RENDER ====================
    if (loading) {
        return (
            <div className="fw-panel">
                <div className="fw-loading">
                    <RefreshCw size={36} className="spinning" />
                    <p>Loading security data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fw-panel">
            {/* Section Tabs */}
            <div className="fw-tabs">
                <button
                    className={`fw-tab ${activeSection === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveSection('overview')}
                >
                    <ShieldAlert size={16} />
                    Overview
                </button>
                <button
                    className={`fw-tab ${activeSection === 'bans' ? 'active' : ''}`}
                    onClick={() => setActiveSection('bans')}
                >
                    <Ban size={16} />
                    Banned IPs
                    {bannedIPs.length > 0 && (
                        <span className="fw-tab-badge">{bannedIPs.length}</span>
                    )}
                </button>
                <button
                    className={`fw-tab ${activeSection === 'logs' ? 'active' : ''}`}
                    onClick={() => setActiveSection('logs')}
                >
                    <Eye size={16} />
                    Logs
                </button>
                <button
                    className="fw-tab fw-tab-refresh"
                    onClick={fetchSecurityData}
                    disabled={loading}
                >
                    <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                </button>
            </div>

            {/* Content */}
            {activeSection === 'overview' && renderOverview()}
            {activeSection === 'bans' && renderBannedIPs()}
            {activeSection === 'logs' && renderLogs()}
        </div>
    );
};

export default FirewallPanel;
