const express = require('express');
const route = express.Router();

const adminController = require('../Controllers/adminController');
const restaurantController = require('../Controllers/restaurantController')
const { authAdmin } = require('../Middleware/auth')
const upload_coupon = require('../Middleware/uploadCoupon')

route.post('/login', adminController.adminlogin)
route.get('/getUser', authAdmin, adminController.getall)
route.get('/countuser', authAdmin, adminController.countuser)
route.post('/forgot_password', adminController.forgotAdminPassword)
route.post('/reset_password', adminController.resetAdminPassword)
route.post('/blockuser', authAdmin, adminController.blockUser)

route.post('/add_coupon', authAdmin, upload_coupon, adminController.create_coupon)
route.post('/update_coupon/:coupon_id', authAdmin, upload_coupon, adminController.update_coupon)
route.post('/delete_coupon/:coupon_id', authAdmin, adminController.delete_coupon)

//---------------------------------restaurants--------------------------------
route.get('/allrestaurants', authAdmin, adminController.allrestaurants)
route.get('/alldish', authAdmin, adminController.alldishes)


module.exports = route