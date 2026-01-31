import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const WishlistContext = createContext();

// Local storage key
const WISHLIST_KEY = 'armysmp_wishlist';

// Load wishlist from localStorage
const loadWishlistFromStorage = () => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(WISHLIST_KEY);
        return saved ? JSON.parse(saved) : [];
    }
    return [];
};

// Save wishlist to localStorage
const saveWishlistToStorage = (items) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
    }
};

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load wishlist on mount
    useEffect(() => {
        const saved = loadWishlistFromStorage();
        setWishlistItems(saved);
        setIsLoaded(true);
    }, []);

    // Save to localStorage whenever wishlist changes
    useEffect(() => {
        if (isLoaded) {
            saveWishlistToStorage(wishlistItems);
        }
    }, [wishlistItems, isLoaded]);

    // Add item to wishlist
    const addToWishlist = useCallback((product) => {
        setWishlistItems(prev => {
            // Check if already in wishlist
            if (prev.some(item => item.id === product.id)) {
                return prev;
            }

            // Add with timestamp
            return [...prev, {
                id: product.id,
                name: product.name,
                price: product.price,
                priceDisplay: product.priceDisplay || product.price,
                image: product.image,
                color: product.color,
                category: product.category,
                addedAt: new Date().toISOString()
            }];
        });
    }, []);

    // Remove item from wishlist
    const removeFromWishlist = useCallback((productId) => {
        setWishlistItems(prev => prev.filter(item => item.id !== productId));
    }, []);

    // Toggle item in wishlist
    const toggleWishlist = useCallback((product) => {
        setWishlistItems(prev => {
            const exists = prev.some(item => item.id === product.id);

            if (exists) {
                return prev.filter(item => item.id !== product.id);
            }

            return [...prev, {
                id: product.id,
                name: product.name,
                price: product.price,
                priceDisplay: product.priceDisplay || product.price,
                image: product.image,
                color: product.color,
                category: product.category,
                addedAt: new Date().toISOString()
            }];
        });
    }, []);

    // Check if product is in wishlist
    const isInWishlist = useCallback((productId) => {
        return wishlistItems.some(item => item.id === productId);
    }, [wishlistItems]);

    // Get wishlist count
    const getWishlistCount = useCallback(() => {
        return wishlistItems.length;
    }, [wishlistItems]);

    // Clear entire wishlist
    const clearWishlist = useCallback(() => {
        setWishlistItems([]);
    }, []);

    // Move item from wishlist to cart (helper)
    const getWishlistItem = useCallback((productId) => {
        return wishlistItems.find(item => item.id === productId);
    }, [wishlistItems]);

    const value = {
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        getWishlistCount,
        clearWishlist,
        getWishlistItem,
        isLoaded
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};

export { WishlistContext };
export default WishlistContext;
