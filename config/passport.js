const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userSchema")
const env = require("dotenv").config();



passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3005/auth/google/callback"
},

    async (accessToken, refreshToken, profile, done) => {
        try {
            const fullName = profile.displayName.trim();
            const nameParts = fullName.split(" ");
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(" ") || "";
            let user = await User.findOne({ googleId: profile.id })
            if (user) {
                return done(null, user)
            }


            const existingUser = await User.findOne({ email: profile.emails[0].value });
            if (existingUser) {
                return done(null, false, { message: "Email already used with another account" })
            } else {
                // const fullName = profile.displayName.trim();
                // const nameParts = fullName.split(" ");
                // const firstName = nameParts[0];
                // const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

                user = new User({
                    firstName,
                    lastName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                });
                const googleId = user.googleId
                console.log('googleId from passport', googleId)
                await user.save();
                return done(null, user)
            }
        } catch (error) {
            return done(error, null)
        }

    }


));



passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user)
        })
        .catch(err => {
            done(err, null)
        })
})


module.exports = passport;