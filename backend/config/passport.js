const passport = require("passport");
const User     = require("../models/User");

// ── Google OAuth (only if credentials are set in .env) ────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require("passport-google-oauth20").Strategy;

  passport.use(new GoogleStrategy(
    {
      clientID:          process.env.GOOGLE_CLIENT_ID,
      clientSecret:      process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:       process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email     = profile.emails?.[0]?.value;
        const firstName = profile.name?.givenName  || "User";
        const lastName  = profile.name?.familyName || "";
        const avatar    = profile.photos?.[0]?.value;
        const role      = ["employee", "manager", "owner"].includes(req.query?.role)
                          ? req.query.role : "employee";

        if (!email) return done(new Error("No email from Google"), null);

        let user = await User.findOne({ email });
        if (user) {
          if (!user.googleId) {
            user.googleId = profile.id;
            if (avatar) user.avatar = avatar;
            await user.save();
          }
        } else {
          user = await User.create({
            firstName, lastName, email,
            googleId: profile.id, avatar, role,
            availability: "Full-Time",
            password: Math.random().toString(36) + Date.now().toString(36),
            oauthProvider: "google",
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
  console.log("✅ Google OAuth enabled");
} else {
  console.log("⚠️  Google OAuth disabled — add GOOGLE_CLIENT_ID to .env to enable");
}

// ── Apple OAuth (only if credentials are set in .env) ─────────────────────
if (process.env.APPLE_CLIENT_ID) {
  const AppleStrategy = require("passport-apple").Strategy;

  passport.use(new AppleStrategy(
    {
      clientID:           process.env.APPLE_CLIENT_ID,
      teamID:             process.env.APPLE_TEAM_ID,
      keyID:              process.env.APPLE_KEY_ID,
      privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH,
      callbackURL:        process.env.APPLE_CALLBACK_URL || "http://localhost:5000/api/auth/apple/callback",
      passReqToCallback:  true,
    },
    async (req, accessToken, refreshToken, idToken, profile, done) => {
      try {
        const bodyUser  = req.body?.user ? JSON.parse(req.body.user) : {};
        const email     = idToken?.email || bodyUser?.email;
        const firstName = bodyUser?.name?.firstName || "Apple";
        const lastName  = bodyUser?.name?.lastName  || "User";
        const appleId   = idToken?.sub;
        const role      = ["employee", "manager", "owner"].includes(req.query?.role)
                          ? req.query.role : "employee";

        if (!email && !appleId) return done(new Error("No identifier from Apple"), null);

        let user = email ? await User.findOne({ email }) : await User.findOne({ appleId });
        if (user) {
          if (!user.appleId) { user.appleId = appleId; await user.save(); }
        } else {
          user = await User.create({
            firstName, lastName, appleId, role,
            email: email || `apple_${appleId}@shiftup.local`,
            availability: "Full-Time",
            password: Math.random().toString(36) + Date.now().toString(36),
            oauthProvider: "apple",
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  ));
  console.log("✅ Apple OAuth enabled");
} else {
  console.log("⚠️  Apple OAuth disabled — add APPLE_CLIENT_ID to .env to enable");
}

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try { done(null, await User.findById(id)); } catch (e) { done(e, null); }
});

module.exports = passport;