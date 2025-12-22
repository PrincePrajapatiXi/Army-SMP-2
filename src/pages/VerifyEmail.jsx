import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const VerifyEmail = () => {
    const navigate = useNavigate();
    const { user, verifyEmail, resendOtp, isAuthenticated } = useAuth();

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [resendTimer, setResendTimer] = useState(0);
    const inputRefs = useRef([]);

    // Redirect if not authenticated or already verified
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        } else if (user?.isEmailVerified) {
            navigate('/');
        }
    }, [isAuthenticated, user, navigate]);

    // Resend timer countdown
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const handleChange = (index, value) => {
        // Only allow numbers
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all fields are filled
        if (value && index === 5 && newOtp.every(digit => digit)) {
            handleSubmit(newOtp.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        // Move to previous input on backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (/^\d+$/.test(pastedData)) {
            const newOtp = [...otp];
            pastedData.split('').forEach((digit, i) => {
                if (i < 6) newOtp[i] = digit;
            });
            setOtp(newOtp);

            // Focus last filled input
            const lastIndex = Math.min(pastedData.length - 1, 5);
            inputRefs.current[lastIndex]?.focus();

            // Auto-submit if complete
            if (pastedData.length === 6) {
                handleSubmit(pastedData);
            }
        }
    };

    const handleSubmit = async (otpCode = null) => {
        const code = otpCode || otp.join('');

        if (code.length !== 6) {
            setError('Please enter the complete 6-digit code');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await verifyEmail(code);

            if (result.success) {
                setSuccess('Email verified successfully!');
                setTimeout(() => navigate('/'), 1500);
            } else {
                setError(result.message || 'Invalid OTP. Please try again.');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (err) {
            setError(err.message || 'Verification failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;

        setError('');
        setSuccess('');

        try {
            const result = await resendOtp();
            if (result.success) {
                setSuccess('New OTP sent! Check your email.');
                setResendTimer(60); // 60 second cooldown
            } else {
                setError(result.message || 'Failed to resend OTP');
            }
        } catch (err) {
            setError(err.message || 'Failed to resend OTP');
        }
    };

    if (!user) return null;

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1))', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                            <Mail size={36} color="#22c55e" />
                        </div>
                        <h1>Verify Your Email</h1>
                        <p>We've sent a 6-digit code to</p>
                        <p style={{ color: '#f97316', fontWeight: 600 }}>{user.email}</p>
                    </div>

                    {error && (
                        <div className="auth-alert error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="auth-alert success">
                            <CheckCircle size={18} />
                            <span>{success}</span>
                        </div>
                    )}

                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="auth-form">
                        <div className="otp-container">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => inputRefs.current[index] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    disabled={isLoading}
                                    className="otp-input"
                                    autoFocus={index === 0}
                                />
                            ))}
                        </div>

                        <button
                            type="submit"
                            className="auth-btn primary"
                            disabled={isLoading || otp.some(d => !d)}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Verifying...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    Verify Email
                                </>
                            )}
                        </button>
                    </form>

                    <div className="resend-section">
                        <p>Didn't receive the code?</p>
                        <button
                            type="button"
                            className="resend-btn"
                            onClick={handleResend}
                            disabled={resendTimer > 0}
                        >
                            <RefreshCw size={16} className={resendTimer > 0 ? '' : 'rotate'} />
                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                        </button>
                    </div>

                    <div className="auth-footer">
                        <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            The code will expire in 10 minutes.<br />
                            Check your spam folder if you don't see the email.
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                .otp-container {
                    display: flex;
                    justify-content: center;
                    gap: 0.75rem;
                    margin-bottom: 1.5rem;
                }

                .otp-input {
                    width: 50px;
                    height: 60px;
                    text-align: center;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    transition: all 0.3s ease;
                }

                .otp-input:focus {
                    outline: none;
                    border-color: #f97316;
                    background: rgba(249, 115, 22, 0.1);
                    box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
                }

                .otp-input:disabled {
                    opacity: 0.6;
                }

                .resend-section {
                    text-align: center;
                    margin-top: 1.5rem;
                    padding-top: 1.5rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                .resend-section p {
                    color: #9ca3af;
                    font-size: 0.9rem;
                    margin-bottom: 0.75rem;
                }

                .resend-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: none;
                    border: none;
                    color: #f97316;
                    font-size: 0.95rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .resend-btn:hover:not(:disabled) {
                    color: #ea580c;
                }

                .resend-btn:disabled {
                    color: #6b7280;
                    cursor: not-allowed;
                }

                .resend-btn .rotate {
                    animation: rotate 2s linear infinite;
                }

                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 480px) {
                    .otp-container {
                        gap: 0.5rem;
                    }

                    .otp-input {
                        width: 42px;
                        height: 52px;
                        font-size: 1.25rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default VerifyEmail;
