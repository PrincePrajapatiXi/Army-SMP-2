import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const OAuthCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { checkAuth } = useAuth();
    const [status, setStatus] = useState('processing'); // processing, success, error
    const [message, setMessage] = useState('Processing login...');

    useEffect(() => {
        const handleCallback = async () => {
            const token = searchParams.get('token');
            const error = searchParams.get('error');

            if (error) {
                setStatus('error');
                setMessage('OAuth login failed. Please try again.');
                setTimeout(() => navigate('/login'), 3000);
                return;
            }

            if (token) {
                // Store token
                localStorage.setItem('authToken', token);

                // Refresh auth state
                await checkAuth();

                setStatus('success');
                setMessage('Login successful! Redirecting...');
                setTimeout(() => navigate('/'), 1500);
            } else {
                setStatus('error');
                setMessage('No token received. Please try again.');
                setTimeout(() => navigate('/login'), 3000);
            }
        };

        handleCallback();
    }, [searchParams, navigate, checkAuth]);

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card" style={{ textAlign: 'center', padding: '3rem' }}>
                    {status === 'processing' && (
                        <>
                            <Loader size={48} className="spin-icon" style={{ color: '#f97316', marginBottom: '1rem' }} />
                            <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>Processing</h2>
                            <p style={{ color: '#9ca3af' }}>{message}</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle size={48} style={{ color: '#22c55e', marginBottom: '1rem' }} />
                            <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>Success!</h2>
                            <p style={{ color: '#9ca3af' }}>{message}</p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <XCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
                            <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>Error</h2>
                            <p style={{ color: '#9ca3af' }}>{message}</p>
                        </>
                    )}
                </div>
            </div>

            <style>{`
                .spin-icon {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default OAuthCallback;

