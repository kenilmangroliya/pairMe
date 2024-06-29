const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    product_id: {
        type: String
    },
    user_id: {
        type: String
    },
    cart_id: {
        type: String,
        required: true
    }
})

const cartModel = mongoose.model('cart', cartSchema);

module.exports = { cartModel }