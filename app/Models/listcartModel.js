const mongoose = require('mongoose');

const listCartSchema = new mongoose.Schema({
    items: [Object],
    pickup: { type: String },
    user_id: { type: String },
    store_id: { type: String },
    cart_id: { type: String },
    formated_price: { type: String },
    type: { type: String }
}, { timestamps: true })

const listCartModel = mongoose.model('listcart', listCartSchema);

module.exports = listCartModel 