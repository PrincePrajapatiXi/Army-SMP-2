import React, { useState } from 'react';
import {
    Package, Filter, Trash2, Calendar, Search, X,
    CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

const OrdersTab = ({
    orders,
    filteredOrders,
    statusFilter,
    setStatusFilter,
    selectedOrders,
    setSelectedOrders,
    toggleSelectOrder,
    updateOrderStatus,
    handleBulkDelete,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    clearDateFilter,
    orderSearch,
    setOrderSearch
}) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const toggleSelectAll = () => {
        if (selectedOrders.length === filteredOrders.length) {
            setSelectedOrders([]);
        } else {
            setSelectedOrders(filteredOrders.map(o => o.id || o.orderNumber));
        }
    };

    const onBulkDelete = async () => {
        const success = await handleBulkDelete();
        if (success) {
            setShowDeleteConfirm(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle size={16} />;
            case 'cancelled': return <XCircle size={16} />;
            default: return <AlertCircle size={16} />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="orders-content">
            {/* Filters & Bulk Actions */}
            <div className="orders-toolbar">
                <div className="orders-filters">
                    {/* Search Box */}
                    <div className="order-search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            value={orderSearch}
                            onChange={(e) => setOrderSearch(e.target.value)}
                            className="search-input"
                        />
                        {orderSearch && (
                            <button
                                className="clear-search-btn"
                                onClick={() => setOrderSearch('')}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <Filter size={18} />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Orders</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    {/* Date Range Filter */}
                    <div className="date-filter">
                        <Calendar size={16} />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="date-input"
                            placeholder="From"
                        />
                        <span className="date-separator">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="date-input"
                            placeholder="To"
                        />
                        {(startDate || endDate) && (
                            <button className="clear-date-btn" onClick={clearDateFilter}>
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <span className="filter-count">{filteredOrders.length} orders</span>
                </div>

                {/* Bulk Actions */}
                <div className="bulk-actions">
                    <label className="select-all-checkbox">
                        <input
                            type="checkbox"
                            checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                            onChange={toggleSelectAll}
                        />
                        <span>Select All</span>
                    </label>
                    {selectedOrders.length > 0 && (
                        <button
                            className="bulk-delete-btn"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            <Trash2 size={16} />
                            Delete ({selectedOrders.length})
                        </button>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>⚠️ Confirm Delete</h3>
                        <p>Are you sure you want to delete {selectedOrders.length} order(s)?</p>
                        <p className="warning-text">This action cannot be undone!</p>
                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-delete"
                                onClick={onBulkDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Orders List */}
            <div className="orders-list-admin">
                {filteredOrders.map(order => (
                    <div
                        key={order.id || order.orderNumber}
                        className={`admin-order-card ${selectedOrders.includes(order.id || order.orderNumber) ? 'selected' : ''}`}
                    >
                        <div className="order-card-header">
                            <div className="order-select-info">
                                <input
                                    type="checkbox"
                                    checked={selectedOrders.includes(order.id || order.orderNumber)}
                                    onChange={() => toggleSelectOrder(order.id || order.orderNumber)}
                                    className="order-checkbox"
                                />
                                <div className="order-main-info">
                                    <span className="order-number">{order.orderNumber}</span>
                                    <span className="order-date">{formatDate(order.createdAt)}</span>
                                </div>
                            </div>
                            <select
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id || order.orderNumber, e.target.value)}
                                className={`status-select ${order.status}`}
                            >
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="order-card-body">
                            <div className="order-customer">
                                <p><strong>🎮 Username:</strong> {order.minecraftUsername}</p>
                                <p><strong>📧 Email:</strong> {order.email || 'N/A'}</p>
                                <p><strong>🎯 Platform:</strong> {order.platform || 'Java'}</p>
                                {order.transactionId && (
                                    <p style={{ marginTop: '8px' }}>
                                        <strong>💳 UTR:</strong>{' '}
                                        <code style={{
                                            background: 'rgba(255, 107, 53, 0.15)',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontFamily: 'monospace',
                                            color: 'var(--primary)',
                                            fontSize: '0.9rem'
                                        }}>
                                            {order.transactionId}
                                        </code>
                                    </p>
                                )}
                            </div>
                            <div className="order-items-list">
                                <strong>📦 Items:</strong>
                                {order.items?.map((item, idx) => (
                                    <div key={idx} className="item-row">
                                        {item.name} × {item.quantity} = ₹{item.subtotal}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="order-card-footer">
                            {order.couponInfo?.couponCode && (
                                <span className="coupon-info">
                                    🎁 {order.couponInfo.couponCode} (-₹{order.couponInfo.discount})
                                </span>
                            )}
                            <span className="order-total-badge">{order.totalDisplay}</span>
                        </div>
                    </div>
                ))}

                {filteredOrders.length === 0 && (
                    <div className="no-orders-admin">
                        <Package size={48} />
                        <p>No orders found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersTab;
