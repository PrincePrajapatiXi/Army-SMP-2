import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

const RecentPurchaseNotification = () => {
    const [notification, setNotification] = useState(null);
    const [orders, setOrders] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchRecentOrders = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/orders/recent/purchases`);
                if (response.data && response.data.length > 0) {
                    setOrders(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch recent orders:', error);
            }
        };

        fetchRecentOrders();
        // Poll every 5 minutes
        const interval = setInterval(fetchRecentOrders, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (orders.length === 0) return;

        // Show a notification every 15-30 seconds if we have orders
        const showNextNotification = () => {
            const order = orders[currentIndex];
            setNotification(order);
            
            // Hide after 5 seconds
            setTimeout(() => {
                setNotification(null);
            }, 5000);

            // Move to next order
            setCurrentIndex((prev) => (prev + 1) % orders.length);
        };

        const randomDelay = Math.floor(Math.random() * (30000 - 15000 + 1) + 15000);
        const timeout = setTimeout(showNextNotification, randomDelay);

        return () => clearTimeout(timeout);
    }, [orders, currentIndex]);

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return 'Recently';
    };

    return (
        <AnimatePresence>
            {notification && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 20, x: '-50%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="fixed bottom-6 left-1/2 md:left-6 md:transform-none z-50 w-[90%] md:w-auto max-w-sm"
                    style={{ transform: 'translateX(-50%)' }} // Center on mobile
                >
                    <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700 shadow-2xl rounded-xl p-4 flex items-start gap-4">
                        <div className="bg-primary/20 p-2 rounded-lg shrink-0">
                            <ShoppingBag className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 pr-4">
                            <p className="text-sm text-gray-300">
                                <span className="font-bold text-white truncate inline-block max-w-[100px] align-bottom">
                                    {notification.username}
                                </span>{' '}
                                just bought
                            </p>
                            <p className="text-sm font-semibold text-primary truncate">
                                {notification.items.join(', ')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {formatTimeAgo(notification.timestamp)}
                            </p>
                        </div>
                        <button 
                            onClick={() => setNotification(null)}
                            className="text-gray-500 hover:text-white absolute top-3 right-3 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RecentPurchaseNotification;
