import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Target, TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '../../services/api';

const ServerGoalBar = () => {
    const [goalData, setGoalData] = useState({ target: 5000, current: 0, percentage: 0, currency: '₹' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGoal = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/server-status/goal`);
                const data = await response.json();
                if (data) {
                    setGoalData(data);
                }
            } catch (error) {
                console.error('Failed to fetch server goal:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchGoal();
        const interval = setInterval(fetchGoal, 10 * 60 * 1000); // 10 minutes
        return () => clearInterval(interval);
    }, [API_BASE_URL]);

    if (loading) {
        return <div className="h-24 w-full bg-gray-800/50 animate-pulse rounded-xl mb-8 border border-gray-700/50"></div>;
    }

    return (
        <div className="w-full bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 mb-10 shadow-lg relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2.5 rounded-xl">
                        <Target className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Monthly Server Goal</h3>
                        <p className="text-sm text-gray-400">Help keep the server running and updated!</p>
                    </div>
                </div>
                
                <div className="flex items-end gap-2 bg-black/40 px-4 py-2 rounded-lg border border-gray-800">
                    <span className="text-2xl font-bold text-primary">{goalData.currency}{goalData.current}</span>
                    <span className="text-sm text-gray-400 mb-1">/ {goalData.currency}{goalData.target}</span>
                </div>
            </div>

            <div className="relative z-10">
                <div className="flex justify-between text-xs font-semibold mb-2">
                    <span className="text-gray-400">0%</span>
                    <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="text-primary flex items-center gap-1"
                    >
                        <TrendingUp className="w-3 h-3" /> {goalData.percentage}%
                    </motion.span>
                    <span className="text-gray-400">100%</span>
                </div>
                
                <div className="h-4 w-full bg-gray-800 rounded-full overflow-hidden shadow-inner border border-gray-700/50">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${goalData.percentage}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full relative"
                    >
                        {/* Shimmer effect */}
                        <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ServerGoalBar;
