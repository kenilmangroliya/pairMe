const passport = require('passport')
const HTTP = require('../../constants/responseCode.constant');

const authUser = async (req, res, next) => {
    console.log("=========================================AUTHUSER================================")
    passport.authenticate('jwt', { session: false }, async (err, userData) => {
        if (err) {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Invalid Token" })
        }
        if (userData) {

            req.user = userData.data;
            return next();
        } else {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Invalid Token" })
        }
    })(req, res, next);
}

const authAdmin = async (req, res, next) => {
    console.log("=========================================AUTHADMIN================================")
    // console.log(req.headers.authorization)
    passport.authenticate('jwt', { session: false }, async (err, adminData) => {
        if (err) {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Invalid Token" })
        }
        if (adminData) {
            req.user = adminData.data;
            return next();
        } else {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Invalid Token" })
        }
    })(req, res, next);
}

const authFacebook = async (req, res, next) => {
    console.log("=========================================AUTH fACEBOOK================================")
    passport.authenticate('facebook', { session: false }, async (err, userProfile) => {
        try {
            if (err) {
                return next(err);
            }
            const user = userProfile
            req.user = user
            return next();
        } catch (error) {
            return next(err)
        }
    })(req, res, next);
}
module.exports = { authUser, authAdmin, authFacebook } 