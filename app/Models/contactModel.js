const mongoose = require('mongoose');
const validator = require('validator');

const contactSchema = new mongoose.Schema({
    contact_name: {
        type: String
    },
    contact_number: {
        type: String
    }
})

const contactModel = mongoose.model('contact', contactSchema);

module.exports = contactModel 