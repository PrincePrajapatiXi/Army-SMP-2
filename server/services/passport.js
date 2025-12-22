const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    // Google OAuth Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.NODE_ENV === 'production'
            ? 'https://army-smp-2.onrender.com/api/auth/google/callback'
            : 'http://localhost:5000/api/auth/google/callback',
        scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists with this Google ID
            let user = await User.findOne({
                authProvider: 'google',
                providerId: profile.id
            });

            if (user) {
                return done(null, user);
            }

            // Check if user exists with same email (local account)
            const existingEmailUser = await User.findOne({
                email: profile.emails[0].value
            });

            if (existingEmailUser) {
                // Link Google account to existing user
                existingEmailUser.authProvider = 'google';
                existingEmailUser.providerId = profile.id;
                existingEmailUser.isEmailVerified = true; // Google emails are verified
                if (!existingEmailUser.avatar && profile.photos[0]) {
                    existingEmailUser.avatar = profile.photos[0].value;
                }
                await existingEmailUser.save();
                return done(null, existingEmailUser);
            }

            // Create new user with Google account
            // Generate unique username from Google profile
            const baseUsername = profile.displayName
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_')
                .substring(0, 15);

            let username = baseUsername;
            let counter = 1;

            // Ensure username is unique
            while (await User.findOne({ username })) {
                username = `${baseUsername}${counter}`;
                counter++;
            }

            user = new User({
                email: profile.emails[0].value,
                username: username,
                name: profile.displayName,
                avatar: profile.photos[0]?.value || null,
                authProvider: 'google',
                providerId: profile.id,
                isEmailVerified: true // Google emails are already verified
            });

            await user.save();
            return done(null, user);
        } catch (error) {
            console.error('Google OAuth Error:', error);
            return done(error, null);
        }
    }));

    console.log('✅ Google OAuth configured');
} else {
    console.log('⚠️ Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)');
}

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
