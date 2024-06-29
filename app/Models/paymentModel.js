const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user_email: {
        type: String
    },
    user_id: {
        type: String
    },
    payment_method_id: {
        type: String
    },
    card_number: {
        type: String
    }
})

const paymentModel = mongoose.model('payment', paymentSchema);

module.exports = paymentModel