import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const { forgotPassword } = useAuth();

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [emailSent, setEmailSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!email.trim()) {
            setError('Please enter your email');
            return;
        }

        if (!email.includes('@')) {
            setError('Please enter a valid email');
            return;
        }

        setIsLoading(true);

        try {
            const result = await forgotPassword(email);

            if (result.success) {
                setSuccess(result.message);
                setEmailSent(true);
                // Navigate to reset password page after 2 seconds
                setTimeout(() => {
                    navigate('/reset-password', { state: { email } });
                }, 2000);
            } else {
                setError(result.message || 'Failed to send reset email');
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
                        <div className="auth-logo" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(234, 88, 12, 0.1))', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                            <Mail size={36} color="#f59e0b" />
                        </div>
                        <h1>Forgot Password?</h1>
                        <p>No worries! Enter your email and we'll send you a reset code.</p>
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

                    {!emailSent ? (
                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group">
                                <label htmlFor="email">
                                    <Mail size={16} />
                                    Email Address
                                </label>
                                <div className="input-wrapper">
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                        placeholder="Enter your registered email"
                                        autoComplete="email"
                                        disabled={isLoading}
                                    />
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
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Send Reset Code
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="email-sent-message">
                            <p>Check your email for the OTP code.</p>
                            <p>Redirecting to reset password...</p>
                        </div>
                    )}

                    <div className="auth-footer">
                        <Link to="/login" className="back-link">
                            <ArrowLeft size={16} />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>

            <style>{`
                .email-sent-message {
                    text-align: center;
                    padding: 2rem 1rem;
                    color: #9ca3af;
                }

                .email-sent-message p {
                    margin-bottom: 0.5rem;
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
            `}</style>
        </div>
    );
};

export default ForgotPassword;
