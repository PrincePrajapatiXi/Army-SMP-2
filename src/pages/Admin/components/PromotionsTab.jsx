import React from 'react';
import { Megaphone, Plus, Edit, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';
import ImageUploader from '../../../components/ImageUploader';

const PromotionsTab = ({
    promotions,
    loading,
    form,
    setForm,
    showModal,
    editingPromotion,
    showDeleteConfirm,
    setShowDeleteConfirm,
    openAddModal,
    openEditModal,
    handleSubmit,
    handleDelete,
    toggleActive,
    closeModal
}) => {
    return (
        <div className="promotions-content">
            {/* Promotions Toolbar */}
            <div className="coupons-toolbar">
                <div className="coupons-info">
                    <Megaphone size={18} />
                    <span>{promotions.length} promotion banners</span>
                </div>
                <button className="add-coupon-btn" onClick={openAddModal}>
                    <Plus size={18} />
                    <span>Add Banner</span>
                </button>
            </div>

            {/* Promotions Grid */}
            <div className="coupons-grid">
                {promotions.map(promo => (
                    <div
                        key={promo._id}
                        className={`coupon-card promo-card ${!promo.isActive ? 'inactive' : ''}`}
                        style={{ borderColor: promo.isActive ? '#22c55e' : '#6b7280' }}
                    >
                        <div className="coupon-card-header">
                            <div className="promo-position">#{promo.position}</div>
                            <button
                                className={`toggle-btn ${promo.isActive ? 'active' : ''}`}
                                onClick={() => toggleActive(promo._id)}
                                title={promo.isActive ? 'Deactivate' : 'Activate'}
                            >
                                {promo.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                            </button>
                        </div>
                        <div className="promo-card-preview">
                            <img
                                src={promo.logo}
                                alt={promo.name}
                                onError={(e) => { e.target.src = '/images/stone.png'; }}
                            />
                        </div>
                        <div className="coupon-card-body">
                            <div className="coupon-code promo-name">{promo.name}</div>
                            <div className="coupon-details promo-tagline">
                                <span>{promo.tagline}</span>
                            </div>
                            <div className="promo-link">
                                <a
                                    href={promo.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="promo-link-anchor"
                                >
                                    🔗 {promo.link?.includes('discord') ? 'Discord' :
                                        promo.link?.includes('youtube') ? 'YouTube' :
                                            promo.link?.includes('instagram') ? 'Instagram' :
                                                promo.link?.includes('twitter') || promo.link?.includes('x.com') ? 'Twitter' :
                                                    promo.buttonText || 'Visit Link'}
                                </a>
                            </div>
                        </div>
                        <div className="coupon-card-actions">
                            <button className="edit-btn" onClick={() => openEditModal(promo)}>
                                <Edit size={14} />
                                Edit
                            </button>
                            <button className="delete-btn" onClick={() => setShowDeleteConfirm(promo._id)}>
                                <Trash2 size={14} />
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Promotion Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content coupon-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingPromotion ? '✏️ Edit Promotion' : '➕ Add Promotion'}</h3>
                            <button className="modal-close" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="coupon-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Sponsor Name *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Enter sponsor name"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Position</label>
                                    <input
                                        type="number"
                                        value={form.position}
                                        onChange={(e) => setForm({ ...form, position: e.target.value })}
                                        placeholder="Slide order (1, 2, 3...)"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Tagline</label>
                                <input
                                    type="text"
                                    value={form.tagline}
                                    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                                    placeholder="Short catchy tagline"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description *</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Describe the sponsor in detail..."
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Features (comma separated)</label>
                                <input
                                    type="text"
                                    value={form.features}
                                    onChange={(e) => setForm({ ...form, features: e.target.value })}
                                    placeholder="Feature 1, Feature 2, Feature 3"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Link *</label>
                                    <input
                                        type="url"
                                        value={form.link}
                                        onChange={(e) => setForm({ ...form, link: e.target.value })}
                                        placeholder="https://example.com"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Button Text</label>
                                    <input
                                        type="text"
                                        value={form.buttonText}
                                        onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                                        placeholder="Visit Website"
                                    />
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label>Sponsor Logo</label>
                                <ImageUploader
                                    value={form.logo}
                                    onChange={(url) => setForm({ ...form, logo: url })}
                                    placeholder="Drag & drop sponsor logo"
                                />
                            </div>

                            <div className="form-group">
                                <label>Gradient</label>
                                <select
                                    value={form.gradient}
                                    onChange={(e) => setForm({ ...form, gradient: e.target.value })}
                                >
                                    <option value="linear-gradient(135deg, #1e3a5f, #0d1b2a)">Blue</option>
                                    <option value="linear-gradient(135deg, #4a1942, #2d132c)">Purple</option>
                                    <option value="linear-gradient(135deg, #1a4731, #0d2818)">Green</option>
                                    <option value="linear-gradient(135deg, #5c3c1e, #2d1e0e)">Brown</option>
                                    <option value="linear-gradient(135deg, #3d2c5a, #1e1630)">Violet</option>
                                    <option value="linear-gradient(135deg, #5a2c2c, #301616)">Red</option>
                                </select>
                            </div>

                            <div className="form-actions">
                                <button type="button" className="btn-cancel" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit">
                                    {loading ? 'Saving...' : (editingPromotion ? 'Update' : 'Add Banner')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Promotion Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>⚠️ Delete Promotion</h3>
                        <p>Are you sure you want to delete this promotion banner?</p>
                        <p className="warning-text">This action cannot be undone!</p>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowDeleteConfirm(null)}>
                                Cancel
                            </button>
                            <button className="btn-delete" onClick={() => handleDelete(showDeleteConfirm)}>
                                Delete Banner
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromotionsTab;

