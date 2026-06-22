import React, { useState } from 'react';
import axios from 'axios';
import { Lock, Mail } from 'lucide-react';
import './Admin.css';
import { API_BASE_URL } from '../../services/api';

const AdminLogin = ({ onLoginSuccess }) => {
    const [step, setStep] = useState(1);
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setLoginLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const res = await axios.post(`${API_BASE_URL}/admin/login`, { password });
            if (res.data.require2FA) {
                setStep(2);
                setSuccessMessage(res.data.message || 'OTP sent to your email.');
            } else if (res.data.success) {
                onLoginSuccess(res.data.token);
            }
        } catch (err) {
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
