const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const randomstring = require("randomstring");
const fs = require("fs");
const HTTP = require('../../constants/responseCode.constant');
const adminModel = require('../Models/userModel');
const restaurantsModel = require('../Models/restaurantsModel')
const dishModel = require('../Models/dishModel')
const couponModel = require('../Models/couponModel')
const stripe = require('stripe')(process.env.stripe_secret_key);
const { sendResetPasswordadmin } = require('../../Email/adminemail');
const { findOneAndUpdate } = require('../Models/listcartModel');

//----------------------------------------------------------------Admin Default Signup----------------------------------------------------------------
(async function defaultAdminSighup(req, res) {
    try {
        const adminData = {
            name: "admin",
            email: "kenilmangroliya@gmail.com",
            password: "GTGadmin@2023",
            role: "admin"
        };
        const exiting = await adminModel.findOne({ email: adminData.email })
        if (exiting) return
        const hashedPassword = await bcrypt.hash(adminData.password, 10);
        const data = await adminModel({ ...adminData, password: hashedPassword }).save();
        return
    } catch (error) {
        return
    }
})();

//----------------------------------------------------------------Admin Signin----------------------------------------------------------------
const adminlogin = async (req, res) => {
    try {
        const findAdmin = await adminModel.findOne({ email: req.body.email })
        if (!findAdmin) {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Email Is Not Valid" })
        }
        bcrypt.compare(req.body.password, findAdmin.password, (err, result) => {
            if (result) {
                const adminToken = jwt.sign({ _id: findAdmin._id }, process.env.SECRET_KEY)
                return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Login Successfully", token: adminToken })
            } else {
                return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "Password Do Not Match" })
            }
        })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

//----------------------------------------------------------------Admin Show All User----------------------------------------------------------------
const getall = async (req, res) => {
    console.log("=========getall=========")
    try {
        const findall = await adminModel.find({ role: "user" })
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: findall })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

//----------------------------------------------------------------Admin Dashboard----------------------------------------------------------------
const countuser = async (req, res) => {
    console.log("=========countUser=========")
    try {
        // count
        const countUser = await adminModel.count({ role: "user" })
        const countRestaurants = await restaurantsModel.count({})
        const countDishes = await dishModel.count({})

        return res.status(HTTP.SUCCESS).send({
            status: true, code: HTTP.SUCCESS, data:
                [
                    { title: "Total users", range: "(All Time)", value: countUser, path: "/Users" },
                    { title: "Active User", range: "(Last 30 Days)", value: 20 },
                    { title: "New User", range: "(Last 7 Days)", value: 10 },
                    { title: "Total Dish", range: "(All Time)", value: countDishes, path: "/Dish" },
                    { title: "Total Restaurents", range: "(All Time)", value: countRestaurants, path: "/Restaurants" },
                    { title: "Total Grocery Items", range: "(All Time)", value: 60 },
                    { title: "Total Grocery Store", range: "(All Time)", value: 20 },
                    { title: "Total Grocery Company", range: "(All Time)", value: 60 }
                ]
        })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

//----------------------------------------------------------------Forgot Admin Password----------------------------------------------------------------
const forgotAdminPassword = async (req, res) => {
    try {
        const Data = await adminModel.findOne({ email: req.body.email })
        if (Data) {
            const randomString = randomstring.generate();
            await adminModel.findOneAndUpdate({ email: req.body.email }, { randomstring: randomString }, { new: true })
            sendResetPasswordadmin(Data, randomString)
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "plzz check your email and reset your password" })
        }
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

//----------------------------------------------------------------Reset Admin Password----------------------------------------------------------------
const resetAdminPassword = async (req, res) => {
    try {
        var randomToken = await adminModel.findOne({ randomstring: req.query.randomstring })
        if (randomToken) {
            newPassword = req.body.newPassword
            confirmPassword = req.body.confirmPassword

            if (newPassword === confirmPassword) {
                const bpass = await bcrypt.hash(newPassword, 10);
                await adminModel.findOneAndUpdate({ _id: randomToken._id }, { password: bpass, randomstring: "" }, { new: true });
                return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Your Password Is Reset" })
            }
            else {
                return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "password and confirmPassword is Not Match" })
            }
        }
        else {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: "your link has been expired (plzz check your query link)" })
        }
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

//----------------------------------------------------------------Admin Can Block The User----------------------------------------------------------------
const blockUser = async (req, res) => {
    console.log("=========blockuser=========")
    try {
        const findUser = await adminModel.findOne({ email: req.body.email })
        if (!findUser) { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.BAD_REQUEST, msg: 'Plzz Check Your Email' }) }
        if (findUser.blockstatus === true) {
            findUser.blockstatus = false
            await findUser.save()
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "User Is Unblock", data: findUser })
        }
        if (findUser.blockstatus === false) {
            findUser.blockstatus = true
            await findUser.save()
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "User Is Blocked", data: findUser })
        }
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

//----------------------------------------------------------------Coupon----------------------------------------------------------------

// const create_coupon = async (req, res) => {
//     try {
//         const { coupon_name, expired_coupon, discount } = req.body
//         const couponAdd = new couponModel({
//             coupon_name: coupon_name,
//             expired_coupon: expired_coupon,
//             discount: discount,
//             coupon_img: "/upload/couponimg/" + req.file.filename
//         })
//         const save = await couponAdd.save()
//         return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: save })
//     } catch (error) {
//         return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
//     }
// }
// const update_coupon = async (req, res) => {
//     try {
//         const findCoupon = await couponModel.findOne({ _id: req.params.coupon_id })
//         if (req.body) {
//             await couponModel.findOneAndUpdate({ _id: req.params.coupon_id }, { $set: req.body }, { new: true })
//         }
//         if (req.file) {
//             if (findCoupon.coupon_img) {
//                 fs.unlinkSync('.' + findCoupon.coupon_img)
//             }
//             await couponModel.findOneAndUpdate({ _id: req.params.coupon_id }, { coupon_img: '/upload/couponimg/' + req.file.filename }, { new: true })
//             return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "Update Successfully" })
//         }
//     } catch (error) {
//         return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
//     }
// }
// const delete_coupon = async (req, res) => {
//     try {
//         const findData = await couponModel.findById({ _id: req.params.coupon_id })
//         if (findData.coupon_img) {
//             fs.unlinkSync('.' + findData.coupon_img)
//         }
//         const deleteCoupon = await couponModel.findOneAndDelete({ _id: req.params.coupon_id })
//         return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: deleteCoupon })
//     } catch (error) {
//         return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
//     }
// }

//----------------------------------------------------------------Admin Show AllRestaurants----------------------------------------------------------------
const allrestaurants = async (req, res) => {
    console.log("=========allrestaurants=========")
    try {
        const restaurantsData = await restaurantsModel.find({})
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: restaurantsData })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}


//----------------------------------------------------------------Admin Show AllDishes----------------------------------------------------------------
const alldishes = async (req, res) => {
    console.log("=========alldishes=========")
    try {
        const dishData = await dishModel.find({})
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, length: dishData.length, data: dishData })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

//----------------------------------------------------------------Coupon----------------------------------------------------------------
const create_coupon = async (req, res) => {
    const { coupon_name, percent_off, duration } = req.body
    try {
        await stripe.coupons.create({
            percent_off: percent_off,
            duration: duration // Can be 'forever', 'once', or 'repeating'
        });
        const coupons = await stripe.coupons.list();
        await couponModel(coupons.data[0]).save()
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "coupon add successfully" })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

const update_coupon = async (req, res) => {
    const { percent_off, duration } = req.body;
    try {
        await stripe.coupons.create({
            percent_off: percent_off,
            duration: duration,
        });
        const coupons = await stripe.coupons.list();
        await couponModel(coupons.data[0]).save()
        await stripe.coupons.del(req.params.coupon_id);
        await couponModel.findOneAndDelete({ id: req.params.coupon_id })
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "coupon updated" })
    } catch (error) {
        console.error("Error updating coupon:", error.message);
        res.status(500).json({ error: "Failed to update coupon" });
    }
};

const delete_coupon = async (req, res) => {
    const deleted = await stripe.coupons.del(
        req.params.coupon_id
    );
    await couponModel.findOneAndDelete({ id: req.params.coupon_id })
    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "coupon deleted" })
}

module.exports = {
    adminlogin,
    getall,
    countuser,
    forgotAdminPassword,
    resetAdminPassword,
    blockUser,

    create_coupon,
    update_coupon,
    delete_coupon,

    allrestaurants,
    alldishes
}
