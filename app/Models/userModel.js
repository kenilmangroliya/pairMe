const mongoose = require('mongoose')
const validator = require('validator');

const schema = mongoose.Schema({
    name: {
        type: String,
        require: true,
        trim: true
    },
    google_id: {
        type: String
    },
    facebook_id: {
        type: String
    },
    source: {
        type: String,
        default: 'manual'
    },
    email: {
        type: String,
        require: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                return new Error(`Invalid email address`)
            }
        }
    },
    phone_number: {
        type: String,
        require: true,
    },
    password: {
        type: String,
        require: true,
    },
    otp: {
        type: Number,
        default: 0
    },
    verify: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        default: 'user'
    },
    profile_img: {
        type: String,
        default: '/upload/profileimg/default_profile.webp'
    },
    randomstring: {
        type: String,
        default: ""
    },
    token: {
        type: String,
        default: ""
    },
    blockstatus: {
        type: Boolean,
        default: false
    },
    wishlist: [Object],
    wishlistRestaurants: [Object],
    wishlistgroceryitems: [Object],
    wishlistgrocerystore: [Object],
    forgot_otp: {
        type: Number,
        default: 0
    },
    forgor_status: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const model = mongoose.model('Auth', schema)

module.exports = model