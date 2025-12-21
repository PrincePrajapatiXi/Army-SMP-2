import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, Clock } from 'lucide-react';

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://army-smp-2.onrender.com/api';

const AdminLogin = ({ onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutRemaining, setLockoutRemaining] = useState(0);

    // Countdown timer for lockout
    useEffect(() => {
        if (lockoutRemaining > 0) {
            const timer = setInterval(() => {
                setLockoutRemaining(prev => {
                    if (prev <= 1000) {
                        setIsLocked(false);
                        setLoginError('');
                        return 0;
                    }
                    return prev - 1000;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [lockoutRemaining]);

    const formatTime = (ms) => {
        const totalSecs = Math.ceil(ms / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        if (mins > 0) {
            return `${mins}m ${secs}s`;
        }
        return `${secs}s`;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (isLocked) return;

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
                setIsLocked(false);
            } else if (data.locked) {
                setIsLocked(true);
                setLockoutRemaining(data.remainingMs || 60000);
                setLoginError(data.error);
            } else {
                setLoginError(data.error || 'Invalid password');
            }
        } catch (error) {
            console.error('Login error:', error);
            setLoginError('Login failed. Please try again.');
        } finally {
            setLoginLoading(false);
            setPassword('');
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-box">
                <div className="login-icon" style={isLocked ? { background: 'linear-gradient(135deg, #ef4444, #dc2626)' } : {}}>
                    {isLocked ? <ShieldAlert size={48} /> : <Lock size={48} />}
                </div>
                <h1>{isLocked ? 'Account Locked' : 'Admin Panel'}</h1>
                <p>
                    {isLocked
                        ? 'Too many failed login attempts'
                        : 'Enter password to access admin dashboard'}
                </p>

                {isLocked && lockoutRemaining > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '16px 20px',
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        color: '#ef4444'
                    }}>
                        <Clock size={20} />
                        <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                            Try again in: {formatTime(lockoutRemaining)}
                        </span>
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <input
                        type="password"
                        placeholder="Enter admin password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="admin-input"
                        disabled={loginLoading || isLocked}
                        style={isLocked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    />
                    {loginError && !isLocked && <p className="login-error">{loginError}</p>}
                    <button
                        type="submit"
                        className="btn btn-primary admin-login-btn"
                        disabled={loginLoading || isLocked}
                        style={isLocked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                        {loginLoading ? 'Logging in...' : isLocked ? 'Locked' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
