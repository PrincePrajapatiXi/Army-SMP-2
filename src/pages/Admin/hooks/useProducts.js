import { useState, useCallback } from 'react';

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://army-smp-2.onrender.com/api';

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = sessionStorage.getItem('adminToken');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

const useProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [form, setForm] = useState({
        name: '',
        price: '',
        category: 'ranks',
        image: '/images/stone.png',
        description: '',
        color: '#ffffff',
        features: ''
    });

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/products`, {
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error('Unauthorized');
            const data = await response.json();
            setProducts(data || []);
        } catch (error) {
            console.error('Error fetching products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const resetForm = () => {
        setForm({
            name: '',
            price: '',
            category: 'ranks',
            image: '/images/stone.png',
            description: '',
            color: '#ffffff',
            features: ''
        });
        setEditingProduct(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (product) => {
        setEditingProduct(product);
        setForm({
            name: product.name,
            price: product.price.toString(),
            category: product.category,
            image: product.image,
            description: product.description || '',
            color: product.color || '#ffffff',
            features: (product.features || []).join(', ')
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const productData = {
            name: form.name,
            price: parseFloat(form.price),
            category: form.category,
            image: form.image,
            description: form.description,
            color: form.color,
            features: form.features.split(',').map(f => f.trim()).filter(f => f)
        };

        try {
            const url = editingProduct
                ? `${API_BASE_URL}/admin/products/${editingProduct.id}`
                : `${API_BASE_URL}/admin/products`;

            const response = await fetch(url, {
                method: editingProduct ? 'PUT' : 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(productData)
            });

            const data = await response.json();

            if (data.success) {
                setShowModal(false);
                resetForm();
                fetchProducts();
                return true;
            } else {
                alert(data.error || 'Failed to save product');
            }
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Failed to save product');
        } finally {
            setLoading(false);
        }
        return false;
    };

    const handleDelete = async (productId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/products/${productId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            const data = await response.json();

            if (data.success) {
                setShowDeleteConfirm(null);
                fetchProducts();
                return true;
            } else {
                alert(data.error || 'Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete product');
        }
        return false;
    };

    const closeModal = () => {
        setShowModal(false);
        resetForm();
    };

    return {
        products,
        loading,
        fetchProducts,
        form,
        setForm,
        showModal,
        setShowModal,
        editingProduct,
        showDeleteConfirm,
        setShowDeleteConfirm,
        openAddModal,
        openEditModal,
        handleSubmit,
        handleDelete,
        closeModal,
        resetForm
    };
};

export default useProducts;
