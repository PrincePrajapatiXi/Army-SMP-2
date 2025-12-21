import { useState, useCallback } from 'react';

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://army-smp-2.onrender.com/api';

const usePromotions = () => {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [form, setForm] = useState({
        name: '',
        logo: '/images/stone.png',
        tagline: '',
        description: '',
        features: '',
        link: '',
        buttonText: 'Learn More',
        gradient: 'linear-gradient(135deg, #1e3a5f, #0d1b2a)',
        position: 1
    });

    const fetchPromotions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/promotions`);
            const data = await response.json();
            setPromotions(data || []);
        } catch (error) {
            console.error('Error fetching promotions:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const resetForm = (promotionsLength = 0) => {
        setForm({
            name: '',
            logo: '/images/stone.png',
            tagline: '',
            description: '',
            features: '',
            link: '',
            buttonText: 'Learn More',
            gradient: 'linear-gradient(135deg, #1e3a5f, #0d1b2a)',
            position: promotionsLength + 1
        });
        setEditingPromotion(null);
    };

    const openAddModal = () => {
        resetForm(promotions.length);
        setShowModal(true);
    };

    const openEditModal = (promo) => {
        setEditingPromotion(promo);
        setForm({
            name: promo.name,
            logo: promo.logo,
            tagline: promo.tagline || '',
            description: promo.description,
            features: Array.isArray(promo.features) ? promo.features.join(', ') : promo.features || '',
            link: promo.link,
            buttonText: promo.buttonText || 'Learn More',
            gradient: promo.gradient || 'linear-gradient(135deg, #1e3a5f, #0d1b2a)',
            position: promo.position || 1
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name || !form.description || !form.link) {
            alert('Please fill in Name, Description, and Link');
            return false;
        }

        const promotionData = {
            name: form.name,
            logo: form.logo,
            tagline: form.tagline,
            description: form.description,
            features: form.features.split(',').map(f => f.trim()).filter(f => f),
            link: form.link,
            buttonText: form.buttonText,
            gradient: form.gradient,
            position: parseInt(form.position) || 1
        };

        try {
            const url = editingPromotion
                ? `${API_BASE_URL}/admin/promotions/${editingPromotion._id}`
                : `${API_BASE_URL}/admin/promotions`;

            const response = await fetch(url, {
                method: editingPromotion ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(promotionData)
            });

            const data = await response.json();

            if (data.success) {
                setShowModal(false);
                resetForm();
                fetchPromotions();
                return true;
            } else {
                alert(data.error || 'Failed to save promotion');
            }
        } catch (error) {
            console.error('Error saving promotion:', error);
            alert('Failed to save promotion');
        }
        return false;
    };

    const handleDelete = async (promoId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/promotions/${promoId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                setShowDeleteConfirm(null);
                fetchPromotions();
                return true;
            } else {
                alert(data.error || 'Failed to delete promotion');
            }
        } catch (error) {
            console.error('Error deleting promotion:', error);
            alert('Failed to delete promotion');
        }
        return false;
    };

    const toggleActive = async (promoId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/promotions/${promoId}/toggle`, {
                method: 'PUT'
            });

            const data = await response.json();

            if (data.success) {
                fetchPromotions();
            } else {
                alert(data.error || 'Failed to toggle promotion');
            }
        } catch (error) {
            console.error('Error toggling promotion:', error);
            alert('Failed to toggle promotion');
        }
    };

    const closeModal = () => {
        setShowModal(false);
        resetForm();
    };

    return {
        promotions,
        loading,
        fetchPromotions,
        form,
        setForm,
        showModal,
        setShowModal,
        editingPromotion,
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

export default usePromotions;
