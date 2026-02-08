import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { cartApi } from '../services/api';

const CartContext = createContext();

// Check if we're in a browser and if backend is available
const isBackendAvailable = () => {
    // Always use localStorage for cart - backend sessions don't persist cross-origin on Render
    // Orders still go to backend for notifications, but cart is local for reliability
    return false;
};

// Local storage helpers
const saveCartToStorage = (cart) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('armysmp_cart', JSON.stringify(cart));
    }
};

const loadCartFromStorage = () => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('armysmp_cart');
        return saved ? JSON.parse(saved) : [];
    }
    return [];
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [useLocalStorage, setUseLocalStorage] = useState(!isBackendAvailable());

    // Load cart on mount
    const loadCart = useCallback(async () => {
        if (useLocalStorage) {
            // Use localStorage
            const savedCart = loadCartFromStorage();
            setCartItems(savedCart);
            return;
        }

        try {
            setLoading(true);
            const data = await cartApi.get();
            setCartItems(data.items || []);
            setError(null);
        } catch (err) {
            console.log('Backend not available, switching to localStorage');
            setUseLocalStorage(true);
            const savedCart = loadCartFromStorage();
            setCartItems(savedCart);
        } finally {
            setLoading(false);
        }
    }, [useLocalStorage]);

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    // Save to localStorage whenever cart changes (if using localStorage mode)
    useEffect(() => {
        if (useLocalStorage && cartItems.length >= 0) {
            saveCartToStorage(cartItems);
        }
    }, [cartItems, useLocalStorage]);

    const addToCart = async (product, quantity = 1) => {
        if (useLocalStorage) {
            // Local mode
            setCartItems(prevItems => {
                const existingItem = prevItems.find(item => item.id === product.id);
                if (existingItem) {
                    return prevItems.map(item =>
                        item.id === product.id
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    );
                }
                return [...prevItems, {
                    id: product.id,
                    name: product.name,
                    price: typeof product.price === 'number' ? product.price : parseFloat(String(product.price).replace(/[^0-9.-]+/g, '')),
                    priceDisplay: product.priceDisplay || product.price,
                    image: product.image,
                    color: product.color,
                    quantity
                }];
            });
            return true;
        }

        try {
            setLoading(true);
            const data = await cartApi.add(product.id, quantity);
            setCartItems(data.cart || []);
            setError(null);
            return true;
        } catch (err) {
            console.error('Failed to add to cart:', err);
            setUseLocalStorage(true);
            // Retry with local storage
            return addToCart(product, quantity);
        } finally {
            setLoading(false);
        }
    };

    const removeFromCart = async (productId) => {
        if (useLocalStorage) {
            setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
            return;
        }

        try {
            setLoading(true);
            const data = await cartApi.remove(productId);
            setCartItems(data.cart || []);
            setError(null);
        } catch (err) {
            setUseLocalStorage(true);
            setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (productId, quantity) => {
        if (quantity <= 0) {
            return removeFromCart(productId);
        }

        if (useLocalStorage) {
            setCartItems(prevItems =>
                prevItems.map(item =>
                    item.id === productId ? { ...item, quantity } : item
                )
            );
            return;
        }

        try {
            setLoading(true);
            const data = await cartApi.update(productId, quantity);
            setCartItems(data.cart || []);
            setError(null);
        } catch (err) {
            setUseLocalStorage(true);
            setCartItems(prevItems =>
                prevItems.map(item =>
                    item.id === productId ? { ...item, quantity } : item
                )
            );
        } finally {
            setLoading(false);
        }
    };

    const incrementQuantity = async (productId) => {
        const item = cartItems.find(item => item.id === productId);
        if (item) {
            await updateQuantity(productId, item.quantity + 1);
        }
    };

    const decrementQuantity = async (productId) => {
        const item = cartItems.find(item => item.id === productId);
        if (item) {
            if (item.quantity <= 1) {
                await removeFromCart(productId);
            } else {
                await updateQuantity(productId, item.quantity - 1);
            }
        }
    };

    const clearCart = async () => {
        if (useLocalStorage) {
            setCartItems([]);
            saveCartToStorage([]);
            return;
        }

        try {
            setLoading(true);
            await cartApi.clear();
            setCartItems([]);
            setError(null);
        } catch (err) {
            setCartItems([]);
            saveCartToStorage([]);
        } finally {
            setLoading(false);
        }
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => {
            const price = typeof item.price === 'number'
                ? item.price
                : parseFloat(String(item.price).replace(/[^0-9.-]+/g, ''));
            return total + (price * item.quantity);
        }, 0);
    };

    const getCartCount = () => {
        return cartItems.reduce((count, item) => count + item.quantity, 0);
    };

    const value = {
        cartItems,
        loading,
        error,
        addToCart,
        removeFromCart,
        updateQuantity,
        incrementQuantity,
        decrementQuantity,
        clearCart,
        getCartTotal,
        getCartCount,
        refreshCart: loadCart,
        isLocalMode: useLocalStorage
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export { CartContext };
export default CartContext;


