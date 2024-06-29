const mongoose = require('mongoose');

const dishSchema = new mongoose.Schema({
    product_id: { type: String },
    item_name: { type: String },
    image: { type: String },
    description: { type: String },
    price: { type: String },
    formatted_price: { type: String },
    original_price: { type: String },
    menu_id: { type: String },
    store: {
        _id: { type: String },
        name: { type: String },
        phone_number: { type: String },
        address: { type: Object },
        type: { type: String },
        pickup_enabled: { type: Boolean },
        miles:{ type:String },
        weighted_rating_value: { type: String }
    }
}, { timestamps: true });

const dishModal = mongoose.model("dish", dishSchema);

module.exports = dishModal;