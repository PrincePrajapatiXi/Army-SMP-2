const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/authMiddleware');

// Referral reward percentage (5% of referred user's purchase)
const REFERRAL_REWARD_PERCENT = 5;

// Generate unique referral code
const generateReferralCode = (username) => {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${username.toUpperCase().slice(0, 4)}${randomSuffix}`;
};

// GET /api/referrals/my-code - Get or create user's referral code
router.get('/my-code', requireAuth, async (req, res) => {
    try {
        let user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Generate referral code if not exists
        if (!user.referralCode) {
            let code = generateReferralCode(user.username);

            // Ensure uniqueness
            let attempts = 0;
            while (await User.findOne({ referralCode: code }) && attempts < 5) {
                code = generateReferralCode(user.username);
                attempts++;
            }

            user.referralCode = code;
            await user.save();
        }

        res.json({
            success: true,
            referralCode: user.referralCode,
            referralLink: `${process.env.FRONTEND_URL || 'https://store.armysmp.fun'}/signup?ref=${user.referralCode}`
        });
    } catch (error) {
        console.error('Error getting referral code:', error);
        res.status(500).json({ success: false, error: 'Failed to get referral code' });
    }
});

// GET /api/referrals/stats - Get user's referral statistics
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Get referred users
        const referredUsers = await User.find({ referredBy: req.userId })
            .select('username createdAt totalOrders totalSpent')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            stats: {
                referralCode: user.referralCode,
                referralCount: user.referralCount || 0,
                totalEarnings: user.referralEarnings || 0,
                availableBalance: user.referralBalance || 0
            },
            recentReferrals: referredUsers.map(u => ({
                username: u.username,
                joinedAt: u.createdAt,
                orders: u.totalOrders || 0,
                spent: u.totalSpent || 0
            }))
        });
    } catch (error) {
        console.error('Error getting referral stats:', error);
        res.status(500).json({ success: false, error: 'Failed to get referral stats' });
    }
});

// POST /api/referrals/validate - Validate a referral code
router.post('/validate', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, error: 'Referral code is required' });
        }

        const referrer = await User.findOne({ referralCode: code.toUpperCase() });

        if (!referrer) {
            return res.status(404).json({
                success: false,
                valid: false,
                error: 'Invalid referral code'
            });
        }

        res.json({
            success: true,
            valid: true,
            referrerName: referrer.username
        });
    } catch (error) {
        console.error('Error validating referral code:', error);
        res.status(500).json({ success: false, error: 'Failed to validate code' });
    }
});

// POST /api/referrals/apply - Apply referral code to user (called during signup)
router.post('/apply', requireAuth, async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, error: 'Referral code is required' });
        }

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Check if user already has a referrer
        if (user.referredBy) {
            return res.status(400).json({
                success: false,
                error: 'You already have a referrer'
            });
        }

        // Find referrer
        const referrer = await User.findOne({ referralCode: code.toUpperCase() });

        if (!referrer) {
            return res.status(404).json({ success: false, error: 'Invalid referral code' });
        }

        // Can't refer yourself
        if (referrer._id.toString() === user._id.toString()) {
            return res.status(400).json({
                success: false,
                error: 'You cannot use your own referral code'
            });
        }

        // Apply referral
        user.referredBy = referrer._id;
        await user.save();

        // Increment referrer's count
        await User.findByIdAndUpdate(referrer._id, {
            $inc: { referralCount: 1 }
        });

        res.json({
            success: true,
            message: `You were referred by ${referrer.username}!`
        });
    } catch (error) {
        console.error('Error applying referral code:', error);
        res.status(500).json({ success: false, error: 'Failed to apply referral code' });
    }
});

// POST /api/referrals/reward - Calculate and add referral reward (called after order completion)
router.post('/reward', async (req, res) => {
    try {
        const { userId, orderTotal } = req.body;

        const user = await User.findById(userId);

        if (!user || !user.referredBy) {
            return res.json({ success: true, rewarded: false });
        }

        // Calculate reward
        const rewardAmount = Math.floor(orderTotal * (REFERRAL_REWARD_PERCENT / 100));

        if (rewardAmount <= 0) {
            return res.json({ success: true, rewarded: false });
        }

        // Add reward to referrer
        await User.findByIdAndUpdate(user.referredBy, {
            $inc: {
                referralEarnings: rewardAmount,
                referralBalance: rewardAmount
            }
        });

        res.json({
            success: true,
            rewarded: true,
            amount: rewardAmount
        });
    } catch (error) {
        console.error('Error processing referral reward:', error);
        res.status(500).json({ success: false, error: 'Failed to process reward' });
    }
});

// POST /api/referrals/use-balance - Use referral balance as discount
router.post('/use-balance', requireAuth, async (req, res) => {
    try {
        const { amount } = req.body;

        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const availableBalance = user.referralBalance || 0;
        const useAmount = Math.min(amount, availableBalance);

        if (useAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: 'No referral balance available'
            });
        }

        // Deduct balance
        await User.findByIdAndUpdate(req.userId, {
            $inc: { referralBalance: -useAmount }
        });

        res.json({
            success: true,
            usedAmount: useAmount,
            remainingBalance: availableBalance - useAmount
        });
    } catch (error) {
        console.error('Error using referral balance:', error);
        res.status(500).json({ success: false, error: 'Failed to use balance' });
    }
});

module.exports = router;
