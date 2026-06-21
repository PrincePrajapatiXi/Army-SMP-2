import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Lock, ShieldAlert, Clock, ShieldCheck } from 'lucide-react';
import './Admin.css'; // Restored the stylesheet import

const API_BASE_URL = '/api'; // Fixed: Changed from Render domain to relative path for Vercel routing

const AdminLogin = ({ onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        setError('');

        try {
            const res = await axios.post(`${API_BASE_URL}/admin/login`, { password });
            if (res.data.success) {
                onLoginSuccess(res.data.token);
            }
        } catch (err) {
            const backendMessage = err.response?.data?.message || "An error occurred";
            setError(backendMessage); 
            sessionStorage.setItem('admin_login_error', backendMessage);
        } finally {
            setLoginLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-box">
                <div className="login-icon">
                    <Lock size={48} />
                </div>
                <h2>Admin Panel</h2>
                <form onSubmit={handleSubmit}>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="Enter admin password"
                        className="admin-input"
                        disabled={loginLoading}
                        required 
                    />
                    <button type="submit" className="btn btn-primary admin-login-btn" disabled={loginLoading}>
                        {loginLoading ? 'Verifying...' : 'Continue'}
                    </button>
                </form>
                {error && <p className="login-error">{error}</p>}
            </div>
        </div>
    );
};

export default AdminLogin;
