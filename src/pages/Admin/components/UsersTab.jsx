import React, { useState } from 'react';
import {
    Users, Search, X, ShieldOff, Shield, Mail, KeyRound,
    Calendar, ShoppingBag, IndianRupee, AlertCircle, CheckCircle
} from 'lucide-react';

const UsersTab = ({
    users,
    filteredUsers,
    loading,
    userSearch,
    setUserSearch,
    toggleBlockUser,
    sendPasswordReset
}) => {
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleBlock = async (userId, isBlocked) => {
        setActionLoading(userId + '-block');
        const result = await toggleBlockUser(userId);
        setActionLoading(null);
        showToast(result.message, result.success ? 'success' : 'error');
    };

    const handlePasswordReset = async (userId, email) => {
        setActionLoading(userId + '-reset');
        const result = await sendPasswordReset(userId);
        setActionLoading(null);
        showToast(result.message, result.success ? 'success' : 'error');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getInitials = (name, email) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return email?.charAt(0).toUpperCase() || '?';
    };

    return (
        <div className="users-content">
            {/* Toast Notification */}
            {toast && (
                <div className={`users-toast ${toast.type}`}>
                    {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    {toast.message}
                </div>
            )}

            {/* Toolbar */}
            <div className="users-toolbar">
                <div className="users-search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search users by email, username, or Minecraft name..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="search-input"
                    />
                    {userSearch && (
                        <button
                            className="clear-search-btn"
                            onClick={() => setUserSearch('')}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <span className="users-count">{filteredUsers.length} users</span>
            </div>

            {/* Users List */}
            <div className="users-list">
                {loading ? (
                    <div className="users-loading">
                        <div className="spinner"></div>
                        <p>Loading users...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="no-users">
                        <Users size={48} />
                        <p>No users found</p>
                    </div>
                ) : (
                    filteredUsers.map(user => (
                        <div
                            key={user.id}
                            className={`user-card ${user.isBlocked ? 'blocked' : ''}`}
                        >
                            <div className="user-card-header">
                                <div className="user-avatar-section">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt="" className="user-avatar" />
                                    ) : (
                                        <div className="user-avatar-initials">
                                            {getInitials(user.name, user.email)}
                                        </div>
                                    )}
                                    <div className="user-basic-info">
                                        <span className="user-name">{user.name || user.username}</span>
                                        <span className="user-email">{user.email}</span>
                                    </div>
                                </div>
                                <span className={`user-status-badge ${user.isBlocked ? 'blocked' : 'active'}`}>
                                    {user.isBlocked ? (
                                        <><ShieldOff size={12} /> Blocked</>
                                    ) : (
                                        <><Shield size={12} /> Active</>
                                    )}
                                </span>
                            </div>

                            <div className="user-card-body">
                                <div className="user-info-grid">
                                    <div className="user-info-item">
                                        <span className="info-label">🎮 Minecraft</span>
                                        <span className="info-value">{user.minecraftUsername || 'Not set'}</span>
                                    </div>
                                    <div className="user-info-item">
                                        <span className="info-label"><Calendar size={14} /> Joined</span>
                                        <span className="info-value">{formatDate(user.createdAt)}</span>
                                    </div>
                                    <div className="user-info-item">
                                        <span className="info-label"><ShoppingBag size={14} /> Orders</span>
                                        <span className="info-value order-count">{user.orderCount}</span>
                                    </div>
                                    <div className="user-info-item">
                                        <span className="info-label"><IndianRupee size={14} /> Total Spent</span>
                                        <span className="info-value total-spent">₹{user.totalSpent.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="user-meta">
                                    <span className={`auth-badge ${user.authProvider}`}>
                                        {user.authProvider === 'google' ? '🔵 Google' : '📧 Email'}
                                    </span>
                                    {user.isEmailVerified && (
                                        <span className="verified-badge">✓ Verified</span>
                                    )}
                                </div>
                            </div>

                            <div className="user-card-actions">
                                <button
                                    className={`action-btn ${user.isBlocked ? 'unblock' : 'block'}`}
                                    onClick={() => handleBlock(user.id, user.isBlocked)}
                                    disabled={actionLoading === user.id + '-block'}
                                >
                                    {actionLoading === user.id + '-block' ? (
                                        <span className="btn-spinner"></span>
                                    ) : user.isBlocked ? (
                                        <><Shield size={16} /> Unblock</>
                                    ) : (
                                        <><ShieldOff size={16} /> Block</>
                                    )}
                                </button>

                                {user.authProvider === 'local' && (
                                    <button
                                        className="action-btn reset-password"
                                        onClick={() => handlePasswordReset(user.id, user.email)}
                                        disabled={actionLoading === user.id + '-reset'}
                                    >
                                        {actionLoading === user.id + '-reset' ? (
                                            <span className="btn-spinner"></span>
                                        ) : (
                                            <><KeyRound size={16} /> Reset Password</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default UsersTab;
