// API Service for Army SMP 2 Store
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for API requests with credentials (for session cookies)
const fetchWithCredentials = async (url, options = {}) => {
    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }

    return response.json();
};

// Products API
export const productsApi = {
    getAll: async (category = null) => {
        const url = category && category !== 'all'
            ? `${API_BASE_URL}/products?category=${category}`
            : `${API_BASE_URL}/products`;
        return fetchWithCredentials(url);
    },

    getById: async (id) => {
        return fetchWithCredentials(`${API_BASE_URL}/products/${id}`);
    },

    getCategories: async () => {
        return fetchWithCredentials(`${API_BASE_URL}/products/categories`);
    }
};

// Cart API
export const cartApi = {
    get: async () => {
        return fetchWithCredentials(`${API_BASE_URL}/cart`);
    },

    add: async (productId, quantity = 1) => {
        return fetchWithCredentials(`${API_BASE_URL}/cart/add`, {
            method: 'POST',
            body: JSON.stringify({ productId, quantity }),
        });
    },

    update: async (productId, quantity) => {
        return fetchWithCredentials(`${API_BASE_URL}/cart/update`, {
            method: 'PUT',
            body: JSON.stringify({ productId, quantity }),
        });
    },

    remove: async (productId) => {
        return fetchWithCredentials(`${API_BASE_URL}/cart/remove/${productId}`, {
            method: 'DELETE',
        });
    },

    clear: async () => {
        return fetchWithCredentials(`${API_BASE_URL}/cart/clear`, {
            method: 'DELETE',
        });
    }
};

// Orders API
export const ordersApi = {
    create: async (minecraftUsername, email = null) => {
        return fetchWithCredentials(`${API_BASE_URL}/orders/create`, {
            method: 'POST',
            body: JSON.stringify({ minecraftUsername, email }),
        });
    },

    getById: async (orderId) => {
        return fetchWithCredentials(`${API_BASE_URL}/orders/${orderId}`);
    },

    getByUsername: async (username) => {
        return fetchWithCredentials(`${API_BASE_URL}/orders/user/${username}`);
    }
};

// Health check
export const healthCheck = async () => {
    return fetchWithCredentials(`${API_BASE_URL}/health`);
};
