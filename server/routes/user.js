const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/authMiddleware');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for avatar upload
const storage = multer.memoryStorage();
const avatarUpload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

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

// ==================== SET PASSWORD (for OAuth users) ====================
router.put('/set-password', requireAuth, async (req, res) => {
    try {
        const { newPassword, confirmPassword } = req.body;

        // Validate passwords
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirm password are required'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Get user with password field
        const user = await User.findById(req.user._id).select('+password');

        // Check if user already has a password
        if (user.password) {
            return res.status(400).json({
                success: false,
                message: 'You already have a password set. Use change password instead.'
            });
        }

        // Set password and update auth provider to allow both methods
        user.password = newPassword;
        user.authProvider = 'local'; // Now they can use both Google and password
        await user.save();

        res.json({
            success: true,
            message: 'Password set successfully! You can now login with email/password or Google.'
        });

    } catch (error) {
        console.error('Set password error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while setting password'
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

// ==================== UPLOAD AVATAR ====================
router.put('/avatar', requireAuth, avatarUpload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image file provided'
            });
        }

        // Verify Cloudinary config at runtime
        const cloudConfig = cloudinary.config();
        console.log('Cloudinary config check:', {
            cloud_name: cloudConfig.cloud_name ? 'SET' : 'NOT SET',
            api_key: cloudConfig.api_key ? 'SET' : 'NOT SET',
            api_secret: cloudConfig.api_secret ? 'SET' : 'NOT SET'
        });

        // Re-configure if not set (env vars might load after module import)
        if (!cloudConfig.cloud_name || !cloudConfig.api_key || !cloudConfig.api_secret) {
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET
            });
            console.log('Cloudinary reconfigured with env vars');
        }

        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'army-smp/avatars',
            resource_type: 'image',
            transformation: [
                { width: 200, height: 200, crop: 'fill', gravity: 'face' }
            ]
        });

        // Update user avatar
        req.user.avatar = result.secure_url;
        await req.user.save();

        res.json({
            success: true,
            message: 'Avatar updated successfully',
            avatar: result.secure_url,
            user: req.user.toPublicJSON()
        });

    } catch (error) {
        console.error('Avatar upload error:', error);

        // Better error message for debugging
        let errorMessage = 'An error occurred while uploading avatar';
        if (error.message) {
            errorMessage = error.message;
        }
        if (error.http_code === 401 || error.message?.includes('credentials') || error.message?.includes('Must supply')) {
            errorMessage = 'Cloudinary configuration error. Please check API keys.';
        }

        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
});

module.exports = router;
