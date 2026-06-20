import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, Clock, ShieldCheck, Mail, RefreshCw, Ban, ShieldOff } from 'lucide-react';

const API_BASE_URL = 'https://army-smp-2.onrender.com/api';

const AdminLogin = ({ onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    // IP Ban State
    const [isBanned, setIsBanned] = useState(false);
    const [banExpiresAt, setBanExpiresAt] = useState(null);
    const [banRemainingMs, setBanRemainingMs] = useState(0);
    const [banReason, setBanReason] = useState('');

    // 2FA State
    const [step, setStep] = useState(1); // 1 = password, 2 = OTP
    const [maskedEmail, setMaskedEmail] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

    // Restore ban state from sessionStorage on mount (survives page refresh)
    useEffect(() => {
        const savedBan = localStorage.getItem('adminBanState');
        if (savedBan) {
            try {
                const ban = JSON.parse(savedBan);
                const remaining = new Date(ban.expiresAt).getTime() - Date.now();
                if (remaining > 0) {
                    setIsBanned(true);
                    setBanExpiresAt(ban.expiresAt);
                    setBanRemainingMs(remaining);
                    setBanReason(ban.reason || '');
                } else {
                    // Ban expired, clean up
                    localStorage.removeItem('adminBanState');
                }
            } catch (e) {
                localStorage.removeItem('adminBanState');
            }
        }
    }, []);

    // Ban countdown timer — uses exact expiresAt timestamp to prevent drift
    useEffect(() => {
        if (!isBanned || !banExpiresAt) return;

        const tick = () => {
            const remaining = new Date(banExpiresAt).getTime() - Date.now();
            if (remaining <= 0) {
                setIsBanned(false);
                setBanExpiresAt(null);
                setBanReason('');
                setBanRemainingMs(0);
                setLoginError('');
                localStorage.removeItem('adminBanState');
            } else {
                setBanRemainingMs(remaining);
            }
        };

        tick(); // Run immediately
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [isBanned, banExpiresAt]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setInterval(() => {
                setResendCooldown(prev => prev > 0 ? prev - 1 : 0);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [resendCooldown]);

    const formatBanTime = (ms) => {
        const totalSecs = Math.max(0, Math.floor(ms / 1000));
        const days = Math.floor(totalSecs / 86400);
        const hours = Math.floor((totalSecs % 86400) / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;

        // Always show full breakdown: Xd Xh Xm Xs
        if (days > 0) {
            return `${days}d ${hours}h ${mins}m ${secs}s`;
        }
        if (hours > 0) {
            return `${hours}h ${mins}m ${secs}s`;
        }
        if (mins > 0) {
            return `${mins}m ${secs}s`;
        }
        return `${secs}s`;
    };

    // Format exact unban date/time in user's local timezone with seconds
    const formatExactUnbanTime = (expiresAt) => {
        if (!expiresAt) return '';
        const date = new Date(expiresAt);
        // Use user's browser locale and timezone automatically
        return date.toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    };

    const handleBanResponse = (data) => {
        const expiresAt = data.expiresAt;
        const remaining = expiresAt 
            ? Math.max(0, new Date(expiresAt).getTime() - Date.now())
            : (data.remainingMs || 7 * 24 * 60 * 60 * 1000);

        setIsBanned(true);
        setBanExpiresAt(expiresAt);
        setBanRemainingMs(remaining);
        setBanReason(data.reason || 'suspicious_activity');
        setLoginError(data.error);

        // Persist ban state so it survives page refresh and browser restart
        localStorage.setItem('adminBanState', JSON.stringify({
            expiresAt,
            reason: data.reason || 'suspicious_activity'
        }));
    };

    // Step 1: Submit password
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (isBanned) return;

        setLoginLoading(true);
        setLoginError('');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (data.success && data.requires2FA) {
                // Password correct, move to OTP step
                setStep(2);
                setMaskedEmail(data.email);
                setResendCooldown(60);
                setLoginError('');
            } else if (data.banned) {
                // IP has been banned
                handleBanResponse(data);
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

    // Step 2: Submit OTP
    const handleOTPSubmit = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        setLoginError('');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/verify-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp })
            });

            const data = await response.json();

            if (data.success) {
                sessionStorage.setItem('adminAuth_v2', 'true');
                if (data.token) {
                    sessionStorage.setItem('adminToken', data.token);
                }
                onLoginSuccess();
            } else {
                setLoginError(data.error || 'Invalid verification code');
            }
        } catch (error) {
            console.error('OTP verification error:', error);
            setLoginError('Verification failed. Please try again.');
        } finally {
            setLoginLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;

        setLoginLoading(true);
        setLoginError('');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/resend-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                setResendCooldown(60);
                setLoginError('');
            } else {
                setLoginError(data.error || 'Failed to resend code');
            }
        } catch (error) {
            console.error('Resend error:', error);
            setLoginError('Failed to resend code');
        } finally {
            setLoginLoading(false);
        }
    };

    // Go back to password step
    const handleBack = () => {
        setStep(1);
        setOtp('');
        setPassword('');
        setLoginError('');
    };

    // ==================== IP BANNED STATE ====================
    if (isBanned) {
        return (
            <div className="admin-login-page">
                <div className="admin-login-box" style={{ maxWidth: '480px' }}>
                    <div className="login-icon" style={{
                        background: 'linear-gradient(135deg, #dc2626, #991b1b)',
                        width: '90px',
                        height: '90px',
                        animation: 'pulse 2s ease-in-out infinite'
                    }}>
                        <Ban size={48} />
                    </div>

                    <h1 style={{
                        color: '#ef4444',
                        fontSize: '1.8rem',
                        marginBottom: '8px'
                    }}>
                        IP Banned
                    </h1>

                    <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.95rem',
                        marginBottom: '24px',
                        lineHeight: '1.6'
                    }}>
                        Your IP address has been banned due to suspicious activity.
                        You cannot access the admin panel from this device.
                    </p>

                    {/* Ban Timer */}
                    <div style={{
                        padding: '20px 24px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '16px',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            marginBottom: '12px'
                        }}>
                            <Clock size={22} style={{ color: '#ef4444' }} />
                            <span style={{
                                fontWeight: '700',
                                fontSize: '1.4rem',
                                color: '#ef4444',
                                fontFamily: 'monospace',
                                letterSpacing: '1px'
                            }}>
                                {formatBanTime(banRemainingMs)}
                            </span>
                        </div>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            textAlign: 'center',
                            margin: 0
                        }}>
                            Time remaining until ban expires
                        </p>
                    </div>

                    {/* Reason */}
                    <div style={{
                        padding: '14px 18px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '12px',
                        marginBottom: '16px'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '6px'
                        }}>
                            <ShieldOff size={16} style={{ color: '#f59e0b' }} />
                            <span style={{
                                fontWeight: '600',
                                fontSize: '0.85rem',
                                color: 'var(--text-primary)'
                            }}>Reason</span>
                        </div>
                        <p style={{
                            color: 'var(--text-secondary)',
                            fontSize: '0.85rem',
                            margin: 0
                        }}>
                            {banReason === 'admin_login_failed'
                                ? 'Too many failed login attempts (2 incorrect passwords)'
                                : banReason === 'waf_blocked'
                                ? 'Malicious request detected by Web Application Firewall'
                                : banReason === 'ips_blocked'
                                ? 'Intrusion attempt detected by IPS'
                                : 'Suspicious activity detected'}
                        </p>
                    </div>

                    {banExpiresAt && (
                        <div style={{
                            padding: '12px 16px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid var(--card-border)',
                            borderRadius: '12px'
                        }}>
                            <p style={{
                                color: 'var(--text-secondary)',
                                fontSize: '0.8rem',
                                textAlign: 'center',
                                margin: '0 0 6px 0',
                                opacity: 0.7
                            }}>
                                Exact unban time:
                            </p>
                            <p style={{
                                color: '#f59e0b',
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                textAlign: 'center',
                                margin: 0,
                                fontFamily: 'monospace',
                                letterSpacing: '0.5px'
                            }}>
                                {formatExactUnbanTime(banExpiresAt)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ==================== NORMAL LOGIN FLOW ====================
    return (
        <div className="admin-login-page">
            <div className="admin-login-box">
                {/* Step 1: Password */}
                {step === 1 && (
                    <>
                        <div className="login-icon">
                            <Lock size={48} />
                        </div>
                        <h1>Admin Panel</h1>
                        <p>Enter password to access admin dashboard</p>

                        <form onSubmit={handlePasswordSubmit}>
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
                                disabled={loginLoading || !password}
                            >
                                {loginLoading ? 'Verifying...' : 'Continue'}
                            </button>
                        </form>

                        </>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                    <>
                        <div className="login-icon" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                            <ShieldCheck size={48} />
                        </div>
                        <h1>Verify Identity</h1>
                        <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Mail size={16} />
                            OTP sent to {maskedEmail}
                        </p>

                        <form onSubmit={handleOTPSubmit}>
                            <input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="admin-input"
                                style={{
                                    textAlign: 'center',
                                    fontSize: '1.5rem',
                                    letterSpacing: '8px',
                                    fontWeight: '700'
                                }}
                                disabled={loginLoading}
                                maxLength={6}
                                autoFocus
                            />
                            {loginError && <p className="login-error">{loginError}</p>}
                            <button
                                type="submit"
                                className="btn btn-primary admin-login-btn"
                                disabled={loginLoading || otp.length !== 6}
                            >
                                {loginLoading ? 'Verifying...' : 'Login'}
                            </button>
                        </form>

                        <div style={{
                            marginTop: '20px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <button
                                onClick={handleBack}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--card-border)',
                                    color: 'var(--text-secondary)',
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleResendOTP}
                                disabled={resendCooldown > 0 || loginLoading}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: resendCooldown > 0 ? 'transparent' : 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    color: resendCooldown > 0 ? 'var(--text-secondary)' : '#3b82f6',
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem',
                                    opacity: resendCooldown > 0 ? 0.6 : 1
                                }}
                            >
                                <RefreshCw size={14} />
                                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminLogin;


