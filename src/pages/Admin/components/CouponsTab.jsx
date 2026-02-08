import React from 'react';
import { Ticket, Plus, Edit, Trash2, ToggleLeft, ToggleRight, X } from 'lucide-react';

const CouponsTab = ({
    coupons,
    loading,
    form,
    setForm,
    showModal,
    editingCoupon,
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
        <div className="coupons-content">
            {/* Coupons Toolbar */}
            <div className="coupons-toolbar">
                <div className="coupons-info">
                    <Ticket size={18} />
                    <span>{coupons.length} coupons</span>
                </div>
                <button className="add-coupon-btn" onClick={openAddModal}>
                    <Plus size={18} />
                    <span>Add Coupon</span>
                </button>
            </div>

            {/* Coupons Grid */}
            <div className="coupons-grid">
                {coupons.map(coupon => (
                    <div key={coupon._id} className={`coupon-card ${!coupon.isActive ? 'inactive' : ''}`}>
                        <div className="coupon-card-header">
                            <span className="coupon-code">{coupon.code}</span>
                            <button
                                className={`toggle-btn ${coupon.isActive ? 'active' : ''}`}
                                onClick={() => toggleActive(coupon._id)}
                                title={coupon.isActive ? 'Deactivate' : 'Activate'}
                            >
                                {coupon.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                            </button>
                        </div>
                        <div className="coupon-card-body">
                            <div className="coupon-discount">
                                {coupon.discountType === 'percentage'
                                    ? `${coupon.discountValue}% OFF`
                                    : `₹${coupon.discountValue} OFF`
                                }
                            </div>
                            <div className="coupon-details">
                                {coupon.minOrderAmount > 0 && (
                                    <span>Min: ₹{coupon.minOrderAmount}</span>
                                )}
                                {coupon.maxDiscount && coupon.discountType === 'percentage' && (
                                    <span>Max: ₹{coupon.maxDiscount}</span>
                                )}
                                {coupon.usageLimit && (
                                    <span>Uses: {coupon.usedCount}/{coupon.usageLimit}</span>
                                )}
                                {!coupon.usageLimit && (
                                    <span>Uses: {coupon.usedCount}/∞</span>
                                )}
                            </div>
                            {coupon.expiresAt && (
                                <div className="coupon-expiry">
                                    Expires: {new Date(coupon.expiresAt).toLocaleDateString('en-IN')}
                                </div>
                            )}
                        </div>
                        <div className="coupon-card-actions">
                            <button className="edit-btn" onClick={() => openEditModal(coupon)}>
                                <Edit size={16} />
                                Edit
                            </button>
                            <button className="delete-btn" onClick={() => setShowDeleteConfirm(coupon._id)}>
                                <Trash2 size={16} />
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {coupons.length === 0 && (
                <div className="no-coupons-admin">
                    <Ticket size={48} />
                    <p>No coupons found</p>
                    <button className="add-coupon-btn" onClick={openAddModal}>
                        <Plus size={18} />
                        <span>Create First Coupon</span>
                    </button>
                </div>
            )}

            {/* Coupon Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="coupon-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingCoupon ? '✏️ Edit Coupon' : '➕ Add New Coupon'}</h3>
                            <button className="modal-close-btn" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="coupon-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Coupon Code *</label>
                                    <input
                                        type="text"
                                        value={form.code}
                                        onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g., SAVE20"
                                        required
                                        style={{ textTransform: 'uppercase' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Discount Type *</label>
                                    <select
                                        value={form.discountType}
                                        onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                                        required
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Discount Value *</label>
                                    <input
                                        type="number"
                                        value={form.discountValue}
                                        onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                                        placeholder={form.discountType === 'percentage' ? 'e.g., 20' : 'e.g., 50'}
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Min Order Amount</label>
                                    <input
                                        type="number"
                                        value={form.minOrderAmount}
                                        onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                                        placeholder="0 = No minimum"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                {form.discountType === 'percentage' && (
                                    <div className="form-group">
                                        <label>Max Discount (₹)</label>
                                        <input
                                            type="number"
                                            value={form.maxDiscount}
                                            onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                                            placeholder="Leave empty for no cap"
                                            min="1"
                                        />
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Usage Limit</label>
                                    <input
                                        type="number"
                                        value={form.usageLimit}
                                        onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                                        placeholder="Leave empty for unlimited"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Expiry Date</label>
                                <input
                                    type="date"
                                    value={form.expiresAt}
                                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                                />
                                <small className="form-hint">Leave empty for no expiry</small>
                            </div>

                            <div className="modal-form-actions">
                                <button type="button" className="btn-cancel" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-save" disabled={loading}>
                                    {loading ? 'Saving...' : (editingCoupon ? 'Update Coupon' : 'Add Coupon')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Coupon Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>⚠️ Delete Coupon</h3>
                        <p>Are you sure you want to delete this coupon?</p>
                        <p className="warning-text">This action cannot be undone!</p>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowDeleteConfirm(null)}>
                                Cancel
                            </button>
                            <button className="btn-delete" onClick={() => handleDelete(showDeleteConfirm)}>
                                Delete Coupon
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CouponsTab;

