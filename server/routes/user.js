const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/authMiddleware');

// ==================== GET PROFILE ====================
router.get('/profile', requireAuth, async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user.toPublicJSON()
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred'
        });
    }
});

// ==================== UPDATE PROFILE ====================
router.put('/profile', requireAuth, async (req, res) => {
    try {
        const { name, username, minecraftUsername, phone, avatar } = req.body;
        const updates = {};

        // Validate and set name
        if (name !== undefined) {
            if (!name || name.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Name cannot be empty'
                });
            }
            if (name.length > 50) {
                return res.status(400).json({
                    success: false,
                    message: 'Name cannot exceed 50 characters'
                });
            }
            updates.name = name.trim();
        }

        // Validate and set username
        if (username !== undefined && username !== req.user.username) {
            const newUsername = username.toLowerCase().trim();

            if (newUsername.length < 3 || newUsername.length > 20) {
                return res.status(400).json({
                    success: false,
                    message: 'Username must be between 3 and 20 characters'
                });
            }

            if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
                return res.status(400).json({
                    success: false,
                    message: 'Username can only contain letters, numbers, and underscores'
                });
            }

            // Check if username is taken
            const existingUser = await User.findOne({
                username: newUsername,
                _id: { $ne: req.user._id }
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'This username is already taken'
                });
            }

            updates.username = newUsername;
        }

        // Set minecraft username
        if (minecraftUsername !== undefined) {
            updates.minecraftUsername = minecraftUsername.trim();
        }

        // Set phone
        if (phone !== undefined) {
            updates.phone = phone.trim();
        }

        // Set avatar
        if (avatar !== undefined) {
            updates.avatar = avatar;
        }

        // Update user
        if (Object.keys(updates).length > 0) {
            Object.assign(req.user, updates);
            await req.user.save();
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: req.user.toPublicJSON()
        });

    } catch (error) {
        console.error('Update profile error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Username is already taken'
            });
        }

        res.status(500).json({
            success: false,
            message: 'An error occurred while updating profile'
        });
    }
});

// ==================== CHANGE PASSWORD ====================
router.put('/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        // Check if user uses OAuth
        if (req.user.authProvider !== 'local') {
            return res.status(400).json({
                success: false,
                message: `This account uses ${req.user.authProvider} login. Password cannot be changed.`
            });
        }

        // Get user with password
        const user = await User.findById(req.user._id).select('+password');

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while changing password'
        });
    }
});

// ==================== DELETE ACCOUNT ====================
router.delete('/account', requireAuth, async (req, res) => {
    try {
        const { password } = req.body;

        // For OAuth users, no password needed
        if (req.user.authProvider === 'local') {
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: 'Password is required to delete account'
                });
            }

            // Verify password
            const user = await User.findById(req.user._id).select('+password');
            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Password is incorrect'
                });
            }
        }

        // Delete user
        await User.findByIdAndDelete(req.user._id);

        // Clear cookie
        res.clearCookie('token');

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while deleting account'
        });
    }
});

module.exports = router;
