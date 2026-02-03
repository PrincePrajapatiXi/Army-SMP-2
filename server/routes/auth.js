const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OTP = require('../models/OTP');
const { generateToken, requireAuth } = require('../middleware/authMiddleware');
const { sendOTPEmail } = require('../services/email');

// ==================== SIGNUP ====================
router.post('/signup', async (req, res) => {
    try {
        const { email, username, password, name } = req.body;

        // Validate required fields
        if (!email || !username || !password || !name) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required (email, username, password, name)'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Validate username format
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({
                success: false,
                message: 'Username can only contain letters, numbers, and underscores'
            });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({
                success: false,
                message: 'Username must be between 3 and 20 characters'
            });
        }

        // Check if email already exists
        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'This email is already registered'
            });
        }

        // Check if username already exists
        const existingUsername = await User.findOne({ username: username.toLowerCase() });
        if (existingUsername) {
            return res.status(400).json({
                success: false,
                message: 'This username is already taken'
            });
        }

        // Create user
        const user = await User.create({
            email: email.toLowerCase(),
            username: username.toLowerCase(),
            password,
            name,
            authProvider: 'local',
            isEmailVerified: false
        });

        // Generate OTP for email verification
        const otp = await OTP.createOTP(email, 'emailVerification');

        // Send OTP email (non-blocking - don't fail signup if email fails)
        try {
            await sendOTPEmail(email, otp, 'emailVerification', name);
        } catch (emailError) {
            console.error('OTP email failed, but signup continues:', emailError.message);
        }

        // Generate token
        const token = generateToken(user._id);

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            success: true,
            message: 'Account created successfully! Please verify your email.',
            token,
            user: user.toPublicJSON(),
            requiresVerification: true
        });


    } catch (error) {
        console.error('Signup error:', error);

        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                message: messages[0]
            });
        }

        // Handle duplicate key error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `This ${field} is already registered`
            });
        }

        res.status(500).json({
            success: false,
            message: 'An error occurred during signup'
        });
    }
});

// ==================== LOGIN ====================
router.post('/login', async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;

        // Validate required fields
        if (!emailOrUsername || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email/Username and password are required'
            });
        }

        // Find user by email or username (includes password field)
        const user = await User.findByEmailOrUsername(emailOrUsername);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email/username or password'
            });
        }

        // Check if user has a password (OAuth users won't have one)
        if (!user.password) {
            return res.status(401).json({
                success: false,
                message: `This account uses ${user.authProvider} login. Please use that method.`
            });
        }

        // Compare password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email/username or password'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: user.toPublicJSON(),
            requiresVerification: !user.isEmailVerified
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during login'
        });
    }
});

// ==================== LOGOUT ====================
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// ==================== VERIFY EMAIL ====================
router.post('/verify-email', requireAuth, async (req, res) => {
    try {
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: 'OTP is required'
            });
        }

        // Verify OTP
        const result = await OTP.verifyOTP(req.user.email, otp, 'emailVerification');

        if (!result.valid) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        // Update user
        req.user.isEmailVerified = true;
        await req.user.save();

        res.json({
            success: true,
            message: 'Email verified successfully!',
            user: req.user.toPublicJSON()
        });

    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred during verification'
        });
    }
});

// ==================== RESEND OTP ====================
router.post('/resend-otp', requireAuth, async (req, res) => {
    try {
        if (req.user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Generate new OTP
        const otp = await OTP.createOTP(req.user.email, 'emailVerification');

        // Send OTP email
        await sendOTPEmail(req.user.email, otp, 'emailVerification', req.user.name);

        res.json({
            success: true,
            message: 'OTP sent successfully! Check your email.'
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while sending OTP'
        });
    }
});

// ==================== FORGOT PASSWORD ====================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });

        // Don't reveal if user exists
        if (!user) {
            return res.json({
                success: true,
                message: 'If this email is registered, you will receive a password reset OTP'
            });
        }

        // Check if user uses OAuth and has no password
        // Allow reset if user has set a password (even for OAuth accounts)
        if (user.authProvider !== 'local' && !user.password) {
            return res.status(400).json({
                success: false,
                message: `This account uses ${user.authProvider} login and has no password set. Please use "Set Password" option in your profile first.`
            });
        }

        // Generate OTP
        const otp = await OTP.createOTP(email, 'passwordReset');

        // Send OTP email (non-blocking - don't fail if email service is down)
        try {
            await sendOTPEmail(email, otp, 'passwordReset', user.name);
        } catch (emailError) {
            console.error('OTP email failed:', emailError.message);
            // Continue anyway - OTP is logged to console for development
        }

        res.json({
            success: true,
            message: 'Password reset OTP sent! Check your email.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
});

// ==================== RESET PASSWORD ====================
router.post('/reset-password', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP, and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Verify OTP
        const result = await OTP.verifyOTP(email, otp, 'passwordReset');

        if (!result.valid) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        // Find and update user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'User not found'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successfully! You can now login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
});

// ==================== GET CURRENT USER ====================
router.get('/me', requireAuth, async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user.toPublicJSON()
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
});

// ==================== CHECK USERNAME AVAILABILITY ====================
router.get('/check-username/:username', async (req, res) => {
    try {
        const { username } = req.params;

        if (!username || username.length < 3) {
            return res.json({
                available: false,
                message: 'Username must be at least 3 characters'
            });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.json({
                available: false,
                message: 'Username can only contain letters, numbers, and underscores'
            });
        }

        const existingUser = await User.findOne({ username: username.toLowerCase() });

        res.json({
            available: !existingUser,
            message: existingUser ? 'Username is taken' : 'Username is available'
        });

    } catch (error) {
        console.error('Check username error:', error);
        res.status(500).json({
            available: false,
            message: 'Error checking username'
        });
    }
});

// ==================== CHECK EMAIL AVAILABILITY ====================
router.get('/check-email/:email', async (req, res) => {
    try {
        const { email } = req.params;

        if (!email) {
            return res.json({
                available: false,
                message: 'Email is required'
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });

        res.json({
            available: !existingUser,
            message: existingUser ? 'Email is already registered' : 'Email is available'
        });

    } catch (error) {
        console.error('Check email error:', error);
        res.status(500).json({
            available: false,
            message: 'Error checking email'
        });
    }
});

// ==================== GOOGLE OAUTH ====================
const passport = require('../services/passport');

// Initiate Google OAuth
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Google OAuth callback
router.get('/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: '/login?error=oauth_failed'
    }),
    async (req, res) => {
        try {
            // Generate JWT token
            const token = generateToken(req.user._id);

            // Set cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            // Redirect to frontend with token
            const frontendURL = process.env.NODE_ENV === 'production'
                ? 'https://store.armysmp.fun'
                : 'http://localhost:5173';

            res.redirect(`${frontendURL}/oauth-callback?token=${token}`);
        } catch (error) {
            console.error('Google OAuth callback error:', error);
            res.redirect('/login?error=oauth_failed');
        }
    }
);

// ==================== DISCORD OAUTH ====================
// Initiate Discord OAuth
router.get('/discord', passport.authenticate('discord', {
    scope: ['identify', 'email']
}));

// Discord OAuth callback
router.get('/discord/callback',
    passport.authenticate('discord', {
        session: false,
        failureRedirect: '/login?error=oauth_failed'
    }),
    async (req, res) => {
        try {
            // Generate JWT token
            const token = generateToken(req.user._id);

            // Set cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            // Redirect to frontend with token
            const frontendURL = process.env.NODE_ENV === 'production'
                ? 'https://store.armysmp.fun'
                : 'http://localhost:5173';

            res.redirect(`${frontendURL}/oauth-callback?token=${token}`);
        } catch (error) {
            console.error('Discord OAuth callback error:', error);
            res.redirect('/login?error=oauth_failed');
        }
    }
);

module.exports = router;

