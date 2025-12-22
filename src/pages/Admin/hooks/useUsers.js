import { useState, useCallback } from 'react';

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://army-smp-2.onrender.com/api';

const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                credentials: 'include'
            });
            const data = await response.json();
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleBlockUser = async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/block`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                fetchUsers();
                return { success: true, message: data.message };
            }
            return { success: false, message: data.error };
        } catch (error) {
            console.error('Error toggling user block:', error);
            return { success: false, message: 'Failed to update user status' };
        }
    };

    const sendPasswordReset = async (userId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                return { success: true, message: data.message };
            }
            return { success: false, message: data.error };
        } catch (error) {
            console.error('Error sending password reset:', error);
            return { success: false, message: 'Failed to send password reset email' };
        }
    };

    const getFilteredUsers = useCallback(() => {
        if (!userSearch.trim()) return users;

        const searchLower = userSearch.toLowerCase().trim();
        return users.filter(user =>
            user.email?.toLowerCase().includes(searchLower) ||
            user.username?.toLowerCase().includes(searchLower) ||
            user.name?.toLowerCase().includes(searchLower) ||
            user.minecraftUsername?.toLowerCase().includes(searchLower)
        );
    }, [users, userSearch]);

    return {
        users,
        loading,
        fetchUsers,
        toggleBlockUser,
        sendPasswordReset,
        userSearch,
        setUserSearch,
        getFilteredUsers
    };
};

export default useUsers;
