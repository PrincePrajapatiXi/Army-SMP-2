import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, User, UserPlus, AlertCircle, CheckCircle, AtSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css'; // Reuse auth styles

const Signup = () => {
    const navigate = useNavigate();
    const { signup, checkUsername, checkEmail } = useAuth();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Validation states
    const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });
    const [emailStatus, setEmailStatus] = useState({ checking: false, available: null, message: '' });
    const [passwordStrength, setPasswordStrength] = useState({ level: '', text: '' });

    // Debounced username check
    useEffect(() => {
        if (formData.username.length < 3) {
            setUsernameStatus({ checking: false, available: null, message: '' });
            return;
        }

        const timer = setTimeout(async () => {
            setUsernameStatus({ checking: true, available: null, message: 'Checking...' });
            const result = await checkUsername(formData.username);
            setUsernameStatus({
                checking: false,
                available: result.available,
                message: result.message
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.username, checkUsername]);

    // Debounced email check
    useEffect(() => {
        if (!formData.email || !formData.email.includes('@')) {
            setEmailStatus({ checking: false, available: null, message: '' });
            return;
        }

        const timer = setTimeout(async () => {
            setEmailStatus({ checking: true, available: null, message: 'Checking...' });
            const result = await checkEmail(formData.email);
            setEmailStatus({
                checking: false,
                available: result.available,
                message: result.message
            });
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.email, checkEmail]);

    // Password strength checker
    useEffect(() => {
        const password = formData.password;
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
    }, [formData.password]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        setError('');
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Please enter your name');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Please enter your email');
            return false;
        }
        if (!formData.email.includes('@')) {
            setError('Please enter a valid email');
            return false;
        }
        if (emailStatus.available === false) {
            setError('This email is already registered');
            return false;
        }
        if (!formData.username.trim()) {
            setError('Please enter a username');
            return false;
        }
        if (formData.username.length < 3) {
            setError('Username must be at least 3 characters');
            return false;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            setError('Username can only contain letters, numbers, and underscores');
            return false;
        }
        if (usernameStatus.available === false) {
            setError('This username is already taken');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }
        if (!formData.agreeTerms) {
            setError('Please agree to the Terms & Conditions');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const result = await signup(
                formData.email,
                formData.username,
                formData.password,
                formData.name
            );

            if (result.success) {
                setSuccess('Account created! Please verify your email.');
                setTimeout(() => navigate('/verify-email'), 1500);
            } else {
                setError(result.message || 'Signup failed. Please try again.');
            }
        } catch (err) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="auth-logo">
                            <img src="/images/Army logo.png" alt="Army SMP 2" />
                        </div>
                        <h1>Create Account</h1>
                        <p>Join Army SMP 2 today</p>
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
                        <div className="form-group">
                            <label htmlFor="name">
                                <User size={16} />
                                Full Name
                            </label>
                            <div className="input-wrapper">
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    autoComplete="name"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">
                                <Mail size={16} />
                                Email
                            </label>
                            <div className={`input-wrapper ${emailStatus.available === true ? 'valid' : emailStatus.available === false ? 'invalid' : ''}`}>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                    disabled={isLoading}
                                />
                            </div>
                            {emailStatus.message && (
                                <div className={`input-feedback ${emailStatus.available ? 'valid' : 'invalid'}`}>
                                    {emailStatus.checking ? (
                                        <span className="spinner" style={{ width: 14, height: 14 }}></span>
                                    ) : emailStatus.available ? (
                                        <CheckCircle size={14} />
                                    ) : (
                                        <AlertCircle size={14} />
                                    )}
                                    <span>{emailStatus.message}</span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="username">
                                <AtSign size={16} />
                                Username
                            </label>
                            <div className={`input-wrapper ${usernameStatus.available === true ? 'valid' : usernameStatus.available === false ? 'invalid' : ''}`}>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Choose a username"
                                    autoComplete="username"
                                    disabled={isLoading}
                                />
                            </div>
                            {usernameStatus.message && (
                                <div className={`input-feedback ${usernameStatus.available ? 'valid' : 'invalid'}`}>
                                    {usernameStatus.checking ? (
                                        <span className="spinner" style={{ width: 14, height: 14 }}></span>
                                    ) : usernameStatus.available ? (
                                        <CheckCircle size={14} />
                                    ) : (
                                        <AlertCircle size={14} />
                                    )}
                                    <span>{usernameStatus.message}</span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                <Lock size={16} />
                                Password
                            </label>
                            <div className="input-wrapper password-input">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Create a password"
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
                                Confirm Password
                            </label>
                            <div className={`input-wrapper password-input ${formData.confirmPassword && (formData.password === formData.confirmPassword ? 'valid' : 'invalid')}`}>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Confirm your password"
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
                            {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                                <div className="input-feedback invalid">
                                    <AlertCircle size={14} />
                                    <span>Passwords do not match</span>
                                </div>
                            )}
                        </div>

                        <div className="form-options">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="agreeTerms"
                                    checked={formData.agreeTerms}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                                <span className="checkmark"></span>
                                I agree to the Terms & Conditions
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="auth-btn primary"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    <UserPlus size={18} />
                                    Sign Up
                                </>
                            )}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>or continue with</span>
                    </div>

                    <div className="oauth-buttons">
                        <button
                            className="oauth-btn google"
                            onClick={() => {
                                const apiUrl = window.location.hostname === 'localhost'
                                    ? 'http://localhost:5000'
                                    : 'https://army-smp-2.onrender.com';
                                window.location.href = `${apiUrl}/api/auth/google`;
                            }}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>
                        <button
                            className="oauth-btn discord"
                            onClick={() => {
                                const apiUrl = window.location.hostname === 'localhost'
                                    ? 'http://localhost:5000'
                                    : 'https://army-smp-2.onrender.com';
                                window.location.href = `${apiUrl}/api/auth/discord`;
                            }}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <path fill="#5865F2" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                            </svg>
                            Discord
                        </button>
                    </div>

                    <div className="auth-footer">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login">Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
