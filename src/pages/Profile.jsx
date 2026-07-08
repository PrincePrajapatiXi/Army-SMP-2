import React, { useState, useEffect, useRef } from 'react';
import { motion, Reorder } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    User, Mail, AtSign, Lock, Save, X, Edit2, LogOut,
    AlertCircle, CheckCircle, Eye, EyeOff, Shield, Calendar, Gamepad2, KeyRound, Camera, Loader
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/api';
import './Profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, isLoading: authLoading, updateProfile, changePassword, logout } = useAuth();

    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [formData, setFormData] = useState({
        minecraftUsername: '',
        phone: ''
    });
    const [userBadges, setUserBadges] = useState([]);

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [setPasswordFormData, setSetPasswordFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isSettingPassword, setIsSettingPassword] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const avatarInputRef = React.useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, authLoading, navigate]);

    // Initialize form data when user loads
    useEffect(() => {
        if (user) {
            setFormData({
                minecraftUsername: user.minecraftUsername || '',
                phone: user.phone || ''
            });
            if (user.badges) {
                const validBadges = user.badges
                    .filter(b => b.badge && b.badge.name && b.badge.isActive !== false)
                    .map(b => ({
                        badge: b.badge,
                        assignedAt: b.assignedAt,
                        id: b.badge._id || b.badge
                    }));
                setUserBadges(validBadges);
            }
        }
    }, [user]);

    const handleReorder = (newBadges) => {
        setUserBadges(newBadges);
    };

    const handleDragEnd = async () => {
        try {
            const badgeIds = userBadges.map(b => b.id);
            await userApi.reorderBadges(badgeIds);
        } catch (error) {
            console.error("Failed to save badge order", error);
            setError("Failed to save new badge layout.");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be less than 5MB');
            return;
        }

        setAvatarUploading(true);
        setError('');

        try {
            const result = await userApi.updateAvatar(file);
            if (result.success) {
                setSuccess('Avatar updated successfully!');
                window.location.reload();
            } else {
                setError(result.message || 'Failed to upload avatar');
            }
        } catch (err) {
            setError(err.message || 'Failed to upload avatar');
        } finally {
            setAvatarUploading(false);
        }
    };

    const handleSaveProfile = async () => {
        setError('');
        setSuccess('');

        if (formData.minecraftUsername && formData.minecraftUsername.length < 3) {
            setError('Minecraft Username must be at least 3 characters');
            return;
        }

        setIsLoading(true);

        try {
            const result = await updateProfile(formData);

            if (result.success) {
                setSuccess('Profile updated successfully!');
                setIsEditing(false);
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(result.message || 'Failed to update profile');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        setError('');
        setSuccess('');

        if (!passwordData.currentPassword) {
            setError('Please enter your current password');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            const result = await changePassword(passwordData.currentPassword, passwordData.newPassword);

            if (result.success) {
                setSuccess('Password changed successfully!');
                setIsChangingPassword(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(result.message || 'Failed to change password');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setFormData({
            minecraftUsername: user?.minecraftUsername || '',
            phone: user?.phone || ''
        });
        setError('');
    };

    const cancelPasswordChange = () => {
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setError('');
    };

    const handleSetPasswordChange = (e) => {
        const { name, value } = e.target;
        setSetPasswordFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSetPassword = async () => {
        setError('');
        setSuccess('');

        if (setPasswordFormData.newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (setPasswordFormData.newPassword !== setPasswordFormData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            const result = await userApi.setPassword(
                setPasswordFormData.newPassword,
                setPasswordFormData.confirmPassword
            );

            if (result.success) {
                setSuccess('Password set successfully! You can now login with email/password or Google.');
                setIsSettingPassword(false);
                setSetPasswordFormData({ newPassword: '', confirmPassword: '' });
                // Refresh user data
                window.location.reload();
            } else {
                setError(result.message || 'Failed to set password');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const cancelSetPassword = () => {
        setIsSettingPassword(false);
        setSetPasswordFormData({ newPassword: '', confirmPassword: '' });
        setError('');
    };

    if (authLoading || !user) {
        return (
            <div className="profile-page">
                <div className="profile-loading">
                    <div className="spinner-large"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <div
                        className="profile-avatar"
                        onClick={() => avatarInputRef.current?.click()}
                        style={{ cursor: 'pointer', position: 'relative' }}
                        title="Click to change avatar"
                    >
                        {avatarUploading ? (
                            <div className="avatar-loading">
                                <Loader className="spinner" size={32} />
                            </div>
                        ) : user.avatar ? (
                            <img src={user.avatar} alt={user.name} />
                        ) : (
                            <div className="avatar-placeholder">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                        <div className="avatar-overlay">
                            <Camera size={24} />
                        </div>
                        <div className="avatar-status">
                            {user.isEmailVerified ? (
                                <CheckCircle size={16} color="#22c55e" />
                            ) : (
                                <AlertCircle size={16} color="#f59e0b" />
                            )}
                        </div>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            hidden
                        />
                    </div>
                    <div className="profile-info">
                        <div className="name-row">
                            <h1>{user.minecraftUsername || user.username || 'Set Username'}</h1>
                            <div className="status-badges">
                                {user.isEmailVerified ? (
                                    <span className="badge verified" title="Email Verified">
                                        <Shield size={12} />
                                        Verified
                                    </span>
                                ) : (
                                    <span className="badge unverified" title="Email Not Verified">
                                        <AlertCircle size={12} />
                                        Unverified
                                    </span>
                                )}
                                <span className="badge provider">
                                    {user.authProvider === 'google' ? 'Google' :
                                        user.authProvider === 'facebook' ? 'Facebook' :
                                            user.authProvider === 'discord' ? 'Discord' : 'Email'}
                                </span>
                            </div>
                        </div>

                        {/* Custom Rank Badges Section */}
                        {userBadges && userBadges.length > 0 && (
                            <div className="rank-badges-section">
                                <div className="badges-section-header" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <span className="badges-count-label">🎖️ {userBadges.length} Badge{userBadges.length !== 1 ? 's' : ''} Earned</span>
                                    <span className="badges-hint-label" style={{ fontSize: '0.75rem', color: '#8b949e', fontStyle: 'italic', textTransform: 'none' }}>(Drag to reorder)</span>
                                </div>
                                <Reorder.Group 
                                    axis="y" 
                                    values={userBadges} 
                                    onReorder={handleReorder} 
                                    className="badges-grid-display"
                                    as="div"
                                >
                                    {userBadges.map((badgeObj) => {
                                        const { badge, assignedAt, id } = badgeObj;
                                        return (
                                        <Reorder.Item 
                                            key={id} 
                                            value={badgeObj}
                                            className="badge-wrapper-container"
                                            onDragEnd={handleDragEnd}
                                            whileDrag={{ scale: 1.05, zIndex: 10, cursor: 'grabbing' }}
                                            style={{ cursor: 'grab' }}
                                        >
                                            <div
                                                className={`rank-badge-item rarity-${badge.rarity || 'common'}`}
                                                style={{
                                                    '--badge-color': badge.color || '#f97316'
                                                }}
                                            >
                                                {badge.image && <img src={badge.image} alt="" draggable="false" />}
                                                <span>{badge.name}</span>
                                            </div>

                                            {/* Styled Tooltip */}
                                            <div className="badge-tooltip">
                                                <div className="badge-tooltip-header">
                                                    {badge.image && <img src={badge.image} alt="" className="tooltip-badge-img" draggable="false" />}
                                                    <div>
                                                        <div className="tooltip-name">{badge.name}</div>
                                                        <div className={`tooltip-rarity rarity-text-${badge.rarity || 'common'}`}>
                                                            {(badge.rarity || 'common').toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>
                                                {badge.description && (
                                                    <div className="tooltip-description">{badge.description}</div>
                                                )}
                                                {assignedAt && (
                                                    <div className="tooltip-date">
                                                        Earned {new Date(assignedAt).toLocaleDateString('en-IN', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </Reorder.Item>
                                    )})}
                                </Reorder.Group>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="profile-alert error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="profile-alert success">
                        <CheckCircle size={18} />
                        <span>{success}</span>
                    </div>
                )}

                <div className="profile-section">
                    <div className="section-header">
                        <h2>
                            <User size={20} />
                            Profile Information
                        </h2>
                        {!isEditing ? (
                            <button className="edit-btn" onClick={() => setIsEditing(true)}>
                                <Edit2 size={16} />
                                Edit
                            </button>
                        ) : (
                            <div className="edit-actions">
                                <button className="cancel-btn" onClick={cancelEdit} disabled={isLoading}>
                                    <X size={16} />
                                    Cancel
                                </button>
                                <button className="save-btn" onClick={handleSaveProfile} disabled={isLoading}>
                                    {isLoading ? <span className="spinner"></span> : <Save size={16} />}
                                    Save
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="profile-fields">
                        <div className="field">
                            <label>
                                <Mail size={16} />
                                Email
                            </label>
                            <span className="non-editable">
                                {user.email}
                                {!user.isEmailVerified && (
                                    <button className="verify-link" onClick={() => navigate('/verify-email')}>
                                        Verify
                                    </button>
                                )}
                            </span>
                        </div>

                        <div className="field">
                            <label>
                                <Gamepad2 size={16} />
                                Minecraft Username
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="minecraftUsername"
                                    value={formData.minecraftUsername}
                                    onChange={handleChange}
                                    placeholder="Your in-game username"
                                    disabled={isLoading}
                                />
                            ) : (
                                <span>{user.minecraftUsername || 'Not set'}</span>
                            )}
                        </div>

                        <div className="field">
                            <label>
                                <Calendar size={16} />
                                Member Since
                            </label>
                            <span>{new Date(user.createdAt).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</span>
                        </div>
                    </div>
                </div>

                {/* Security Section - Show for all users */}
                <div className="profile-section">
                    <div className="section-header">
                        <h2>
                            <Lock size={20} />
                            Security
                        </h2>
                    </div>

                    {/* For OAuth users without password - show Set Password */}
                    {user.authProvider !== 'local' && (
                        <>
                            <p className="oauth-info" style={{ color: '#9ca3af', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                You're signed in with {user.authProvider === 'google' ? 'Google' : user.authProvider}.
                                Set a password to also enable email/password login.
                            </p>
                            {!isSettingPassword ? (
                                <button className="change-password-btn" onClick={() => setIsSettingPassword(true)}>
                                    <KeyRound size={16} />
                                    Set Password
                                </button>
                            ) : (
                                <div className="password-form">
                                    <div className="field">
                                        <label>New Password</label>
                                        <div className="password-input">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                name="newPassword"
                                                value={setPasswordFormData.newPassword}
                                                onChange={handleSetPasswordChange}
                                                placeholder="Enter at least 6 characters"
                                                disabled={isLoading}
                                            />
                                            <button
                                                type="button"
                                                className="toggle-password"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="field">
                                        <label>Confirm Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={setPasswordFormData.confirmPassword}
                                            onChange={handleSetPasswordChange}
                                            placeholder="Confirm your password"
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="password-actions">
                                        <button className="cancel-btn" onClick={cancelSetPassword} disabled={isLoading}>
                                            Cancel
                                        </button>
                                        <button className="save-btn" onClick={handleSetPassword} disabled={isLoading}>
                                            {isLoading ? <span className="spinner"></span> : <Save size={16} />}
                                            Set Password
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* For local users - show Change Password */}
                    {user.authProvider === 'local' && (
                        <>
                            {!isChangingPassword ? (
                                <button className="change-password-btn" onClick={() => setIsChangingPassword(true)}>
                                    <Lock size={16} />
                                    Change Password
                                </button>
                            ) : (
                                <div className="password-form">
                                    <div className="field">
                                        <label>Current Password</label>
                                        <div className="password-input">
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                name="currentPassword"
                                                value={passwordData.currentPassword}
                                                onChange={handlePasswordChange}
                                                disabled={isLoading}
                                            />
                                            <button
                                                type="button"
                                                className="toggle-password"
                                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            >
                                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="field">
                                        <label>New Password</label>
                                        <div className="password-input">
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                name="newPassword"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordChange}
                                                disabled={isLoading}
                                            />
                                            <button
                                                type="button"
                                                className="toggle-password"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                            >
                                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="field">
                                        <label>Confirm New Password</label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            disabled={isLoading}
                                        />
                                    </div>

                                    <div className="password-actions">
                                        <button className="cancel-btn" onClick={cancelPasswordChange} disabled={isLoading}>
                                            Cancel
                                        </button>
                                        <button className="save-btn" onClick={handleChangePassword} disabled={isLoading}>
                                            {isLoading ? <span className="spinner"></span> : <Save size={16} />}
                                            Update Password
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="profile-section danger-zone">
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={16} />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;

