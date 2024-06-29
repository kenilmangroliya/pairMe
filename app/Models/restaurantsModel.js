const mongoose = require('mongoose');

const restaurantsSchema = new mongoose.Schema({
    _id: { type: String },
    name: { type: String },
    phone_number: { type: String },
    address: { type: Object },
    type: { type: String },
    description: { type: String },
    cuisines: { type: Array },
    food_photos: { type: Array },
    logo_photos: { type: Array },
    store_photos: { type: Array },
    dollar_signs: { type: String },
    pickup_enabled: { type: Boolean },
    delivery_enabled: { type: Boolean },
    is_open: { type: Boolean },
    quote_ids: { type: Object },
    miles: { type: String },
    weighted_rating_value: { type: String }
}, { timestamps: true });

const restaurantsModal = mongoose.model("restaurant", restaurantsSchema);
module.exports = restaurantsModal;