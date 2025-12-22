import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, Key, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { resetPassword } = useAuth();

    const emailFromState = location.state?.email || '';

    const [formData, setFormData] = useState({
        email: emailFromState,
        otp: ['', '', '', '', '', ''],
        newPassword: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [passwordStrength, setPasswordStrength] = useState({ level: '', text: '' });
    const inputRefs = useRef([]);

    // Password strength checker
    React.useEffect(() => {
        const password = formData.newPassword;
        if (!password) {
            setPasswordStrength({ level: '', text: '' });
            return;
        }

        let score = 0;
        if (password.length >= 6) score++;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        const levels = [
            { level: 'weak', text: 'Weak' },
            { level: 'weak', text: 'Weak' },
            { level: 'fair', text: 'Fair' },
            { level: 'good', text: 'Good' },
            { level: 'strong', text: 'Strong' },
            { level: 'strong', text: 'Very Strong' }
        ];

        setPasswordStrength(levels[score]);
    }, [formData.newPassword]);

    const handleOtpChange = (index, value) => {
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...formData.otp];
        newOtp[index] = value;
        setFormData(prev => ({ ...prev, otp: newOtp }));
        setError('');

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        if (/^\d+$/.test(pastedData)) {
            const newOtp = [...formData.otp];
            pastedData.split('').forEach((digit, i) => {
                if (i < 6) newOtp[i] = digit;
            });
            setFormData(prev => ({ ...prev, otp: newOtp }));

            const lastIndex = Math.min(pastedData.length - 1, 5);
            inputRefs.current[lastIndex]?.focus();
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const otpCode = formData.otp.join('');

        if (!formData.email) {
            setError('Please enter your email');
            return;
        }

        if (otpCode.length !== 6) {
            setError('Please enter the complete 6-digit OTP');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            const result = await resetPassword(formData.email, otpCode, formData.newPassword);

            if (result.success) {
                setSuccess('Password reset successful! Redirecting to login...');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError(result.message || 'Password reset failed');
            }
        } catch (err) {
            setError(err.message || 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1))', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                            <Key size={36} color="#22c55e" />
                        </div>
                        <h1>Reset Password</h1>
                        <p>Enter the OTP and your new password</p>
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

                    <form onSubmit={handleSubmit} className="auth-form">
                        {!emailFromState && (
                            <div className="form-group">
                                <label htmlFor="email">
                                    <Lock size={16} />
                                    Email
                                </label>
                                <div className="input-wrapper">
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Enter your email"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label>
                                <Key size={16} />
                                OTP Code
                            </label>
                            <div className="otp-container-small">
                                {formData.otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => inputRefs.current[index] = el}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        onPaste={handleOtpPaste}
                                        disabled={isLoading}
                                        className="otp-input-small"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">
                                <Lock size={16} />
                                New Password
                            </label>
                            <div className="input-wrapper password-input">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="newPassword"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                    placeholder="Enter new password"
                                    autoComplete="new-password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {passwordStrength.level && (
                                <div className="password-strength">
                                    <div className="strength-bar">
                                        <div className={`strength-fill ${passwordStrength.level}`}></div>
                                    </div>
                                    <span className={`strength-text ${passwordStrength.level}`}>
                                        {passwordStrength.text}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">
                                <Lock size={16} />
                                Confirm New Password
                            </label>
                            <div className={`input-wrapper password-input ${formData.confirmPassword && (formData.newPassword === formData.confirmPassword ? 'valid' : 'invalid')}`}>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm new password"
                                    autoComplete="new-password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="auth-btn primary"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    <Key size={18} />
                                    Reset Password
                                </>
                            )}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <Link to="/login" className="back-link">
                            <ArrowLeft size={16} />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>

            <style>{`
                .otp-container-small {
                    display: flex;
                    justify-content: center;
                    gap: 0.5rem;
                }

                .otp-input-small {
                    width: 42px;
                    height: 48px;
                    text-align: center;
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    transition: all 0.3s ease;
                }

                .otp-input-small:focus {
                    outline: none;
                    border-color: #f97316;
                    background: rgba(249, 115, 22, 0.1);
                }

                .otp-input-small:disabled {
                    opacity: 0.6;
                }

                .back-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #9ca3af;
                    text-decoration: none;
                    font-size: 0.95rem;
                    transition: color 0.3s ease;
                }

                .back-link:hover {
                    color: #f97316;
                }

                @media (max-width: 480px) {
                    .otp-container-small {
                        gap: 0.35rem;
                    }

                    .otp-input-small {
                        width: 36px;
                        height: 42px;
                        font-size: 1rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default ResetPassword;
