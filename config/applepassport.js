const passport = require('passport');
const AppleStrategy = require('passport-apple');

passport.use(
    new AppleStrategy(
        {
            clientID: '<your_client_id>',
            teamID: '<your_team_id>',
            callbackURL: 'http://localhost:3332/auth/apple/callback',
            keyID: '<your_key_id>',
            privateKeyPath: '<path_to_your_private_key_file>',
        },
        (accessToken, refreshToken, decodedIdToken, profile, done) => {
            // Here, you can perform actions with the obtained user profile or ID token
            // For example, you can save the user to your database or generate a JWT token
            console.log('User profile:', profile);
            console.log('Decoded ID Token:', decodedIdToken);
            // Call the 'done' callback to indicate successful authentication
            done(null, profile);
        }
    )
);
