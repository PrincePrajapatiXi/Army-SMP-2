const express = require('express');
const router = express.Router();
const BannedIP = require('../models/BannedIP');
const LoginAttempt = require('../models/LoginAttempt');

router.post('/api/admin/login', async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const { password } = req.body;

    try {
        const now = new Date();

        // 1. Strict Programmatic Ban Check
        const bannedRecord = await BannedIP.findOne({ ip });
        if (bannedRecord) {
            if (now < bannedRecord.bannedUntil) {
                return res.status(403).json({ 
                    message: "Access denied. Your IP has been flagged for security reasons." 
                });
            } else {
                // Lifespan over, clean up the database document programmatically
                await BannedIP.deleteOne({ ip });
            }
        }

        // 2. Verify Admin Password
        const isPasswordCorrect = (password === process.env.ADMIN_PASSWORD); 

        if (isPasswordCorrect) {
            await LoginAttempt.deleteMany({ ip });
            return res.status(200).json({ success: true, token: "authenticated_session_token" });
        }

        // --- PASSWORD WRONG: EXECUTE THE DECEPTION TRAP ---
        await LoginAttempt.create({ ip });

        // Fetch failures inside a rolling 7-day window
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const failedCount = await LoginAttempt.countDocuments({ 
            ip, 
            createdAt: { $gte: sevenDaysAgo } 
        });

        // 2nd Failed Attempt -> Commit a hard lock 1-week Ban directly to MongoDB Cloud
        if (failedCount >= 2) {
            const oneWeekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            await BannedIP.create({ ip, bannedUntil: oneWeekFromNow });
            await LoginAttempt.deleteMany({ ip }); // Clear raw logging rows

            return res.status(403).json({ 
                message: "Access denied. Your IP has been flagged for security reasons." 
            });
        }

        // 1st Failed Attempt -> DECEPTION: Lie and output 4 attempts left
        if (failedCount === 1) {
            return res.status(401).json({ 
                message: "Invalid password. 4 attempt(s) remaining." 
            });
        }

    } catch (error) {
        console.error("Auth System Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});

module.exports = router;
