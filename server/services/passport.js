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

// Discord OAuth Strategy
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    const DiscordStrategy = require('passport-discord').Strategy;

    const discordClientId = process.env.DISCORD_CLIENT_ID;
    console.log('Initializing Discord Strategy with ID:', discordClientId ? discordClientId.substring(0, 5) + '...' : 'undefined');
    console.log('Callback URL used:', process.env.NODE_ENV === 'production'
        ? 'https://army-smp-2.onrender.com/api/auth/discord/callback'
        : 'http://localhost:5000/api/auth/discord/callback');

    passport.use(new DiscordStrategy({
        clientID: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        callbackURL: process.env.NODE_ENV === 'production'
            ? 'https://army-smp-2.onrender.com/api/auth/discord/callback'
            : 'http://localhost:5000/api/auth/discord/callback',
        scope: ['identify', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
        console.log('Discord Strategy Callback execution...');
        try {
            // Check if user already exists with this Discord ID
            let user = await User.findOne({
                authProvider: 'discord',
                providerId: profile.id
            });

            if (user) {
                return done(null, user);
            }

            // Check if user exists with same email
            const email = profile.email;
            if (email) {
                const existingEmailUser = await User.findOne({ email: email.toLowerCase() });

                if (existingEmailUser) {
                    // Link Discord account to existing user
                    existingEmailUser.authProvider = 'discord';
                    existingEmailUser.providerId = profile.id;
                    existingEmailUser.isEmailVerified = true;
                    if (!existingEmailUser.avatar && profile.avatar) {
                        existingEmailUser.avatar = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`;
                    }
                    await existingEmailUser.save();
                    return done(null, existingEmailUser);
                }
            }

            // Create new user with Discord account
            const baseUsername = profile.username
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '_')
                .substring(0, 15);

            let username = baseUsername;

            // Ensure username is at least 3 characters
            if (username.length < 3) {
                username = `user_${username}`;
            }

            let counter = 1;

            while (await User.findOne({ username })) {
                username = `${baseUsername}${counter}`;
                counter++;
            }

            user = new User({
                email: email || `${profile.id}@discord.user`,
                username: username,
                name: profile.global_name || profile.username,
                avatar: profile.avatar
                    ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                    : null,
                authProvider: 'discord',
                providerId: profile.id,
                isEmailVerified: !!email
            });

            await user.save();
            return done(null, user);
        } catch (error) {
            console.error('Discord OAuth Error:', error);
            // Log full error details for debugging
            if (error.errors) console.error('Validation Errors:', error.errors);
            return done(error, null);
        }
    }));

    console.log('✅ Discord OAuth configured');
} else {
    console.log('⚠️ Discord OAuth not configured (missing DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET)');
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
