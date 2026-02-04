import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, X, Save, Image, Loader, Award } from 'lucide-react';
import { adminApi } from '../../../services/api';
import './BadgesTab.css';

// Use logic consistent with api.js
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = (import.meta.env.VITE_API_URL || (isLocalhost ? 'http://localhost:5000' : 'https://army-smp-2.onrender.com')) + '/api';

const RARITY_COLORS = {
    common: '#9ca3af',
    rare: '#3b82f6',
    epic: '#a855f7',
    legendary: '#f59e0b'
};

const BadgesTab = () => {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingBadge, setEditingBadge] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: '',
        color: '#f97316',
        rarity: 'common'
    });

    useEffect(() => {
        fetchBadges();
    }, []);

    const fetchBadges = async () => {
        try {
            setLoading(true);
            const data = await adminApi.getBadges();
            setBadges(Array.isArray(data) ? data : []);
        } catch (err) {
            setError('Failed to fetch badges');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setError(''); // Clear previous errors
        const formDataUpload = new FormData();
        formDataUpload.append('image', file);

        try {
            const token = sessionStorage.getItem('adminToken');
            console.log('Uploading with token:', token ? 'Token exists' : 'No token');

            const response = await fetch(`${API_BASE_URL}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formDataUpload
            });
            const data = await response.json();

            if (response.ok && data.success) {
                setFormData(prev => ({ ...prev, image: data.url }));
                setSuccess('Image uploaded!');
                setTimeout(() => setSuccess(''), 2000);
            } else {
                console.error('Upload failed response:', data);
                setError(data.message || data.error || 'Upload failed');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim() || !formData.image) {
            setError('Badge name and image are required');
            return;
        }

        try {
            setLoading(true);
            if (editingBadge) {
                await adminApi.updateBadge(editingBadge._id, formData);
                setSuccess('Badge updated successfully!');
            } else {
                await adminApi.createBadge(formData);
                setSuccess('Badge created successfully!');
            }
            fetchBadges();
            closeModal();
        } catch (err) {
            setError(err.message || 'Failed to save badge');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (badge) => {
        if (!window.confirm(`Delete badge "${badge.name}"? This will remove it from all users.`)) return;

        try {
            await adminApi.deleteBadge(badge._id);
            setSuccess('Badge deleted!');
            fetchBadges();
        } catch (err) {
            setError('Failed to delete badge');
        }
    };

    const openEditModal = (badge) => {
        setEditingBadge(badge);
        setFormData({
            name: badge.name,
            description: badge.description || '',
            image: badge.image,
            color: badge.color || '#f97316',
            rarity: badge.rarity || 'common'
        });
        setShowModal(true);
    };

    const openCreateModal = () => {
        setEditingBadge(null);
        setFormData({
            name: '',
            description: '',
            image: '',
            color: '#f97316',
            rarity: 'common'
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingBadge(null);
        setError('');
    };

    if (loading && badges.length === 0) {
        return (
            <div className="badges-loading">
                <Loader className="spinner" size={24} />
                <span>Loading badges...</span>
            </div>
        );
    }

    return (
        <div className="badges-tab">
            <div className="badges-header">
                <h2><Award size={24} /> Manage Badges</h2>
                <button className="create-btn" onClick={openCreateModal}>
                    <Plus size={16} /> Create Badge
                </button>
            </div>

            {error && <div className="alert error">{error}</div>}
            {success && <div className="alert success">{success}</div>}

            <div className="badges-grid">
                {badges.map(badge => (
                    <div key={badge._id} className="badge-card" style={{ borderColor: badge.color }}>
                        <div className="badge-image">
                            <img src={badge.image} alt={badge.name} />
                        </div>
                        <div className="badge-info">
                            <h3>{badge.name}</h3>
                            <span className="rarity" style={{ color: RARITY_COLORS[badge.rarity] }}>
                                {badge.rarity?.toUpperCase()}
                            </span>
                            <p>{badge.description || 'No description'}</p>
                        </div>
                        <div className="badge-actions">
                            <button className="edit-btn" onClick={() => openEditModal(badge)}>
                                <Edit2 size={14} /> Edit
                            </button>
                            <button className="delete-btn" onClick={() => handleDelete(badge)}>
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    </div>
                ))}

                {badges.length === 0 && (
                    <div className="no-badges">
                        <Award size={48} />
                        <p>No badges created yet</p>
                        <button className="create-btn" onClick={openCreateModal}>
                            Create your first badge
                        </button>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingBadge ? 'Edit Badge' : 'Create Badge'}</h3>
                            <button className="close-btn" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Badge Image *</label>
                                <div className="image-upload" onClick={() => fileInputRef.current?.click()}>
                                    {formData.image ? (
                                        <img src={formData.image} alt="Preview" />
                                    ) : (
                                        <div className="placeholder">
                                            {uploading ? <Loader className="spinner" /> : <Image size={32} />}
                                            <span>{uploading ? 'Uploading...' : 'Click to upload'}</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    hidden
                                />
                            </div>

                            <div className="form-group">
                                <label>Badge Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="e.g., VIP, Early Supporter"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="What this badge represents..."
                                    rows={2}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Color</label>
                                    <div className="color-picker">
                                        <input
                                            type="color"
                                            value={formData.color}
                                            onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                        />
                                        <span>{formData.color}</span>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Rarity</label>
                                    <select
                                        value={formData.rarity}
                                        onChange={e => setFormData(prev => ({ ...prev, rarity: e.target.value }))}
                                    >
                                        <option value="common">Common</option>
                                        <option value="rare">Rare</option>
                                        <option value="epic">Epic</option>
                                        <option value="legendary">Legendary</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="cancel-btn" onClick={closeModal}>Cancel</button>
                            <button className="save-btn" onClick={handleSubmit} disabled={loading}>
                                {loading ? <Loader className="spinner" size={16} /> : <Save size={16} />}
                                {editingBadge ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BadgesTab;
