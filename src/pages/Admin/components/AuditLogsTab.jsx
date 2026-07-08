import React, { useState, useEffect } from 'react';
import { Search, History, ShieldAlert, RefreshCw, X } from 'lucide-react';
import { API_BASE_URL } from '../../../services/api';

const AuditLogsTab = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE_URL}/admin/audit-logs`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setLogs(data || []);
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log => {
        if (!searchTerm.trim()) return true;
        const s = searchTerm.toLowerCase();
        return (
            (log.adminUsername || '').toLowerCase().includes(s) ||
            (log.action || '').toLowerCase().includes(s) ||
            (log.details || '').toLowerCase().includes(s) ||
            (log.ipAddress || '').toLowerCase().includes(s)
        );
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getActionColor = (action) => {
        const lower = (action || '').toLowerCase();
        if (lower.includes('delete') || lower.includes('removed')) return '#ef4444';
        if (lower.includes('update') || lower.includes('edited')) return '#f59e0b';
        if (lower.includes('create') || lower.includes('added')) return '#22c55e';
        if (lower.includes('export')) return '#3b82f6';
        if (lower.includes('login')) return '#8b5cf6';
        return 'var(--primary)';
    };

    return (
        <div className="audit-logs-content">
            {/* Toolbar */}
            <div className="audit-toolbar">
                <div className="audit-search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by admin, action, details, IP..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    {searchTerm && (
                        <button
                            className="clear-search-btn"
                            onClick={() => setSearchTerm('')}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div className="audit-actions">
                    <span className="filter-count">{filteredLogs.length} logs</span>
                    <button className="refresh-btn" onClick={fetchLogs} disabled={loading}>
                        <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                        Reload
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="audit-loading">
                    <RefreshCw size={32} className="spinning" />
                    <p>Loading audit logs...</p>
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="audit-empty">
                    <ShieldAlert size={48} />
                    <p>No logs found</p>
                    <span>{searchTerm ? 'Try a different search term' : 'No admin activity recorded yet'}</span>
                </div>
            ) : (
                <div className="audit-logs-list">
                    {filteredLogs.map((log, index) => (
                        <div key={log._id || index} className="audit-log-card">
                            <div className="audit-log-header">
                                <div className="audit-log-left">
                                    <span
                                        className="audit-action-badge"
                                        style={{
                                            color: getActionColor(log.action),
                                            background: `${getActionColor(log.action)}15`
                                        }}
                                    >
                                        {log.action}
                                    </span>
                                    <span className="audit-admin-badge">
                                        {log.adminUsername || 'Admin'}
                                    </span>
                                </div>
                                <span className="audit-log-time">{formatDate(log.timestamp)}</span>
                            </div>
                            <div className="audit-log-body">
                                <p className="audit-log-details">{log.details || 'No details'}</p>
                                {log.ipAddress && (
                                    <span className="audit-log-ip">IP: {log.ipAddress}</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AuditLogsTab;
