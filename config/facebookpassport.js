const passport = require('passport');
const FacebookStrategy = require("passport-facebook");
const usermodel = require("../app/Models/userModel")

passport.use(new FacebookStrategy({
    clientID: process.env.facebook_clientid,
    clientSecret: process.env.facebook_clientsecret,
    callbackURL: "http://localhost:3332/auth/facebook/loginsuccess"
},
    async function (accessToken, refreshToken, profile, callback) {
        console.log("----------------------facebook With Passport--------------------");
        try {
            const facebookUser = await usermodel.findOne({ facebook_id: profile.id })
            if (facebookUser) { return callback(null, facebookUser) }
            console.log("Create New User...")
            const createUser = new usermodel({
                facebook_id: profile.id,
                name: profile._json.name,
                source: profile.provider
            })
            await createUser.save()
            return callback(null, createUser)
        } catch (error) {
            return callback(error, false)
        }
    }));