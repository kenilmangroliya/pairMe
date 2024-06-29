const express = require('express');
const route = express.Router();
const userController = require('../Controllers/userController')
const { authUser, authFacebook } = require('../Middleware/auth.js')
const upload = require('../Middleware/uploadProfile')
const userModel = require('../Models/userModel')
const HTTP = require('../../constants/responseCode.constant');
const passport = require("passport")
const jwt = require("jsonwebtoken")
const restaurantController = require('../Controllers/restaurantController')
const groceryController = require('../Controllers/groceryController')

//------------------------------------Auth------------------------------------
route.post('/register', userController.register)
route.post('/login', userController.login)
route.post('/verify', userController.verify)
route.get('/profile', authUser, userController.profile)
route.post('/user_update', authUser, upload, userController.userUpdate)
route.post('/forgot_password', userController.forgotPassword)
route.post('/forgot_verify', userController.verify_forgot_otp)
route.post('/reset_password', userController.resetPassword)
route.get('/logout', authUser, userController.logout)

route.post('/restaurants', restaurantController.restaurants)
route.post('/inventory', restaurantController.inventory)
// route.post('/filterHealthy', authUser, restaurantController.filterHealthy)
route.post('/product_details', restaurantController.product_details)
route.post('/dish', restaurantController.dish)

//------------------------------------Add To cart------------------------------------
route.post('/create_cart', authUser, userController.createCart)
// route.post('/Add_to_cart', userController.AddToCart)
route.get('/list_cart', authUser, userController.listCart)
route.post('/remove_cart', authUser, userController.removeCart)
route.post('/quantity', authUser, userController.quantity)
route.get('/totalPrice', authUser, userController.totalPriceInCart)

//------------------------------------Payment------------------------------------
route.post('/payment', authUser, userController.payment)
route.post('/stripepayment', authUser, userController.stripePayment)
route.get('/listpayment', authUser, userController.listPayment)
route.post('/deletepayment', authUser, userController.deletePayment)
route.post('/paymentintent', authUser, userController.paymentIntent)

//------------------------------------Address------------------------------------
route.post('/address', authUser, userController.address)
route.get('/alladdress', authUser, userController.alladdress)
route.post('/edit_address/:id', authUser, userController.editaddress)
route.get('/remove_address/:id', authUser, userController.removeAddress)

//------------------------------------Wishlist------------------------------------
route.post('/wishlist/add/dish', authUser, userController.wishlistAdd)
route.post('/wishlist/remove/dish', authUser, userController.wishlistRemove)
route.get('/allwishlist/dish', authUser, userController.wishListData)

route.get('/wishlist/add/restaurants/:id', authUser, userController.restaurantWishlistAdd)
route.get('/wishlist/remove/restaurants/:id', authUser, userController.restaurantWishlistRemove)
route.get('/allwishlist/restaurants', authUser, userController.restaurantWishListData)

//------------------------------------Login With Google------------------------------------
route.get("/googlelogin", passport.authenticate("google", { scope: ["email", "profile"] }));
route.get("/loginsuccess", passport.authenticate("google", { session: false }), async (user, res, req) => {
    const userid = user.user.id
    const token = jwt.sign({ _id: userid }, process.env.SECRET_KEY);
    const findUser = await userModel.findOne({ _id: userid })
    findUser.token = token;
    await findUser.save();
    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Login Successfully With Google", token: token })
});

route.get('/facebooklogin', passport.authenticate("facebook", { session: false }));
route.get('/auth/facebook/loginsuccess', authFacebook, async (req, res) => {
    // console.log("req.user",req.user)
    const userid = req.user._id
    const token = jwt.sign({ _id: userid }, process.env.SECRET_KEY)
    const findUser = await userModel.findOne({ _id: userid });
    findUser.token = token;
    await findUser.save();
    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Login Successfully With facebook", token: token })
});

// route.get('/auth/apple', passport.authenticate('apple', { scope: ['email', 'name'], }));
// route.get(
//     '/auth/apple/callback',
//     passport.authenticate('apple', {
//         successRedirect: '/success',
//         failureRedirect: '/error',
//     })
// );
// route.get('/success', (req, res) => { res.send('Successfully authenticated with Apple!'); });
// route.get('/error', (req, res) => { res.send('Error occurred during Apple authentication.'); });

route.post('/order_create', authUser, userController.order_create)

route.post("/create_Quote", authUser, userController.create_Quote)
route.post('/create_courier_order', authUser, userController.create_courier_order)

route.post('/notification', userController.notification)


// const jwksClient = require('jwks-rsa');


// const client = jwksClient({
//     jwksUri: 'https://appleid.apple.com/auth/keys'
// });

// const getAppleSigningkey = (kid) => {
//     return new Promise((resolve) => {
//         client.getSigningKey(kid, (err, key) => {
//             if (err) {
//                 console.log(err)
//                 resolve(null)
//                 return
//             }
//             const signingKey = key.getPublicKey()
//             resolve(signingKey)
//         })
//     })
// }

// const verifyJWT = (json, publicKey) => {
//     return new Promise((resolve) => {
//         jwt.verify(json, publicKey, (err, payload) => {
//             if (err) {
//                 console.log(err)
//                 return resolve(null)
//             }
//             resolve(payload)
//         })
//     })
// }

// route.get('/applelogin', async (req, res) => {
//     console.log(req.body)
//     const { provider, response } = req.body

//     if (provider === 'apple') {
//         const { identityToken, user } = response.response

//         const json = jwt.decode(identityToken, { complete: true });
//           const kid = json.header.kid

//         const appleKeys = await getAppleSigningkey(kid)

//         if (!appleKeys) {
//             console.log("Something Went Wrong")
//             return
//         }
//         const payload = await verifyJWT(identityToken, appleKeys)
//         if (!payload) {
//             console.log("Something Went Wrong")
//             return
//         }
//         console.log(("SignIn With Apple Successed!", payload))
//         if (payload.sub === user && payload.aud === 'com.fastthumbs') {
//             console.log("correct User")
//         }
//     }
// })


//------------------------------------filter------------------------------------
route.get('/cuisines_find_restaurant/:cuisine', authUser, userController.cuisines)
route.post('/filter_in_restaurant', authUser, userController.filter_restaurant)
route.post('/filter_in_dish', authUser, userController.filter_dish)
// route.post('/dish_high_to_low', authUser, userController.dishInHighToLow)
// route.post('/dish_low_to_high', authUser, userController.dishInLowToHigh)

//------------------------------------Coupon------------------------------------
route.get('/coupon', authUser, userController.DisplayAllCoupons)
//------------------------------------contact------------------------------------
route.post('/contact', authUser, userController.contact)
route.get('/all_contact', authUser, userController.allcontact)


//------------------------------------------------------------------------grocery------------------------------------------------------------------------

route.post('/grocery_store', authUser, groceryController.grocery)
route.post('/grocery_item', authUser, groceryController.groceryItem)
route.post('/grocery_menu', authUser, groceryController.groceryMenu)

route.get('/wishlist_add_items/:product_id', authUser, groceryController.wishlistAddItems)
route.get('/wishlist_remove_items/:product_id', authUser, groceryController.wishlistItemRemove)
route.get('/wishlist_all_items', authUser, groceryController.wishlistAllItems)
route.get('/wishlist_add_store/:_id', authUser, groceryController.storeWishlistAdd)
route.get('/wishlist_remove_store/:_id', authUser, groceryController.storeWishlistRemove)
route.get('/wishlist_all_store', authUser, groceryController.storeWishListData)




module.exports = route;