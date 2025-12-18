import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { cartApi } from '../services/api';

const CartContext = createContext();

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

    // Load cart from API on mount
    const loadCart = useCallback(async () => {
        try {
            setLoading(true);
            const data = await cartApi.get();
            setCartItems(data.items || []);
            setError(null);
        } catch (err) {
            console.error('Failed to load cart:', err);
            setError(err.message);
            // Fallback to empty cart if API fails
            setCartItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    const addToCart = async (product, quantity = 1) => {
        try {
            setLoading(true);
            const data = await cartApi.add(product.id, quantity);
            setCartItems(data.cart || []);
            setError(null);
            return true;
        } catch (err) {
            console.error('Failed to add to cart:', err);
            setError(err.message);
            // Fallback: update local state
            setCartItems(prevItems => {
                const existingItem = prevItems.find(item => item.id === product.id);
                if (existingItem) {
                    return prevItems.map(item =>
                        item.id === product.id
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    );
                }
                return [...prevItems, { ...product, quantity }];
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const removeFromCart = async (productId) => {
        try {
            setLoading(true);
            const data = await cartApi.remove(productId);
            setCartItems(data.cart || []);
            setError(null);
        } catch (err) {
            console.error('Failed to remove from cart:', err);
            setError(err.message);
            // Fallback: update local state
            setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (productId, quantity) => {
        if (quantity <= 0) {
            return removeFromCart(productId);
        }

        try {
            setLoading(true);
            const data = await cartApi.update(productId, quantity);
            setCartItems(data.cart || []);
            setError(null);
        } catch (err) {
            console.error('Failed to update cart:', err);
            setError(err.message);
            // Fallback: update local state
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
        try {
            setLoading(true);
            await cartApi.clear();
            setCartItems([]);
            setError(null);
        } catch (err) {
            console.error('Failed to clear cart:', err);
            setError(err.message);
            // Fallback: update local state
            setCartItems([]);
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
        refreshCart: loadCart
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export default CartContext;
