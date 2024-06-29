const userModel = require('../Models/userModel')
const HTTP = require('../../constants/responseCode.constant');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const fs = require('fs')
const passport = require('passport')
const randomstring = require("randomstring");
const { sendMail, sendResetPassword } = require('../../Email/useremail');
const { cartModel } = require('../Models/cartModel')
const listCartModel = require('../Models/listcartModel')
const dishModel = require('../Models/dishModel')
const groceryItemModel = require('../Models/groceryItemModel')
const addressModel = require('../Models/addressModel');
const paymentModel = require('../Models/paymentModel')
const restaurantModel = require('../Models/restaurantsModel')
const loginModel = require('../Models/loginModel')
const { response } = require('express');
const couponModel = require('../Models/couponModel')
const contactModel = require('../Models/contactModel')
const stripe = require('stripe')(process.env.stripe_secret_key);

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++  AUTH  ++++++++++++++++++++++++++++++++++++++++++++++++++++++

const name_regex = /^[A-Za-z\s']+$/
const phone_number_regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im
const checkPassword_regex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/

const register = async (req, res) => {
    try {
        const { name, email, phone_number, password } = req.body
        const random_Number = Math.floor(1000 + Math.random() * 9000);
        const finduser = await userModel.findOne({ email: req.body.email })
        if (finduser) { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: 'User Already Exiting' }) }
        if (!req.body.confirmPassword) { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "ConfirmPassword Is Required" }) }
        if (!email || !password) { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Email And Password Is Required" }) }
        if (!name.match(name_regex)) { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Please Enter The Valid Name" }) }
        if (!phone_number.match(phone_number_regex)) { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Phone Number Is Not Valid" }) }
        // if (!password.match(checkPassword_regex)) { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "ConfirmPassword Is Required" }) }
        if (req.body.password == req.body.confirmPassword) {
            const bpass = await bcrypt.hash(req.body.password, 10)

            const obj = new userModel({
                ...req.body,
                password: bpass,
                otp: random_Number,
            })
            var sendMailData = {
                "file_template": 'Emailtemplates/otp_template.html',
                "subject": 'Link to reset the password',
                "otp": obj.otp ? obj.otp : null,
                "username": obj.name ? obj.name : null,
                "email": obj.email ? obj.email : null,
            }
            sendMail(sendMailData)
            obj.save()

            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Register Successfully", obj })
        }
        else {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "password is does't match!" })
        }
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}
const login = async (req, res) => {
    try {
        const findUser = await userModel.findOne({ email: req.body.email })
        if (!findUser) { return res.status(401).send({ status: false, msg: "Email Is Not Existing" }) }

        if (findUser.verify == false) {  //  && findUser.token
            return res.status(401).send({ status: false, msg: "You Are Not Verified" })
        }
        if (findUser.verify === true) {
            bcrypt.compare(req.body.password, findUser.password, async (err, result) => {
                if (result === true) {

                    const token = jwt.sign({ _id: findUser._id }, process.env.SECRET_KEY)
                    findUser.token = token;
                    await findUser.save();


                    // res.cookie('token', token)
                    // console.log(req.cookies.token)
                    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Login Successfully", token: token })
                }
                else {
                    return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Please Valid Password" })
                }
            })
        } else {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Please Varify Your Email" })
        }
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

const verify = async (req, res) => {
    try {
        const email = req.body.email;
        const otp = req.body.otp;

        const findEmail = await userModel.findOne({ email: email })
        if (!findEmail) {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "You Are Not Register" })
        }
        if (findEmail.otp == otp) {
            const Update = await userModel.findOneAndUpdate({ email: email }, { verify: true, otp: 0 }, { new: true })
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Verify Successfully" })
        } else {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Please Enter Valid OTP" })
        }
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

const profile = async (req, res) => {
    try {
        const { name, email, phone_number, profile_img } = req.user
        const obj = {
            name: name,
            email: email,
            phone_number: phone_number,
            profile_img: profile_img
        }
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: obj })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

const userUpdate = async (req, res) => {
    const findData = await userModel.findOne({ _id: req.user._id })
    try {
        if (req.body) {
            console.log("req.body")
            const update = await userModel.findOneAndUpdate({ _id: req.user._id }, { $set: req.body, profile_img: "/upload/profileimg/default_profile.webp" }, { new: true })
            // res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Your Data Has Been updated", data: update })
        }
        if (req.file) {
            if (findData.profile_img == "/upload/profileimg/default_profile.webp") {
                console.log("if part on")
                const updateData = await userModel.findOneAndUpdate({ _id: req.user._id }, { profile_img: "/upload/profileimg/" + req.file.filename }, { new: true });
                return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Your Data Has Been updated", data: updateData })
            } else {
                console.log("else part is on")
                let filename = "." + findData.profile_img
                fs.unlinkSync(filename, (err) => {
                    if (err) console.log(err);
                })
                const newUpdateData = await userModel.findOneAndUpdate({ _id: req.user._id }, { profile_img: "/upload/profileimg/" + req.file.filename }, { new: true })
                return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Your Data Has Been updated", data: newUpdateData })
            }
        }
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

const forgotPassword = async (req, res) => {
    try {
        const randomString = randomstring.generate();
        // const otp = randomstring.generate({ length: 4, charset: 'numeric' })
        const otp = Math.floor(1000 + Math.random() * 9000);

        const findEmail = await userModel.findOne({ email: req.body.email })
        if (findEmail) {
            const newData = await userModel.findOneAndUpdate({ email: req.body.email }, { forgot_otp: otp, randomstring: randomString }, { new: true })
            var sendMailData = {
                "file_template": 'Emailtemplates/otp_template.html',
                "subject": 'Link to reset the password',
                "to": newData.email ? newData.email : null,
                "otp": otp
            }
            sendMail(sendMailData)
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "plzz check your email and reset your password" })
        } else {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "This Email Id Not Valid" })
        }
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

const verify_forgot_otp = async (req, res) => {
    try {
        const forgot_otp = req.body.forgot_otp
        const email = req.body.email


        const findemail = await userModel.findOne({ email: email })
        if (!findemail) { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.SUCCESS, msg: "Please Enter The Valid Email" }) }
        if (findemail.forgot_otp === Number(forgot_otp)) {
            const updateData = await userModel.findOneAndUpdate({ email: email }, { forgot_otp: 0 }, { new: true })
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Go To The Reset Password", data: updateData.randomstring })
        } else {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Please Enter Valid forgot_OTP" })
        }
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

const resetPassword = async (req, res) => {
    try {
        const password = req.body.password
        const randomToken = await userModel.findOne({ randomstring: req.body.randomstring })
        if (randomToken.randomstring === req.body.randomstring) {
            const confirmPassword = req.body.confirmPassword

            if (password === confirmPassword) {
                const bpass = await bcrypt.hash(password, 10);
                await userModel.findOneAndUpdate({ _id: randomToken._id }, { password: bpass, randomstring: "" }, { new: true });
                return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Your Password Is Reset" })
            }
            else {
                return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "password and confirmPassword is Not Match" })
            }
        } else {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "RandomString Do Not Match" })
        }
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

const logout = async (req, res) => {
    try {
        const findUser = await userModel.findOne({ _id: req.user._id })
        findUser.token = null
        await findUser.save()
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "User Logout Successfully" })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

// ++++++++++++++++++++++++++++++++++++++++++++++++++++  CART  +++++++++++++++++++++++++++++++++++++++++++++

const Headers = {
    accept: 'application/json',
    'content-type': 'application/json',
    'Id-Token': 'guiltless:ed5c325c-4f70-4dbc-abea-82515e0515bf'
}

const createCart = async (req, res) => {
    console.log("========================CREATE CART========================")
    const { product_id, pickup } = req.body
    try {
        const options = {
            method: 'POST',
            headers: Headers,
            body: JSON.stringify({
                items: [
                    {
                        product_id: product_id.toString(),
                    }
                ],
                pickup: pickup,
                user_id: req.user._id.toString(),
            })
        };
        await fetch('https://api.mealme.ai/cart/create', options)
            .then(response => response.json())
            .then(async (response) => {
                const findId = await cartModel.findOne({ product_id: product_id })
                if (!findId) {
                    const saveData = await cartModel.create({
                        product_id: product_id,
                        user_id: req.user._id,
                        cart_id: response.cart_id
                    })
                        .then(() => { console.log("ok") })
                        .catch((error) => { return res.status(error.message) })
                } else {
                    console.log("Product Already In Cart")
                    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Product Already In Cart" })
                }
                console.log("🚀 ~ file: userController.js:299 ~ .then ~ response.cart_id:", response.cart_id)
                return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: response.cart_id })
            })
            .catch(error => { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.SUCCESS, msg: error.message }) })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

// const AddToCart = async (req, res) => {
//     const { product_id, cart_id } = req.body
//     try {
//         const option = {
//             method: 'post',
//             headers: Headers,
//             body: JSON.stringify({
//                 items: [
//                     {
//                         product_id: product_id.toString(),
//                     }
//                 ],
//                 cart_id: cart_id,
//             })
//         }
//         const arrayData = []
//         await fetch('https://api.mealme.ai/cart/add', option)
//             .then(response => response.json())
//             .then(response => {
//                 arrayData.push(response)
//             })
//             .catch(err => console.error(err));


//         return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: arrayData })
//     } catch (error) {
//         return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
//     }
// }

const listCart = async (req, res) => {
    console.log("============================listcart=============================")

    const user_id = req.user._id.toString()

    try {
        const options = {
            method: 'GET',
            headers: Headers
        }
        await fetch(`https://api.mealme.ai/cart/list?user_id=${user_id}`, options)
            .then(response => response.json())
            .then(async (response) => {
                const filterData = response.carts.filter(obj => obj.items.length > 0)
                for (let j = 0; j < filterData.length; j++) {
                    for (let i = 0; i < filterData[j].items.length; i++) {

                        // const updated_price = filterData[j].items[i].base_price / 100

                        const findData = await listCartModel.findOne({ items: { $elemMatch: { product_id: filterData[j].items[i].product_id } } })

                        const findProductToData = await dishModel.findOne({ product_id: filterData[j].items[i].product_id })
                        const findProductToData2 = await groceryItemModel.findOne({ product_id: filterData[j].items[i].product_id })

                        let formatted_price = ""
                        let type = ""

                        // if (findProductToData) {
                        //     formatted_price = findProductToData.formatted_price.slice(1)
                        //     type = "Dishes"
                        // } else {
                        //     formatted_price = findProductToData2.formatted_price.slice(1)
                        //     type = "items"
                        // }

                        formatted_price = findProductToData ? findProductToData.formatted_price.slice(1) : findProductToData2.formatted_price.slice(1);
                        type = findProductToData ? "Dishes" : "items";

                        if (!findData) {
                            await listCartModel.create(filterData[j])
                            await listCartModel.findOneAndUpdate({ cart_id: filterData[j].cart_id, store_id: filterData[j].store_id, user_id: filterData[j].user_id }, { formated_price: formatted_price, type: type }, { new: true })
                        }
                    }
                }
                const Data = await listCartModel.find({ user_id: req.user._id.toString() }).sort({ "createdAt": -1 })
                return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: Data })
            })
            .catch(error => {
                console.log(error)
                return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.SUCCESS, msg: error.message })
            })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

const removeCart = async (req, res) => {
    console.log("===========================removeCart===========================")
    const { product_id, cart_id } = req.body
    try {
        const options = {
            method: 'POST',
            headers: Headers,
            body: JSON.stringify({
                items: [
                    {
                        product_id: product_id         //.toString(),
                    }
                ],
                cart_id: cart_id          //.toString(),
            })
        }

        await fetch('https://api.mealme.ai/cart/remove',
            options,
            await listCartModel.findOneAndDelete({
                cart_id: cart_id
            }))
            .then(response => response.json())
            .then(async (response) => {
                const deleteCart = await cartModel.findOneAndDelete({ product_id: product_id })
                return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: response })
            })
            .catch(error => { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.SUCCESS, msg: error.message }) })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

// const quantity = async (req, res) => {
//     try {
//         const { product_id, quantity } = req.body
//         if (!product_id || !quantity) {
//             return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Product_id & Quantity Is Require Filed" });
//         }
//         const filter = { "user_id": req.user._id.toString(), "items.product_id": product_id }
//         const update = { $set: { 'items.$.quantity': quantity } }
//         const data = await listCartModel.updateOne(filter, update, { new: true })

//         const find = await listCartModel.findOne(filter);
//         const findProductId = await listCartModel.findOne({ product_id: product_id })
//         console.log("🚀 ~ file: userController.js:421 ~ quantity ~ findProductId:", findProductId)               //solve this error
//         for (i of find.items) {
//             const updated_price = findProductId.formated_price * i.quantity
//             const a = { $set: { formated_price: updated_price } }
//             await listCartModel.updateOne(filter, a, { new: true })
//         }
//         const findData = await listCartModel.findOne({ _id: find._id })
//         return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: findData })
//     } catch (error) {
//         return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
//     }
// }
const quantity = async (req, res) => {
    try {
        const { product_id, quantity } = req.body
        if (!product_id || !quantity) {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Product_id & Quantity Is Require Filed" });
        }
        const filter = { "user_id": req.user._id.toString(), "items.product_id": product_id }
        const update = { $set: { 'items.$.quantity': quantity } }
        const data = await listCartModel.updateOne(filter, update, { new: true })

        const find = await listCartModel.findOne(filter);

        const findProductId = await dishModel.findOne({ product_id: product_id })
        const findGroceryProductId = await groceryItemModel.findOne({ product_id: product_id })

        let formated_price = ""
        formated_price = findGroceryProductId ? findGroceryProductId.formatted_price.slice(1) : findProductId.formatted_price.slice(1)

        for (i of find.items) {
            const updated_price = formated_price * i.quantity
            const a = { $set: { formated_price: updated_price } }
            await listCartModel.updateOne(filter, a, { new: true })
        }
        const findData = await listCartModel.findOne({ _id: find._id })
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: findData })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

const totalPriceInCart = async (req, res) => {
    try {
        const allPrice = []
        const findData = await listCartModel.find({ user_id: req.user._id.toString() })
        for (i of findData) {
            console.log()
            allPrice.push(i.formated_price)
        }
        const total = allPrice.reduce((a, b) => a + parseFloat(b), 0)
        // if (req.body.coupon_id) {
        //     const findCoupon = await couponModel.findOne({ _id: req.body.coupon_id })
        //     const finalPrice = total - (total * findCoupon.discount / 100)
        //     console.log("🚀 ~ file: userController.js:476 ~ totalPriceInCart ~ finalPrice:", finalPrice)
        //     // return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: finalPrice })
        // }
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: total })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}


//++++++++++++++++++++++++++++++++++++++++++++++++++++  PAYMENT  +++++++++++++++++++++++++++++++++++++++++++++

const payment = async (req, res) => {
    console.log("===================================payment============================================")
    const { card_number, expiry_date, cvv } = req.body
    const expiration_month = Number(expiry_date.slice(0, 2))
    const expiration_year = Number(expiry_date.slice(-4))
    try {
        const options = {
            method: 'POST',
            headers: Headers,
            body: JSON.stringify({
                user_email: req.user.email,
                user_id: req.user._id.toString(),
                payment_method: {
                    card_number: Number(card_number),
                    expiry_date: expiry_date,
                    expiration_year: expiration_year,
                    expiration_month: expiration_month,
                    cvc: Number(cvv)
                }
            })
        }
        await fetch('https://api.mealme.ai/payment/create', options)
            .then(response => response.json())
            .then(async (response) => {
                if (response.status === 'Successfully created payment method') {
                    await paymentModel({
                        user_email: req.user.email,
                        user_id: req.user._id.toString(),
                        payment_method_id: response.payment_method_id,
                        card_number: "************" + card_number.toString().slice(-4)
                    }).save()
                }
                return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: response })
            })
            .catch(error => { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.SUCCESS, msg: error.message }) })
    } catch (error) {
        console.log(error.message);
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

const stripePayment = async (req, res) => {
    const coupon_id = req.body.coupon_id
    const customer = await stripe.customers.create({
        metadata: {
            userId: req.user.id,
            cart: JSON.stringify(req.body.cartItems),
        },
    });

    // const coupon = await stripe.coupons.create({
    //     percent_off: 10, // You can adjust the discount percentage
    //     duration: 'once', // Can be 'forever', 'once', or 'repeating'
    //     // Other coupon properties if needed
    // });
    // console.log("🚀 ~ file: userController.js:532 ~ stripePayment ~ coupon:", coupon)



    const line_items = req.body.cartItems.map((item) => {
        // console.log("🚀 ~ file: userController.js:545 ~ constline_items=req.body.cartItems.map ~ item:", item)
        return {
            price_data: {
                currency: "inr",
                product_data: {
                    name: item.name,
                    // images: [item.image],
                    // description: item.desc,
                    // metadata: {
                    //     id: item.id,
                    // },
                },
                unit_amount: item.price * 100,
            },
            quantity: item.cartQuantity,
        };
    });

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items,
        mode: "payment",
        customer: customer.id,
        success_url: 'http://localhost:3000/success.html',
        cancel_url: 'http://localhost:3000/cancel.html',
        discounts: [
            {
                coupon: coupon_id, // Replace with an actual coupon ID
            },
        ],
    });
    res.send({ url: session.url });
}


const listPayment = async (req, res) => {
    try {
        const options = {
            method: "GET",
            headers: Headers
        }
        await fetch(`https://api.mealme.ai/payment/list?user_id=${req.user._id.toString()}&user_email=${req.user.email}`, options)
            .then(response => response.json())
            .then(async (response) => {
                return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: response })
            })
            .catch(error => { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.SUCCESS, msg: error.message }) })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}


const deletePayment = async (req, res) => {
    const payment_method_id = req.body.payment_method_id
    try {
        const options = {
            method: 'POST',
            headers: Headers,
            body: JSON.stringify({
                payment_method_id: payment_method_id,
                user_id: req.user._id,
                user_email: req.user.email,
            })
        }
        await fetch('https://api.mealme.ai/payment/delete', options)
            .then(response => response.json())
            .then(async (response) => {
                if (response.status === 'Successfully deleted payment method: ' + payment_method_id) {
                    await paymentModel.findOneAndDelete({ payment_method_id: payment_method_id })
                }
                return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: response })
            })
            .catch(error => { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.SUCCESS, msg: error.message }) })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

const paymentIntent = async (req, res) => {
    try {
        const { _id, name, email } = req.user

        const { items, user_phone, pickup, user_dropoff_notes, charge_user, user_street_num, user_street_name, user_city, user_state, user_country, user_zipcode } = req.body
        console.log("🚀 ~ file: userController.js:579 ~ paymentIntent ~ req.body:", req.body)

        //--------------------Find Latitude and longitude--------------------
        const addressobj = {}
        const address = `${user_street_num}, ${user_street_name}, ${user_city}, ${user_state} ${user_zipcode}, ${user_country}`
        const optn = {
            method: 'POST',
            headers: Headers,
            body: JSON.stringify({
                address: address
            })
        }
        await fetch('https://api.mealme.ai/location/geocode/v2', optn)
            .then(response => response.json())
            .then(response => { addressobj.lat = response.lat, addressobj.lng = response.lng })
            .catch(error => { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.SUCCESS, msg: error.message }) })
        let productId = ""
        for (i of items) {
            productId = i.product_id
        }
        const options = {
            method: 'POST',
            headers: Headers,
            body: JSON.stringify({
                items: [
                    { product_id: productId }
                ],
                user_id: _id.toString(),
                user_name: name,
                user_email: email,
                user_phone: user_phone,
                pickup: pickup,
                user_dropoff_notes: user_dropoff_notes,
                charge_user: charge_user,
                user_latitude: addressobj.lat,
                user_longitude: addressobj.lng,
                user_street_num: user_street_num,
                user_street_name: user_street_name,
                user_city: user_city,
                user_state: user_state,
                user_country: user_country,
                user_zipcode: user_zipcode
            })
        }
        await fetch('https://api.mealme.ai/payment/get_payment_intent', options)
            .then(response => response.json())
            .then(async (response) => {
                return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: response })
            })
            .catch(error => { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.SUCCESS, msg: error.message }) })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}


//===================================================== Address ===========================================================================
const address = async (req, res) => {
    try {
        const { full_name, mobile_number, street_num, street_name, area, zipcode, country } = req.body
        const { _id, name, phone_number } = req.user
        const address = [{ full_name: full_name, mobile_number: mobile_number, street_num: street_num, street_name: street_name, area: area, zipcode: zipcode, country: country }]
        const findData = await addressModel.findOne({ user_id: req.user._id })
        if (findData) {
            const obj = await addressModel.findOneAndUpdate({ user_id: req.user._id }, { $push: { user_address: address } }, { new: true })
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: obj })
        }
        const obj = new addressModel({
            user_id: _id.toString(),
            full_name: name,
            mobile_number: phone_number,
            user_address: address
        })
        const saveData = await obj.save()
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: saveData })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })

    }

}
const alladdress = async (req, res) => {
    try {
        const findAddress = await addressModel.findOne({ user_id: req.user._id })
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: findAddress })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}
const editaddress = async (req, res) => {
    try {
        const full_name_regex = /^[A-Za-z\s']+$/;
        const mobile_number_regex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
        const { full_name, mobile_number, street_num, street_name, area, zipcode, state, country } = req.body;

        if (!full_name.match(full_name_regex)) return res.status(HTTP.SUCCESS).send({
            status: false, code: HTTP.BAD_REQUEST, msg: "Please Enter The Valid Name"
        });
        if (!mobile_number.match(mobile_number_regex)) return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Mobile Number Is Not Valid" });

        const findAddress = await addressModel.findOne({ user_id: req.user._id });
        if (!findAddress) return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "No Address Found" });

        const addressIndex = findAddress.user_address.findIndex(addr => addr._id.toString() === req.params.id)
        if (addressIndex === -1) return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Address not found" });

        findAddress.user_address[addressIndex].full_name = full_name;
        findAddress.user_address[addressIndex].mobile_number = mobile_number;
        findAddress.user_address[addressIndex].street_num = street_num;
        findAddress.user_address[addressIndex].street_name = street_name;
        findAddress.user_address[addressIndex].area = area;
        findAddress.user_address[addressIndex].zipcode = zipcode;
        findAddress.user_address[addressIndex].state = state;
        findAddress.user_address[addressIndex].country = country;
        // findAddress.user_address[addressIndex].address = addAddress;

        const editAddress = await findAddress.save();

        // const find = await addressModel.findOne({})

        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: editAddress });
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message });
    }
}
const removeAddress = async (req, res) => {
    try {
        const findAddress = await addressModel.findOne({ user_id: req.user._id })
        if (findAddress) {
            const dltData = await addressModel.updateOne(
                { user_id: req.user._id },
                { $pull: { user_address: { _id: req.params.id } } },
                { new: true }
            )
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: dltData })
        } else {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "No Address Found" })
        }
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

//===================================================== Dish Wishlist ===========================================================================
const wishlistAdd = async (req, res) => {
    console.log("wishlist add")
    const { product_id } = req.body;
    const findProduct = await dishModel.findOne({ product_id: product_id })
    if (!findProduct) {
        console.log("product not add in database")
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Product Not Add In Database" })
    }
    const addProd = {
        name: findProduct.item_name,
        image: findProduct.image,
        formatted_price: findProduct.formatted_price,
        product_id: findProduct.product_id,
        pickup: findProduct.store.pickup_enabled,
    }
    try {
        const user = await userModel.findOne({ _id: req.user._id.toString() });
        if (!user) { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "User not found" }) }
        if (!user.wishlist.includes(addProd)) {
            user.wishlist.push(addProd);
            const a = await user.save();
        }
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: 'Product added to wishlist' })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
};
const wishlistRemove = async (req, res) => {
    console.log("wishlist remove")
    const { product_id } = req.body;
    try {
        const user = await userModel.findOneAndUpdate({ _id: req.user._id.toString() }, { $pull: { wishlist: { product_id: product_id } } }, { new: true });
        if (!user) { return res.status(404).json({ message: 'User not found' }) }
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: 'Product remove to wishlist' })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}
const wishListData = async (req, res) => {
    console.log("all wishlist")
    try {
        const findWishlist = await userModel.findOne({ _id: req.user._id.toString() })
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: findWishlist.wishlist })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

//===================================================== Restauant Wishlist ===========================================================================
const restaurantWishlistAdd = async (req, res) => {
    const findRestaurant = await restaurantModel.findOne({ _id: req.params.id })
    const addRestaurant = {
        _id: findRestaurant._id,
        name: findRestaurant.name,
        logo_photos: findRestaurant.logo_photos,
        rating: findRestaurant.weighted_rating_value,
    }
    try {

        const user = await userModel.findOne({ _id: req.user._id.toString() });
        if (!user) return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "User not found" })
        const findresto = await userModel.findOne({ _id: req.user._id.toString(), "wishlistRestaurants._id": addRestaurant._id });
        if (!findresto) {
            console.log("in user")
            user.wishlistRestaurants.push(addRestaurant);
            await user.save();
        } else {
            console.log("object")
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: 'Restaurant Already Added' })
        }
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: 'Restaurant added to wishlist' })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}
const restaurantWishlistRemove = async (req, res) => {
    try {
        const user = await userModel.findOneAndUpdate({ _id: req.user._id.toString() }, { $pull: { wishlistRestaurants: { _id: req.params.id } } }, { new: true })
        if (!user) { return res.status(404).json({ message: 'User not found' }) }
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: 'restaurant remove to wishlist' })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}
const restaurantWishListData = async (req, res) => {
    try {
        const findWishlist = await userModel.findOne({ _id: req.user._id.toString() })
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: findWishlist.wishlistRestaurants })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}


const order_create = async (req, res) => {
    const { name, email, _id, phone_number } = req.user
    const { items, place_order, pickup, charge_user, user_street_num, user_street_name, user_city, user_state, user_country, user_zipcode, user_dropoff_notes, user_latitude, user_longitude } = req.body

    try {
        const addressobj = {}
        const address = `${user_street_num}, ${user_street_name}, ${user_city}, ${user_state} ${user_zipcode}, ${user_country}`
        const optn = {
            method: 'POST',
            headers: Headers,
            body: JSON.stringify({
                address: address
            })
        }
        // await fetch('https://api.mealme.ai/location/geocode/v2', optn)
        //     .then(response => response.json())
        //     .then(response => { addressobj.lat = response.lat, addressobj.lng = response.lng })
        //     .catch(error => { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.SUCCESS, msg: error.message }) })
        const ArrayOption = []
        for (i of items) {
            const options = {
                method: 'POST',
                headers: Headers,
                body: JSON.stringify({
                    place_order: place_order,
                    items: [
                        { product_id: i.product_id }
                    ],
                    pickup: pickup,
                    // user_latitude: addressobj.lat,
                    // user_longitude: addressobj.lng,
                    user_latitude: user_latitude,
                    user_longitude: user_longitude,
                    user_street_num: user_street_num,
                    user_street_name: user_street_name,
                    user_city: user_city,
                    user_state: user_state,
                    user_country: user_country,
                    user_zipcode: user_zipcode,
                    user_dropoff_notes: user_dropoff_notes,
                    user_name: name,
                    user_email: email,
                    user_phone: Number(phone_number),
                    user_id: _id,
                    charge_user: charge_user
                })
            }
            ArrayOption.push(options)
        }
        await fetch('https://api.mealme.ai/order/order/v2', ...ArrayOption)
            .then(response => response.json())
            .then(async (response) => {
                return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: response })
            })
            .catch(error => { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.SUCCESS, msg: error.message }) })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

// which store Data add in api 
// Check postman api
const create_Quote = async (req, res) => {
    try {
        const { name, email, phone_number } = req.user
        // const { items, pickup_minutes_eta, prefer_cheapest, driver_tip_cents, store_name, store_phone,user_latitude, user_longitude, user_street_num, user_street_name, user_city, user_state, user_country, user_zipcode, store_latitude, store_longitude, store_street_num, store_street_name, store_city, store_state, store_country, store_zipcode, sales_tax_cents } = req.body
        const { items, pickup_minutes_eta, prefer_cheapest, driver_tip_cents, sales_tax_cents, user_address, store_name, store_phone, store_latitude, store_longitude, street_addr, store_city, store_state, store_country, store_zipcode } = req.body
        let item_name = ""
        let price = ""
        let quantity = ""
        // const address = `${user_street_num}, ${user_street_name}, ${user_city}, ${user_state}, ${user_country}, ${user_zipcode}`

        const user_Lat_Lng = {}
        const user_location = {
            method: "POST",
            headers: Headers,
            body: JSON.stringify({
                address: user_address
            })
        }
        await fetch('https://api.mealme.ai/location/geocode/v2', user_location)
            .then(response => response.json())
            .then(async (response) => {
                user_Lat_Lng.lat = response.lat, user_Lat_Lng.lng = response.lng
            })

        const addressComponents = user_address.split(" ");
        const user_street_num = addressComponents[0];
        const user_street_name = addressComponents.slice(1, -4).join(" ");
        const user_city = addressComponents[addressComponents.length - 4];
        const user_state = addressComponents[addressComponents.length - 3];
        const user_country = addressComponents[addressComponents.length - 2];
        const user_zipcode = addressComponents[addressComponents.length - 1];

        // console.log("items ===========>", items);

        for (i of items) {
            item_name = i.name,
                price = i.price,
                quantity = i.quantity
        }
        const options = {
            method: 'POST',
            headers: Headers,
            body: JSON.stringify({
                pickup_minutes_eta: pickup_minutes_eta,
                prefer_cheapest: prefer_cheapest,
                driver_tip_cents: driver_tip_cents,
                store_name: store_name,
                store_phone: store_phone,

                user_name: name,
                user_email: email,
                user_phone: Number(phone_number),

                // user_latitude: user_latitude,
                // user_longitude: user_longitude,
                user_latitude: user_Lat_Lng.lat,
                user_longitude: user_Lat_Lng.lng,
                user_street_num: user_street_num,
                user_street_name: user_street_name,
                user_city: user_city,
                user_state: user_state,
                user_country: user_country,
                user_zipcode: user_zipcode,

                store_latitude: store_latitude,
                store_longitude: store_longitude,
                store_street_num: street_addr.match(/\d+/g).join(''),
                store_street_name: street_addr.replace(/\d+/g, ''),
                store_city: store_city,
                store_state: store_state,
                store_country: store_country,
                store_zipcode: store_zipcode,
                sales_tax_cents: sales_tax_cents,

                items: [
                    {
                        name: item_name,
                        price: price,
                        quantity: quantity
                    },
                    {
                        name: item_name,
                        price: price,
                        quantity: quantity
                    }
                ],
            })
        }
        await fetch('https://api.mealme.ai/courier/quote', options)
            .then(response => response.json())
            .then(async (response) => {
                return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: response })
            })
            .catch(error => { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.SUCCESS, msg: error.message }) })

    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}


// const create_Quote = async (req, res) => {
//     try {
//         const { name, email, phone_number } = req.user
//         // const { items, pickup_minutes_eta, prefer_cheapest, driver_tip_cents, store_name, store_phone, user_latitude, user_longitude, user_street_num, user_street_name, user_city, user_state, user_country, user_zipcode, store_latitude, store_longitude, store_street_num, store_street_name, store_city, store_state, store_country, store_zipcode, sales_tax_cents } = req.body
//         const { items, pickup_minutes_eta, prefer_cheapest, driver_tip_cents, sales_tax_cents, user_address, store_name } = req.body
//         let item_name = ""
//         let price = ""
//         let quantity = ""

//         const addressComponents = user_address.split(" ");
//         const user_street_num = addressComponents[0];
//         const user_street_name = addressComponents.slice(1, -4).join(" ");
//         const user_city = addressComponents[addressComponents.length - 4];
//         const user_state = addressComponents[addressComponents.length - 3];
//         const user_country = addressComponents[addressComponents.length - 2];
//         const user_zipcode = addressComponents[addressComponents.length - 1];


//         const user_Lat_Lng = {}
//         const user_location = {
//             method: "POST",
//             headers: Headers,
//             body: JSON.stringify({
//                 address: user_address
//             })
//         }
//         await fetch('https://api.mealme.ai/location/geocode/v2', user_location)
//             .then(response => response.json())
//             .then(async (response) => {
//                 user_Lat_Lng.lat = response.lat, user_Lat_Lng.lng = response.lng
//             })

//         const storeData = await restaurantModel.findOne({ name: store_name })
//         console.log("🚀 ~ file: userController.js:1059 ~ constcreate_Quote= ~ storeData:", storeData)
//         // console.log("🚀 ~ file: userController.js:1090 ~ constcreate_Quote= ~ storeData.address.latitude:", storeData.address.latitude)
//         // console.log("🚀 ~ file: userController.js:1092 ~ constcreate_Quote= ~ storeData.address.longitude:", storeData.address.longitude)
//         // console.log("🚀 ~ file: userController.js:956 ~ constcreate_Quote= ~ storeData:", storeData.address.street_addr.match(/\d+/g).join(''))
//         // console.log("🚀 ~ file: userController.js:956 ~ constcreate_Quote= ~ storeData:", storeData.address.street_addr.replace(/\d+/g, ''))
//         // console.log("🚀 ~ file: userController.js:1096 ~ constcreate_Quote= ~ storeData.address.city:", storeData.address.city)
//         // console.log("🚀 ~ file: userController.js:1098 ~ constcreate_Quote= ~ storeData.address.state:", storeData.address.state)
//         // console.log("🚀 ~ file: userController.js:1100 ~ constcreate_Quote= ~ storeData.address.country:", storeData.address.country)
//         // console.log("🚀 ~ file: userController.js:1102 ~ constcreate_Quote= ~ storeData.address.zipcode:", storeData.address.zipcode)

//         if (!storeData) {
//             return res.status(HTTP.NOT_FOUND).send({ status: false, code: HTTP.NOT_FOUND, msg: "Store not found" });
//         }

//         for (i of items) {
//             item_name = i.name,
//                 price = i.price,
//                 quantity = i.quantity
//         }
//         const options = {
//             method: 'POST',
//             headers: Headers,
//             body: JSON.stringify({
//                 pickup_minutes_eta: pickup_minutes_eta,
//                 prefer_cheapest: prefer_cheapest,
//                 driver_tip_cents: driver_tip_cents,
//                 store_name: storeData.name,
//                 store_phone: Number(storeData.phone_number),

//                 user_name: name,
//                 user_email: email,
//                 user_phone: Number(phone_number),

//                 user_latitude: user_Lat_Lng.lat,
//                 user_longitude: user_Lat_Lng.lng,
//                 user_street_num: user_street_num,
//                 user_street_name: user_street_name,
//                 user_city: user_city,
//                 user_state: user_state,
//                 user_country: user_country,
//                 user_zipcode: user_zipcode,

//                 store_latitude: storeData.address.latitude,
//                 store_longitude: storeData.address.longitude,
//                 store_street_num: storeData.address.street_addr.match(/\d+/g).join(''),
//                 store_street_name: storeData.address.street_addr.replace(/\d+/g, ''),
//                 store_city: storeData.address.city,
//                 store_state: storeData.address.state,
//                 store_country: storeData.address.country,
//                 store_zipcode: storeData.address.zipcode,
//                 sales_tax_cents: sales_tax_cents,

//                 items: [
//                     {
//                         name: item_name,
//                         price: price,
//                         quantity: quantity
//                     },
//                     {
//                         name: item_name,
//                         price: price,
//                         quantity: quantity
//                     }
//                 ],
//             })
//         }
//         await fetch('https://api.mealme.ai/courier/quote', options)
//             .then(response => response.json())
//             .then(async (response) => {
//                 console.log("🚀 ~ file: userController.js:1123 ~ .then ~ response:", response)
//                 return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: response })
//             })
//             .catch(error => { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.SUCCESS, msg: error.message }) })

//     } catch (error) {
//         console.log("🚀 ~ file: userController.js:1115 ~ constcreate_Quote= ~ error:", error)
//         return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
//     }
// }

const create_courier_order = async (req, res) => {
    try {
        const options = {
            method: 'POST',
            headers: Headers,
            body: JSON.stringify({
                courier_quote_id: req.body.courier_quote_id
            })
        }
        await fetch('https://api.mealme.ai/courier/order', options)
            .then(response => response.json())
            .then(async (response) => {
                return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: response })
            })
            .catch(error => { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.SUCCESS, msg: error.message }) })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

// const fast2sms = require('fast2sms');
const notification = async (req, res) => {
    const accountSid = process.env.twilio_account_SID;
    const authToken = process.env.twilio_authToken;
    const { phone_number } = req.body
    const client = require('twilio')(accountSid, authToken);

    client.messages
        .create({
            body: 'This is the ship that made the Kessel Run in fourteen parsecs?',
            from: '+17623395933',
            to: phone_number
        })
        .then(message => console.log(message.sid))
        .catch(function (err) {
            console.log(err);
        });

    // const a = fast2sms.sendMessage({ authorization: "process.env.secret_key", message: req.body.message, number: [req.body.number] })
    // res.send(a)
}


//===================================================== Filter ===========================================================================

const cuisines = async (req, res) => {
    try {
        const restaurants = await restaurantModel.find({ cuisines: req.params.cuisine, cuisines: { $regex: '^p', $options: 'i' } })
        const filteredCuisines = [];

        restaurants.forEach(restaurant => {
            const hasMatchingCuisine = restaurant.cuisines.some(cuisine => new RegExp('^' + req.params.cuisine, 'i').test(cuisine));
            if (hasMatchingCuisine) {
                filteredCuisines.push(restaurant);
            }
        });
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: filteredCuisines })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message });
    }
}

// const filter_restaurant = async (req, res) => {
//     try {
//         const { restaurantData, start_rating, end_rating } = req.body
//         // console.log("🚀 ~ file: userController.js:1091 ~ constfilter_restaurant= ~ restaurantData:", restaurantData)
//         const filterInRanging = restaurantData.filter(item => item.weighted_rating_value >= start_rating && item.weighted_rating_value <= end_rating)
//         return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: filterInRanging })
//     } catch (error) {
//         return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message });
//     }
// }

const filter_restaurant = async (req, res) => {
    try {
        const { restoId, start_rating, end_rating } = req.body
        const findResto = []
        for (i of restoId) {
            findResto.push(await restaurantModel.findById(i))
        }
        const filterInRanging = findResto.filter(item => item.weighted_rating_value >= start_rating && item.weighted_rating_value <= end_rating)
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: filterInRanging })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message });
    }
}
// const filter_dish = async (req, res) => {
//     const { dishData, start_formatted_price, end_formatted_price, start_rating, end_rating } = req.body
//     console.log("🚀 ~ file: userController.js:1104 ~ constfilter_dish= ~ dishData:", dishData)

//     const filteredData = dishData.filter(item => {
//         if (start_formatted_price && end_formatted_price && start_rating && end_rating) {
//             return (
//                 (item.formatted_price.slice(1) >= start_formatted_price && item.formatted_price.slice(1) <= end_formatted_price) &&
//                 (item.store.weighted_rating_value >= start_rating && item.store.weighted_rating_value <= end_rating)
//             )
//         }
//         else if (start_formatted_price && end_formatted_price) {
//             return (
//                 (item.formatted_price.slice(1) >= start_formatted_price && item.formatted_price.slice(1) <= end_formatted_price)
//             )
//         }
//         else if (start_rating && end_rating) {
//             return (
//                 (item.store.weighted_rating_value >= start_rating && item.store.weighted_rating_value <= end_rating)
//             )
//         }
//     });
//     return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: filteredData })
// }

const filter_dish = async (req, res) => {
    const { dish_product_id, start_formatted_price, end_formatted_price, start_rating, end_rating } = req.body
    const produ_id = []
    for (i of dish_product_id) {
        produ_id.push(await dishModel.findOne({ product_id: i }))
    }

    const filteredData = produ_id.filter((item) => {
        if (start_formatted_price && end_formatted_price && start_rating && end_rating) {
            return (
                (item.formatted_price.slice(1) >= start_formatted_price && item.formatted_price.slice(1) <= end_formatted_price) &&
                (item.store.weighted_rating_value >= start_rating && item.store.weighted_rating_value <= end_rating)
            )
        }
        else if (start_formatted_price && end_formatted_price) {
            console.log("🚀 ~ file: userController.js:1130 ~ filteredData ~ item.formatted_price.slice(1) :", item.formatted_price.slice(1) >= start_formatted_price, item.formatted_price.slice(1) <= end_formatted_price)
            return (
                (item.formatted_price.slice(1) >= start_formatted_price && item.formatted_price.slice(1) <= end_formatted_price)
            )
        }
        else if (start_rating && end_rating) {
            console.log("🚀 ~ file: userController.js:1130 ~ filteredData ~ item.formatted_price.slice(1) :", item.store.weighted_rating_value >= start_rating, item.store.weighted_rating_value <= end_rating)
            return (
                (item.store.weighted_rating_value >= start_rating && item.store.weighted_rating_value <= end_rating)
            )
        }
    });
    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: filteredData })
}

// const dishInHighToLow = async (req, res) => {
//     try {
//         const filterDish = req.body.dishData.sort((a, b) => a.formatted_price.slice(1) - b.formatted_price.slice(1));
//         return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: filterDish })
//     } catch (error) {
//         return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message });
//     }
// }

// const dishInLowToHigh = async (req, res) => {
//     try {
//         const filterDish = req.body.dishData.sort((a, b) => b.formatted_price.slice(1) - a.formatted_price.slice(1))
//         return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: filterDish })
//     } catch (error) {
//         return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message });
//     }
// }


//===================================================== Coupon ===========================================================================
const DisplayAllCoupons = async (req, res) => {
    try {
        const coupons = await stripe.coupons.list();
        const coupon_data = coupons.data.map(coupon => ({
            coupon_id: coupon.id,
            coupon_name: coupon.name,
            percent_off: coupon.percent_off,
            created: coupon.created
        }));

        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: coupon_data });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        return res.status(HTTP.ERROR).send({ status: false, code: HTTP.ERROR, message: 'Error fetching coupons' });
    }
};


//===================================================== contact(invite friend) ===========================================================================
const contact = async (req, res) => {
    const { contact_name, contact_number } = req.body
    const findContact = await contactModel.findOne({ contact_number: contact_number })
    if (findContact) return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Contact Already Added" });
    try {

        const add_contact = new contactModel({
            contact_name: contact_name,
            contact_number: contact_number
        }).save()
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Contact Added Successfully" })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message });
    }
}

const allcontact = async (req, res) => {
    try {
        const all_contact = await contactModel.find({})
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: all_contact })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message });
    }
}



module.exports = {
    register,
    login,
    verify,
    profile,
    userUpdate,
    forgotPassword,
    verify_forgot_otp,
    resetPassword,
    logout,
    //----------------------Cart
    createCart,
    // AddToCart,
    listCart,
    removeCart,
    quantity,
    totalPriceInCart,
    //----------------------Payment
    payment,
    stripePayment,
    listPayment,
    deletePayment,
    paymentIntent,
    // ----------------------Address
    address,
    alladdress,
    editaddress,
    removeAddress,

    // ----------------------Dish Wishlist
    wishlistAdd,
    wishlistRemove,
    wishListData,
    //  ----------------------Restaurants Wishlist
    restaurantWishlistAdd,
    restaurantWishlistRemove,
    restaurantWishListData,

    order_create,
    create_Quote,
    create_courier_order,

    notification,

    //  ----------------------filter
    cuisines,
    filter_restaurant,
    filter_dish,
    // dishInHighToLow,
    // dishInLowToHigh,

    //  ----------------------Coupon
    DisplayAllCoupons,

    //  ----------------------Contect
    contact,
    allcontact
}