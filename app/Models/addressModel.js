const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user_id: {
        type: String
    },
    full_name: {
        type: String
    },
    mobile_number: {
        type: String
    },
    user_address: [{
        full_name: { type: String },
        mobile_number: { type: String },
        street_num: { type: String },
        street_name: { type: String },
        area: { type: String },
        zipcode: { type: String },
        country: { type: String }

    }]
})

const addressModel = mongoose.model('address', addressSchema);

module.exports = addressModel

