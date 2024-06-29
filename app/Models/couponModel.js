const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    id: { type: String }
}, { timestamps: true, strict: false })

const couponModel = mongoose.model('Coupon', couponSchema)
module.exports = couponModel