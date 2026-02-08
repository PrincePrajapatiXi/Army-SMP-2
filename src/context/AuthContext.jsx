import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { authApi, userApi } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is authenticated on mount
    const checkAuth = useCallback(async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem('authToken');
            if (!token) {
                setUser(null);
                return;
            }

            const response = await authApi.getMe();
            if (response.success) {
                setUser(response.user);
            } else {
                localStorage.removeItem('authToken');
                setUser(null);
            }
        } catch (err) {
            console.log('Auth check failed:', err.message);
            localStorage.removeItem('authToken');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // Signup
    const signup = async (email, username, password, name) => {
        try {
            setError(null);
            const response = await authApi.signup({ email, username, password, name });

            if (response.success) {
                localStorage.setItem('authToken', response.token);
                setUser(response.user);
                return { success: true, requiresVerification: response.requiresVerification };
            }

            return { success: false, message: response.message };
        } catch (err) {
            setError(err.message);
            return { success: false, message: err.message };
        }
    };

    // Login
    const login = async (emailOrUsername, password) => {
        try {
            setError(null);
            const response = await authApi.login({ emailOrUsername, password });

            if (response.success) {
                localStorage.setItem('authToken', response.token);
                setUser(response.user);
                return { success: true, requiresVerification: response.requiresVerification };
            }

            return { success: false, message: response.message };
        } catch (err) {
            setError(err.message);
            return { success: false, message: err.message };
        }
    };

    // Logout
    const logout = async () => {
        try {
            await authApi.logout();
        } catch (err) {
            console.log('Logout API error:', err);
        } finally {
            localStorage.removeItem('authToken');
            setUser(null);
        }
    };

    // Verify Email
    const verifyEmail = async (otp) => {
        try {
            setError(null);
            const response = await authApi.verifyEmail(otp);

            if (response.success) {
                setUser(response.user);
                return { success: true };
            }

            return { success: false, message: response.message };
        } catch (err) {
            setError(err.message);
            return { success: false, message: err.message };
        }
    };

    // Resend OTP
    const resendOtp = async () => {
        try {
            setError(null);
            const response = await authApi.resendOtp();
            return { success: response.success, message: response.message };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    // Forgot Password
    const forgotPassword = async (email) => {
        try {
            setError(null);
            const response = await authApi.forgotPassword(email);
            return { success: response.success, message: response.message };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    // Reset Password
    const resetPassword = async (email, otp, newPassword) => {
        try {
            setError(null);
            const response = await authApi.resetPassword({ email, otp, newPassword });
            return { success: response.success, message: response.message };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    // Update Profile
    const updateProfile = async (data) => {
        try {
            setError(null);
            const response = await userApi.updateProfile(data);

            if (response.success) {
                setUser(response.user);
                return { success: true };
            }

            return { success: false, message: response.message };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    // Change Password
    const changePassword = async (currentPassword, newPassword) => {
        try {
            setError(null);
            const response = await userApi.changePassword({ currentPassword, newPassword });
            return { success: response.success, message: response.message };
        } catch (err) {
            return { success: false, message: err.message };
        }
    };

    // Check Username Availability
    const checkUsername = async (username) => {
        try {
            const response = await authApi.checkUsername(username);
            return response;
        } catch (err) {
            return { available: false, message: err.message };
        }
    };

    // Check Email Availability
    const checkEmail = async (email) => {
        try {
            const response = await authApi.checkEmail(email);
            return response;
        } catch (err) {
            return { available: false, message: err.message };
        }
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        signup,
        login,
        logout,
        verifyEmail,
        resendOtp,
        forgotPassword,
        resetPassword,
        updateProfile,
        changePassword,
        checkUsername,
        checkEmail,
        checkAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext };
export default AuthContext;


