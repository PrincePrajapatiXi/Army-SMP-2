import React, { useState } from 'react';
import axios from 'axios';
import '../../pages/Admin/Admin.css';

const API_BASE_URL = '/api'; 

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
            // Read backend deception strings or direct absolute blocks cleanly
            const backendMessage = err.response?.data?.message || "An error occurred";
            setError(backendMessage); 
            sessionStorage.setItem('admin_login_error', backendMessage);
        } finally {
            setLoginLoading(false);
        }
    };

    return (
        <div className="admin-login-container">
            <div className="admin-login-box">
                <div className="admin-icon-wrapper">
                    <span className="admin-lock-icon">🔒</span>
                </div>
                <h2>Admin Panel</h2>
                <p className="admin-subtitle">Enter password to access admin dashboard</p>
                
                <form onSubmit={handleSubmit}>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="••••••••••••"
                        className="admin-password-input"
                        required 
                    />
                    <button type="submit" className="admin-continue-btn" disabled={loginLoading}>
                        {loginLoading ? "Loading..." : "Continue"}
                    </button>
                </form>
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default AdminLogin;
