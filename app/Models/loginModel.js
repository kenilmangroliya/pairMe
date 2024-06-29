const mongoose = require('mongoose');

const loginSchema = new mongoose.Schema({
    email: {
        type: String
    },
    password: {
        type: String
    }
})

const loginModel = mongoose.model('loginData', loginSchema);

module.exports = loginModel 