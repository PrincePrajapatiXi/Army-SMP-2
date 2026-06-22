import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Lock, Mail, ShieldAlert } from 'lucide-react';
import './Admin.css';
import { API_BASE_URL } from '../../services/api';

const AdminLogin = ({ onLoginSuccess }) => {
    const [step, setStep] = useState(1);
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    
    // Ban state
    const [bannedRemaining, setBannedRemaining] = useState(null);

    // Format remaining time
    const formatTimeRemaining = (ms) => {
        if (!ms || ms <= 0) return '0s';
        const totalSecs = Math.ceil(ms / 1000);
        const days = Math.floor(totalSecs / 86400);
        const hours = Math.floor((totalSecs % 86400) / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${mins}m`;
        if (mins > 0) return `${mins}m ${secs}s`;
        return `${secs}s`;
    };

    // Auto countdown
    useEffect(() => {
        let interval;
        if (bannedRemaining !== null && bannedRemaining > 0) {
            interval = setInterval(() => {
                setBannedRemaining(prev => Math.max(0, prev - 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [bannedRemaining]);

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        setError('');
        setSuccessMessage('');
        setBannedRemaining(null);

        try {
            const res = await axios.post(`${API_BASE_URL}/admin/login`, { password });
            if (res.data.require2FA) {
                setStep(2);
                setSuccessMessage(res.data.message || 'OTP sent to your email.');
            } else if (res.data.success) {
                onLoginSuccess(res.data.token);
            }
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.remainingMs !== undefined) {
                setBannedRemaining(err.response.data.remainingMs);
            }
            const backendMessage = err.response?.data?.message || "An error occurred";
            setError(backendMessage); 
            sessionStorage.setItem('admin_login_error', backendMessage);
        } finally {
            setLoginLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        setError('');

        try {
            const res = await axios.post(`${API_BASE_URL}/admin/verify-2fa`, { otp });
            if (res.data.success) {
                onLoginSuccess(res.data.token);
            }
        } catch (err) {
            const backendMessage = err.response?.data?.error || err.response?.data?.message || "Invalid OTP";
            setError(backendMessage); 
        } finally {
            setLoginLoading(false);
        }
    };

    if (bannedRemaining !== null) {
        return (
            <div className="admin-login-page banned-mode">
                <div className="banned-box">
                    <div className="banned-icon-container">
                        <ShieldAlert size={64} className="banned-icon pulse-animation" />
                    </div>
                    <h1 className="banned-title">SYSTEM LOCKDOWN</h1>
                    <p className="banned-subtitle">ACCESS DENIED</p>
                    
                    <div className="banned-divider"></div>
                    
                    <p className="banned-message">
                        Your IP address has been flagged for security reasons and temporarily locked out of the Admin Network.
                    </p>
                    
                    <div className="banned-timer-container">
                        <span className="banned-timer-label">TIME REMAINING</span>
                        <div className="banned-timer-value">
                            {formatTimeRemaining(bannedRemaining)}
                        </div>
                    </div>
                    
                    <p className="banned-footer-text">
                        If you believe this is a mistake, contact the network administrator.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-login-page">
            <div className="admin-login-box">
                <div className="login-icon">
                    {step === 1 ? <Lock size={48} /> : <Mail size={48} />}
                </div>
                <h2>Admin Panel</h2>
                <p>{step === 1 ? 'Enter password to access admin dashboard' : 'Enter the OTP sent to your email'}</p>
                
                {step === 1 ? (
                    <form onSubmit={handlePasswordSubmit}>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            placeholder=""
                            className="admin-input"
                            required 
                        />
                        <button type="submit" className="btn btn-primary admin-login-btn" disabled={loginLoading}>
                            {loginLoading ? "Loading..." : "Continue"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleOtpSubmit}>
                        <input 
                            type="text" 
                            value={otp} 
                            onChange={(e) => setOtp(e.target.value)} 
                            placeholder="Enter OTP"
                            className="admin-input"
                            required 
                        />
                        <button type="submit" className="btn btn-primary admin-login-btn" disabled={loginLoading}>
                            {loginLoading ? "Verifying..." : "Verify OTP"}
                        </button>
                    </form>
                )}
                {successMessage && <p className="login-success" style={{color: '#4ade80', marginTop: '10px', fontSize: '0.9rem'}}>{successMessage}</p>}
                {error && <p className="login-error">{error}</p>}
            </div>
        </div>
    );
};

export default AdminLogin;
