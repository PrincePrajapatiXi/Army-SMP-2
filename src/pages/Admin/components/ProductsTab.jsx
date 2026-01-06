import React, { useState, useMemo } from 'react';
import { Box, Plus, Edit, Trash2, X, Star, Filter } from 'lucide-react';
import ImageUploader from '../../../components/ImageUploader';

const categories = [
    { id: 'all', label: 'All Products' },
    { id: 'ranks', label: 'Ranks' },
    { id: 'keys', label: 'Keys' },
    { id: 'crates', label: 'Crates' },
    { id: 'kits', label: 'Kits' },
    { id: 'coins', label: 'Coins' }
];

const ProductsTab = ({
    products,
    loading,
    form,
    setForm,
    showModal,
    editingProduct,
    showDeleteConfirm,
    setShowDeleteConfirm,
    openAddModal,
    openEditModal,
    handleSubmit,
    handleDelete,
    closeModal
}) => {
    const [activeCategory, setActiveCategory] = useState('all');

    // Filter products by category
    const filteredProducts = useMemo(() => {
        if (activeCategory === 'all') return products;
        return products.filter(p => p.category === activeCategory);
    }, [products, activeCategory]);

    // Group products by category for display
    const groupedProducts = useMemo(() => {
        const groups = {};
        filteredProducts.forEach(product => {
            const cat = product.category || 'items';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(product);
        });
        return groups;
    }, [filteredProducts]);

    return (
        <div className="products-content">
            {/* Category Filter Tabs */}
            <div className="category-filter-tabs">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                    >
                        {cat.label}
                        {cat.id !== 'all' && (
                            <span className="category-count">
                                {products.filter(p => p.category === cat.id).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Products Toolbar */}
            <div className="products-toolbar">
                <div className="products-info">
                    <Box size={18} />
                    <span>{filteredProducts.length} products</span>
                    {activeCategory !== 'all' && (
                        <span className="filter-badge">
                            <Filter size={14} />
                            {categories.find(c => c.id === activeCategory)?.label}
                        </span>
                    )}
                </div>
                <button className="add-product-btn" onClick={openAddModal}>
                    <Plus size={18} />
                    <span>Add Product</span>
                </button>
            </div>

            {/* Products Grid - Grouped by Category */}
            {activeCategory === 'all' ? (
                Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                    <div key={category} className="category-section">
                        <h3 className="category-section-title">
                            {categories.find(c => c.id === category)?.label || category}
                            <span className="category-section-count">{categoryProducts.length}</span>
                        </h3>
                        <div className="products-grid">
                            {categoryProducts.map(product => (
                                <div
                                    key={product.id}
                                    className="admin-product-card"
                                    style={{ borderColor: product.color || 'var(--card-border)' }}
                                >
                                    <div className="product-card-image">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            onError={(e) => { e.target.src = '/images/stone.png'; }}
                                        />
                                    </div>
                                    <div className="product-card-info">
                                        <h4>{product.name}</h4>
                                        <span className="product-category">{product.category}</span>
                                        <span className="product-price">{product.priceDisplay}</span>
                                    </div>
                                    <div className="product-card-actions">
                                        <button className="edit-btn" onClick={() => openEditModal(product)}>
                                            <Edit size={16} /> Edit
                                        </button>
                                        <button className="delete-btn" onClick={() => setShowDeleteConfirm(product.id)}>
                                            <Trash2 size={16} /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            ) : (
                <div className="products-grid">
                    {filteredProducts.map(product => (
                        <div
                            key={product.id}
                            className="admin-product-card"
                            style={{ borderColor: product.color || 'var(--card-border)' }}
                        >
                            <div className="product-card-image">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    onError={(e) => { e.target.src = '/images/stone.png'; }}
                                />
                            </div>
                            <div className="product-card-info">
                                <h4>{product.name}</h4>
                                <span className="product-category">{product.category}</span>
                                <span className="product-price">{product.priceDisplay}</span>
                            </div>
                            <div className="product-card-actions">
                                <button className="edit-btn" onClick={() => openEditModal(product)}>
                                    <Edit size={16} /> Edit
                                </button>
                                <button className="delete-btn" onClick={() => setShowDeleteConfirm(product.id)}>
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredProducts.length === 0 && (
                <div className="no-products-admin">
                    <Box size={48} />
                    <p>No products found {activeCategory !== 'all' ? `in ${categories.find(c => c.id === activeCategory)?.label}` : ''}</p>
                    <button className="add-product-btn" onClick={openAddModal}>
                        <Plus size={18} />
                        <span>Add First Product</span>
                    </button>
                </div>
            )}

            {/* Product Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="product-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingProduct ? '✏️ Edit Product' : '➕ Add New Product'}</h3>
                            <button className="modal-close-btn" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="product-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Product Name *</label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g., Diamond Rank"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Price (₹) *</label>
                                    <input
                                        type="number"
                                        value={form.price}
                                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                                        placeholder="e.g., 100"
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Category *</label>
                                    <select
                                        value={form.category}
                                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        required
                                    >
                                        <option value="ranks">Ranks</option>
                                        <option value="keys">Keys</option>
                                        <option value="crates">Crates</option>
                                        <option value="kits">Kits</option>
                                        <option value="coins">Coins</option>
                                        <option value="items">Items</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Color</label>
                                    <div className="color-input-wrapper">
                                        <input
                                            type="color"
                                            value={form.color}
                                            onChange={(e) => setForm({ ...form, color: e.target.value })}
                                            className="color-picker"
                                        />
                                        <input
                                            type="text"
                                            value={form.color}
                                            onChange={(e) => setForm({ ...form, color: e.target.value })}
                                            placeholder="#ffffff"
                                            className="color-text"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Featured Checkbox */}
                            <div className="form-group featured-toggle">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={form.isFeatured || false}
                                        onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                                    />
                                    <Star size={16} />
                                    <span>Featured Rank (Show on Homepage)</span>
                                </label>
                            </div>

                            <div className="form-group">
                                <label>Product Image</label>
                                <ImageUploader
                                    value={form.image}
                                    onChange={(url) => setForm({ ...form, image: url })}
                                    placeholder="Drag & drop product image"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Brief description of the product..."
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label>Features (comma separated) {form.isFeatured && <span className="required-hint">- Required for Featured</span>}</label>
                                <textarea
                                    value={form.features}
                                    onChange={(e) => setForm({ ...form, features: e.target.value })}
                                    placeholder="Priority Queue, Green Name Color, 1x Kit Key..."
                                    rows={2}
                                />
                            </div>

                            <div className="modal-form-actions">
                                <button type="button" className="btn-cancel" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-save" disabled={loading}>
                                    {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Add Product')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Product Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>⚠️ Delete Product</h3>
                        <p>Are you sure you want to delete this product?</p>
                        <p className="warning-text">This action cannot be undone!</p>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowDeleteConfirm(null)}>
                                Cancel
                            </button>
                            <button className="btn-delete" onClick={() => handleDelete(showDeleteConfirm)}>
                                Delete Product
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsTab;

