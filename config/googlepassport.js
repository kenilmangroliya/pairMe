var GoogleStrategy = require('passport-google-oauth20').Strategy;
var usermodel = require('../app/Models/userModel');
var passport = require('passport');



passport.use(new GoogleStrategy({
    clientID: process.env.google_clientId,
    clientSecret: process.env.google_clientSecret,
    callbackURL: "http://localhost:3332/loginsuccess",
    passReqToCallback: true
},
    async (request, accessToken, refreshToken, profile, done) => {
        console.log("🚀 ~ file: googlepassport.js:14 ~ profile:", profile)
        console.log("----------------------Google With Passport--------------------");
        try {
            const existingUser = await usermodel.findOne({ email: profile.emails[0].value });

            if (existingUser) {
                return done(null, existingUser);
            }
            console.log('Creating new user...');
            const newUser = new usermodel({
                googleid: profile.id,
                email: profile.emails[0].value,
                name: profile.name.givenName + " " + profile.name.familyName,
                source: profile.provider
            })
            await newUser.save();
            return done(null, newUser);
        } catch (error) {
            console.log("🚀 ~ file: passport.js:56 ~ error:", error)
            return done(error, false)
        }
    }));