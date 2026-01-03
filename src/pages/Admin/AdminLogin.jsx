import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, Clock, ShieldCheck, Mail, RefreshCw } from 'lucide-react';

const API_BASE_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : 'https://army-smp-2.onrender.com/api';

const AdminLogin = ({ onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [lockoutRemaining, setLockoutRemaining] = useState(0);

    // 2FA State
    const [step, setStep] = useState(1); // 1 = password, 2 = OTP
    const [maskedEmail, setMaskedEmail] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);

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

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setInterval(() => {
                setResendCooldown(prev => prev > 0 ? prev - 1 : 0);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [resendCooldown]);

    const formatTime = (ms) => {
        const totalSecs = Math.ceil(ms / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        if (mins > 0) {
            return `${mins}m ${secs}s`;
        }
        return `${secs}s`;
    };

    // Step 1: Submit password
    const handlePasswordSubmit = async (e) => {
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

            if (data.success && data.requires2FA) {
                // Password correct, move to OTP step
                setStep(2);
                setMaskedEmail(data.email);
                setResendCooldown(60); // 60 second cooldown for resend
                setLoginError('');
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
                // Save the JWT token for API calls
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

    return (
        <div className="admin-login-page">
            <div className="admin-login-box">
                {/* Step 1: Password */}
                {step === 1 && (
                    <>
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

                        <form onSubmit={handlePasswordSubmit}>
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
                                disabled={loginLoading || isLocked || !password}
                                style={isLocked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                            >
                                {loginLoading ? 'Verifying...' : isLocked ? 'Locked' : 'Continue'}
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
