const passport       = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User           = require("../models/User");

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID:          process.env.GOOGLE_CLIENT_ID,
    clientSecret:      process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:       process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback",
    passReqToCallback: true,
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      const email     = profile.emails?.[0]?.value;
      const firstName = profile.name?.givenName  || "User";
      const lastName  = profile.name?.familyName || "";
      const avatar    = profile.photos?.[0]?.value;
      const role      = ["employee","manager","owner"].includes(req.query?.role) ? req.query.role : "employee";

      if (!email) return done(new Error("No email from Google"), null);

      let user = await User.findOne({ email });
      if (user) {
        if (!user.googleId) { user.googleId = profile.id; if (avatar) user.avatar = avatar; await user.save(); }
      } else {
        user = await User.create({
          firstName, lastName, email,
          googleId: profile.id, avatar, role,
          availability:  "Full-Time",
          password:      Math.random().toString(36) + Date.now().toString(36),
          oauthProvider: "google",
        });
      }
      return done(null, user);
    } catch (err) { return done(err, null); }
  }));
  console.log("✅ Google OAuth enabled");
} else {
  console.log("⚠️  Google OAuth disabled — add GOOGLE_CLIENT_ID to .env");
}

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try { done(null, await User.findById(id)); } catch (e) { done(e, null); }
});

module.exports = passport;