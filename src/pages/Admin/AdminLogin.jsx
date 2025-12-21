import React, { useState } from 'react';
import { Lock } from 'lucide-react';

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://army-smp-2.onrender.com/api';

const AdminLogin = ({ onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError('');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (data.success) {
                sessionStorage.setItem('adminAuth', 'true');
                onLoginSuccess();
                setLoginError('');
            } else {
                setLoginError(data.error || 'Invalid password');
            }
        } catch (error) {
            console.error('Login error:', error);
            setLoginError('Login failed. Please try again.');
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
                <h1>Admin Panel</h1>
                <p>Enter password to access admin dashboard</p>

                <form onSubmit={handleLogin}>
                    <input
                        type="password"
                        placeholder="Enter admin password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="admin-input"
                        disabled={loginLoading}
                    />
                    {loginError && <p className="login-error">{loginError}</p>}
                    <button
                        type="submit"
                        className="btn btn-primary admin-login-btn"
                        disabled={loginLoading}
                    >
                        {loginLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
