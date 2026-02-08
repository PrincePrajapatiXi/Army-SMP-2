import { useState, useCallback } from 'react';

const API_BASE_URL = 'https://army-smp-2.onrender.com/api';

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = sessionStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

const useCoupons = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [form, setForm] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: '',
        maxDiscount: '',
        usageLimit: '',
        expiresAt: ''
    });

    const fetchCoupons = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/coupons`, {
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Unauthorized');
            const data = await response.json();
            setCoupons(data || []);
        } catch (error) {
            console.error('Error fetching coupons:', error);
            setCoupons([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const resetForm = () => {
        setForm({
            code: '',
            discountType: 'percentage',
            discountValue: '',
            minOrderAmount: '',
            maxDiscount: '',
            usageLimit: '',
            expiresAt: ''
        });
        setEditingCoupon(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (coupon) => {
        setEditingCoupon(coupon);
        setForm({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue.toString(),
            minOrderAmount: coupon.minOrderAmount?.toString() || '',
            maxDiscount: coupon.maxDiscount?.toString() || '',
            usageLimit: coupon.usageLimit?.toString() || '',
            expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const couponData = {
            code: form.code,
            discountType: form.discountType,
            discountValue: parseFloat(form.discountValue),
            minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : 0,
            maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
            usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
            expiresAt: form.expiresAt || null
        };

        try {
            const url = editingCoupon
                ? `${API_BASE_URL}/admin/coupons/${editingCoupon._id}`
                : `${API_BASE_URL}/admin/coupons`;

            const response = await fetch(url, {
                method: editingCoupon ? 'PUT' : 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(couponData)
            });

            const data = await response.json();

            if (data.success) {
                setShowModal(false);
                resetForm();
                fetchCoupons();
                return true;
            } else {
                alert(data.error || 'Failed to save coupon');
            }
        } catch (error) {
            console.error('Error saving coupon:', error);
            alert('Failed to save coupon');
        } finally {
            setLoading(false);
        }
        return false;
    };

    const handleDelete = async (couponId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/coupons/${couponId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (data.success) {
                setShowDeleteConfirm(null);
                fetchCoupons();
                return true;
            } else {
                alert(data.error || 'Failed to delete coupon');
            }
        } catch (error) {
            console.error('Error deleting coupon:', error);
            alert('Failed to delete coupon');
        }
        return false;
    };

    const toggleActive = async (couponId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/coupons/${couponId}/toggle`, {
                method: 'PUT',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (data.success) {
                fetchCoupons();
            } else {
                alert(data.error || 'Failed to toggle coupon');
            }
        } catch (error) {
            console.error('Error toggling coupon:', error);
            alert('Failed to toggle coupon');
        }
    };

    const closeModal = () => {
        setShowModal(false);
        resetForm();
    };

    return {
        coupons,
        loading,
        fetchCoupons,
        form,
        setForm,
        showModal,
        setShowModal,
        editingCoupon,
        showDeleteConfirm,
        setShowDeleteConfirm,
        openAddModal,
        openEditModal,
        handleSubmit,
        handleDelete,
        toggleActive,
        closeModal,
        resetForm
    };
};

export default useCoupons;

