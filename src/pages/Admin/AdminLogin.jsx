import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Lock, ShieldCheck, ShieldAlert } from 'lucide-react';
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

    // TOTP and Resend States
    const [qrCode, setQrCode] = useState(null);
    const [resendCountdown, setResendCountdown] = useState(0);

    // Format remaining time
    const formatTimeRemaining = (ms) => {
        if (!ms || ms <= 0) return '0s';
        const totalSecs = Math.ceil(ms / 1000);
        const days = Math.floor(totalSecs / 86400);
        const hours = Math.floor((totalSecs % 86400) / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;
        
        if (days > 0) return `${days}d ${hours}h ${mins}m ${secs}s`;
        if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
        if (mins > 0) return `${mins}m ${secs}s`;
        return `${secs}s`;
    };

    // Auto countdowns
    useEffect(() => {
        let banInterval;
        if (bannedRemaining !== null && bannedRemaining > 0) {
            banInterval = setInterval(() => {
                setBannedRemaining(prev => Math.max(0, prev - 1000));
            }, 1000);
        }
        return () => clearInterval(banInterval);
    }, [bannedRemaining]);

    useEffect(() => {
        let resendTimer;
        if (resendCountdown > 0) {
            resendTimer = setInterval(() => setResendCountdown(c => c - 1), 1000);
        }
        return () => clearInterval(resendTimer);
    }, [resendCountdown]);

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
                setResendCountdown(30); // Start 30s cooldown
                
                if (res.data.requireTotpSetup) {
                    setQrCode(res.data.qrCode);
                }
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

    const handleResendOTP = async () => {
        if (resendCountdown > 0) return;
        
        try {
            setSuccessMessage('');
            setError('');
            const res = await axios.post(`${API_BASE_URL}/admin/resend-2fa`);
            if (res.data.success) {
                setSuccessMessage(res.data.message);
                setResendCountdown(30); // Restart cooldown
            }
        } catch (err) {
            setError(err.response?.data?.error || "Failed to resend OTP");
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
                        Get the hell out of here!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-login-page">
            <div className="admin-login-box">
                <div className="login-icon">
                    {step === 1 ? <Lock size={48} /> : <ShieldCheck size={48} />}
                </div>
                <h2>Admin Panel</h2>
                <p>{step === 1 ? 'Enter password to access admin dashboard' : (qrCode ? 'Google Authenticator Setup' : 'Enter Authenticator code or Email OTP')}</p>
                
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
                        {qrCode && (
                            <div className="totp-setup-container" style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
                                <p style={{ color: '#ef4444', fontWeight: 'bold', margin: '0 0 10px 0' }}>Action Required: Set up 2FA</p>
                                <img src={qrCode} alt="TOTP QR Code" style={{ borderRadius: '8px', margin: '10px auto', display: 'block', border: '2px solid white' }} />
                                <p style={{ fontSize: '0.85rem', color: '#d1d5db', margin: '10px 0 0 0' }}>Scan this code using Google Authenticator, Authy, or a similar app. Then enter the 6-digit code below to confirm.</p>
                            </div>
                        )}
                        
                        <input 
                            type="text" 
                            value={otp} 
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                            placeholder="• • • • • •"
                            className="admin-input otp-input"
                            autoComplete="off"
                            required 
                        />
                        <button type="submit" className="btn btn-primary admin-login-btn" disabled={loginLoading}>
                            {loginLoading ? "Verifying..." : "Verify Code"}
                        </button>
                        
                        {!qrCode && (
                            <button 
                                type="button" 
                                onClick={handleResendOTP} 
                                disabled={resendCountdown > 0 || loginLoading}
                                style={{
                                    marginTop: '15px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: resendCountdown > 0 ? '#6b7280' : '#f97316',
                                    cursor: resendCountdown > 0 ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem',
                                    textDecoration: resendCountdown > 0 ? 'none' : 'underline'
                                }}
                            >
                                {resendCountdown > 0 ? `Didn't receive email? Resend in ${resendCountdown}s` : "Didn't receive email? Resend OTP"}
                            </button>
                        )}
                    </form>
                )}
                {successMessage && <p className="login-success" style={{color: '#4ade80', marginTop: '10px', fontSize: '0.9rem'}}>{successMessage}</p>}
                {error && <p className="login-error" style={{ marginTop: '10px' }}>{error}</p>}
            </div>
        </div>
    );
};

export default AdminLogin;
