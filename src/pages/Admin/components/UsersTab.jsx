import React, { useState } from 'react';
import {
    Users, Search, X, ShieldOff, Shield, Mail, KeyRound,
    Calendar, ShoppingBag, IndianRupee, AlertCircle, CheckCircle, Award
} from 'lucide-react';

import { adminApi } from '../../../services/api';
import './UsersTab.css'; // Assuming you might want to create this, or keep inline styles

const UsersTab = ({
    users,
    filteredUsers,
    loading,
    userSearch,
    setUserSearch,
    toggleBlockUser,
    sendPasswordReset,
    refreshUsers
}) => {
    const [actionLoading, setActionLoading] = useState(null);
    const [toast, setToast] = useState(null);

    // Badge Management State
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [allBadges, setAllBadges] = useState([]);
    const [selectedBadgeIds, setSelectedBadgeIds] = useState([]);
    const [ownedBadgeIds, setOwnedBadgeIds] = useState([]);
    const [badgesLoading, setBadgesLoading] = useState(false);

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

    const handleManageBadges = async (user) => {
        setSelectedUser(user);
        setShowBadgeModal(true);
        setBadgesLoading(true);

        // Pre-select user's current badges
        // User.badges is array of objects { badge: { _id, name... }, ... }
        const currentIds = user.badges?.map(b => b.badge._id || b.badge) || [];
        setSelectedBadgeIds(currentIds);
        setOwnedBadgeIds(currentIds);

        try {
            const badges = await adminApi.getBadges();
            console.log('Fetched badges:', badges);
            setAllBadges(badges);
        } catch (error) {
            console.error('Badge fetch error:', error);
            showToast('Failed to fetch badges', 'error');
        } finally {
            setBadgesLoading(false);
        }
    };

    const toggleBadge = (badgeId) => {
        setSelectedBadgeIds(prev => {
            if (prev.includes(badgeId)) {
                return prev.filter(id => id !== badgeId);
            } else {
                return [...prev, badgeId];
            }
        });
    };

    const saveBadges = async () => {
        if (!selectedUser) return;

        setBadgesLoading(true); // Reuse loading state for saving
        try {
            await adminApi.updateUserBadges(selectedUser.id, selectedBadgeIds);
            showToast('Badges updated successfully!', 'success');
            setShowBadgeModal(false);
            if (refreshUsers) refreshUsers();
        } catch (error) {
            showToast('Failed to update badges', 'error');
        } finally {
            setBadgesLoading(false);
        }
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
                                <div className="header-actions">
                                    <span className={`user-status-badge ${user.isBlocked ? 'blocked' : 'active'}`}>
                                        {user.isBlocked ? (
                                            <><ShieldOff size={12} /> Blocked</>
                                        ) : (
                                            <><Shield size={12} /> Active</>
                                        )}
                                    </span>
                                </div>
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
                                    {user.badges && user.badges.length > 0 && (
                                        <span className="badges-count-badge">
                                            <Award size={12} /> {user.badges.length} Badges
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="user-card-actions">
                                <button
                                    className="action-btn badge-btn"
                                    onClick={() => handleManageBadges(user)}
                                >
                                    <Award size={16} /> Badges
                                </button>

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
                                            <><KeyRound size={16} /> Reset</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Badge Management Modal */}
            {showBadgeModal && (
                <div className="modal-overlay" onClick={() => setShowBadgeModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h3>Manage Badges for {selectedUser?.name || selectedUser?.username}</h3>
                            <button className="close-btn" onClick={() => setShowBadgeModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {badgesLoading && allBadges.length === 0 ? (
                                <div className="loader-container"><div className="spinner"></div></div>
                            ) : allBadges.length === 0 ? (
                                <p>No badges available to assign.</p>
                            ) : (
                                <div className="badge-selection-grid">
                                    {allBadges.map(badge => (
                                        <div
                                            key={badge._id}
                                            className={`badge-select-item ${selectedBadgeIds.includes(badge._id) ? 'selected' : ''}`}
                                            onClick={() => toggleBadge(badge._id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedBadgeIds.includes(badge._id)}
                                                onChange={() => { }} // Handled by div click
                                                readOnly
                                            />
                                            <img src={badge.image} alt={badge.name} className="badge-mini-preview" />
                                            <div className="badge-select-info">
                                                <span className="badge-select-name">
                                                    {badge.name}
                                                    {ownedBadgeIds.includes(badge._id) && (
                                                        <span className="owned-label" style={{
                                                            fontSize: '0.7em',
                                                            marginLeft: '8px',
                                                            color: '#22c55e',
                                                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            border: '1px solid rgba(34, 197, 94, 0.2)'
                                                        }}>
                                                            Owned
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="badge-select-rarity" style={{ color: badge.color }}>{badge.rarity}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={() => setShowBadgeModal(false)}>Cancel</button>
                            <button className="save-btn" onClick={saveBadges} disabled={badgesLoading}>
                                {badgesLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsersTab;

