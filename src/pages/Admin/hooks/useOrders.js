import { useState, useCallback } from 'react';

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://army-smp-2.onrender.com/api';

const useOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [orderSearch, setOrderSearch] = useState('');

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/orders`, {
                credentials: 'include'
            });
            const data = await response.json();
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            fetchOrders();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedOrders.length === 0) return false;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/orders/bulk`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderIds: selectedOrders })
            });

            const data = await response.json();
            if (data.success) {
                setSelectedOrders([]);
                fetchOrders();
                return true;
            }
        } catch (error) {
            console.error('Bulk delete error:', error);
        }
        return false;
    };

    const toggleSelectOrder = (orderId) => {
        setSelectedOrders(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const clearDateFilter = () => {
        setStartDate('');
        setEndDate('');
    };

    // Filter orders
    const getFilteredOrders = useCallback(() => {
        return orders.filter(o => {
            // Search filter
            if (orderSearch.trim()) {
                const searchLower = orderSearch.toLowerCase().trim();
                const matchesSearch =
                    o.orderNumber?.toLowerCase().includes(searchLower) ||
                    o.minecraftUsername?.toLowerCase().includes(searchLower) ||
                    o.email?.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }

            // Status filter
            if (statusFilter !== 'all' && o.status !== statusFilter) return false;

            // Date range filter
            if (startDate || endDate) {
                const orderDate = new Date(o.createdAt);
                orderDate.setHours(0, 0, 0, 0);

                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    if (orderDate < start) return false;
                }

                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    if (orderDate > end) return false;
                }
            }

            return true;
        });
    }, [orders, orderSearch, statusFilter, startDate, endDate]);

    // Analytics
    const getAnalytics = useCallback(() => {
        const getISTDateString = (date) => {
            return new Date(date).toLocaleDateString('en-IN', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        };

        const todayIST = getISTDateString(new Date());

        return {
            totalOrders: orders.length,
            totalRevenue: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.total || 0), 0),
            pendingOrders: orders.filter(o => o.status === 'pending').length,
            completedOrders: orders.filter(o => o.status === 'completed').length,
            cancelledOrders: orders.filter(o => o.status === 'cancelled').length,
            todayOrders: orders.filter(o => getISTDateString(o.createdAt) === todayIST).length,
            todayRevenue: orders
                .filter(o => getISTDateString(o.createdAt) === todayIST && o.status !== 'cancelled')
                .reduce((sum, o) => sum + (o.total || 0), 0)
        };
    }, [orders]);

    return {
        orders,
        loading,
        fetchOrders,
        updateOrderStatus,
        handleBulkDelete,
        statusFilter,
        setStatusFilter,
        selectedOrders,
        setSelectedOrders,
        toggleSelectOrder,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        clearDateFilter,
        orderSearch,
        setOrderSearch,
        getFilteredOrders,
        getAnalytics
    };
};

export default useOrders;
