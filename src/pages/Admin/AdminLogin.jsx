import React, { useState } from 'react';
import axios from 'axios';
import { Lock } from 'lucide-react';
import './Admin.css';
import { API_BASE_URL } from '../../services/api';

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
                <p>Enter password to access admin dashboard</p>
                
                <form onSubmit={handleSubmit}>
                    <input 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="••••••••••••"
                        className="admin-input"
                        required 
                    />
                    <button type="submit" className="btn btn-primary admin-login-btn" disabled={loginLoading}>
                        {loginLoading ? "Loading..." : "Continue"}
                    </button>
                </form>
                {error && <p className="login-error">{error}</p>}
            </div>
        </div>
    );
};

export default AdminLogin;
