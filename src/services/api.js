// API Service for Army SMP 2 Store
// Auto-detect: use local API when on localhost, production API otherwise
const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const API_BASE_URL = isLocalhost
    ? 'http://localhost:5000/api'
    : 'https://army-smp-2.onrender.com/api';


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
    create: async (minecraftUsername, email = null, items = [], platform = 'Java', couponInfo = null, transactionId = null) => {
        return fetchWithCredentials(`${API_BASE_URL}/orders/create`, {
            method: 'POST',
            body: JSON.stringify({ minecraftUsername, email, items, platform, couponInfo, transactionId }),
        });
    },

    getById: async (orderId) => {
        return fetchWithCredentials(`${API_BASE_URL}/orders/${orderId}`);
    },

    getByUsername: async (username) => {
        return fetchWithCredentials(`${API_BASE_URL}/orders/user/${username}`);
    },

    getByEmail: async (email) => {
        return fetchWithCredentials(`${API_BASE_URL}/orders/email/${encodeURIComponent(email)}`);
    }
};

// Health check
export const healthCheck = async () => {
    return fetchWithCredentials(`${API_BASE_URL}/health`);
};

// Auth API
export const authApi = {
    signup: async (data) => {
        return fetchWithCredentials(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    login: async (data) => {
        return fetchWithCredentials(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    logout: async () => {
        return fetchWithCredentials(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
        });
    },

    verifyEmail: async (otp) => {
        const token = localStorage.getItem('authToken');
        return fetchWithCredentials(`${API_BASE_URL}/auth/verify-email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ otp }),
        });
    },

    resendOtp: async () => {
        const token = localStorage.getItem('authToken');
        return fetchWithCredentials(`${API_BASE_URL}/auth/resend-otp`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    forgotPassword: async (email) => {
        return fetchWithCredentials(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    resetPassword: async (data) => {
        return fetchWithCredentials(`${API_BASE_URL}/auth/reset-password`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getMe: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) throw new Error('No token');
        return fetchWithCredentials(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    checkUsername: async (username) => {
        return fetchWithCredentials(`${API_BASE_URL}/auth/check-username/${username}`);
    },

    checkEmail: async (email) => {
        return fetchWithCredentials(`${API_BASE_URL}/auth/check-email/${encodeURIComponent(email)}`);
    }
};

// User API
export const userApi = {
    getProfile: async () => {
        const token = localStorage.getItem('authToken');
        return fetchWithCredentials(`${API_BASE_URL}/user/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
    },

    updateProfile: async (data) => {
        const token = localStorage.getItem('authToken');
        return fetchWithCredentials(`${API_BASE_URL}/user/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
    },

    changePassword: async (data) => {
        const token = localStorage.getItem('authToken');
        return fetchWithCredentials(`${API_BASE_URL}/user/change-password`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });
    },

    deleteAccount: async (password) => {
        const token = localStorage.getItem('authToken');
        return fetchWithCredentials(`${API_BASE_URL}/user/account`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ password }),
        });
    }
};
