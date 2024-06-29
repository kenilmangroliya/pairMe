require('dotenv').config({ path: './config/.env' })
const express = require('express')
const passport = require('passport')
const cors = require('cors')
const session = require('express-session')
const app = express()
const cookieParser = require('cookie-parser')
const PORT = process.env.PORT || 4000
require('./config/connect')

app.use(passport.initialize());
require('./config/passport')
require("./config/googlepassport")
require('./config/facebookpassport')

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser())
app.use(cors({ origin: true, credentials: true }));
app.use('/upload', express.static("upload"))

// passport.serializeUser(function (user, cb) {
//     cb(null, user)
// });
// passport.deserializeUser(function (obj, cb) {
//     cb(null, obj)
// });

app.use('/', require('./app/Routers/userRoute'))
app.use('/admin', require('./app/Routers/adminRoute'))

app.all('*', (req, res) => {
    res.status(404).send("This URL Is Not Found")
})

app.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
})
