const axios = require("axios");
const HTTP = require('../../constants/responseCode.constant');
const userModel = require('../Models/userModel')
const groceryModel = require('../Models/groceryModel')
const groceryItemModel = require('../Models/groceryItemModel')

const grocery = async (req, res) => {
    try {
        const { latitude, longitude, store_type } = req.body
        if (!latitude && !longitude && !store_type) return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, msg: "All Field Are Required" })

        const url = `https://api.mealme.ai/search/store/v3?latitude=${latitude}&longitude=${longitude}&store_type=${store_type}`
        const data = await axios.get(url, {
            headers: {
                'id-Token': 'guiltless:ed5c325c-4f70-4dbc-abea-82515e0515bf'
            }
        })
        const arrayGrocery = []
        for (const grocery of data.data.stores) {
            if (grocery.type === "grocery") {
                const findGrosery = await groceryModel.findOne({ _id: grocery._id })
                arrayGrocery.push(grocery)
                if (!findGrosery) {
                    await groceryModel.create(grocery);
                }
            }
        }
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: arrayGrocery })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

const groceryItem = async (req, res) => {
    const { latitude, longitude, keywords } = req.body
    const url = `https://api.mealme.ai/search/product/v4?user_latitude=${latitude}&user_longitude=${longitude}`
    const data = await axios.get(url, {
        headers: {
            'id-Token': 'guiltless:ed5c325c-4f70-4dbc-abea-82515e0515bf'
        }
    })
    const groceryItem = []
    for (const item of data.data.products) {
        if (item.store.type == "grocery") {
            groceryItem.push(item)
            const findItem = await groceryItemModel.findOne({ _id: item._id })
            if (!findItem) {
                await groceryItemModel.create(item)
            }
        }
    }
    return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: groceryItem })
}

// const fetchSubcategoryData = async (store_id, subcategory_id) => {
//     const subcategoryUrl = `https://api.mealme.ai/details/inventory?store_id=${store_id}&subcategory_id=${subcategory_id}`;
//     try {
//         const subcategoryResponse = await axios.get(subcategoryUrl, {
//             headers: {
//                 'id-Token': 'guiltless:ed5c325c-4f70-4dbc-abea-82515e0515bf'
//             }
//         });
//         return subcategoryResponse.data.categories;
//     } catch (error) {
//         console.error("Error in fetchSubcategoryData:", error.message);
//         throw error; // Rethrow the error to be caught in the calling function
//     }
// };

const http = require('http');
const https = require('https');

const axiosInstance = axios.create({
    httpAgent: new http.Agent({ maxSockets: 5 }),  // Adjust the value as needed
    httpsAgent: new https.Agent({ maxSockets: 5 }) // Adjust the value as needed
});

const fetchSubcategoryData = async (store_id, subcategory_id) => {
    const subcategoryUrl = `https://api.mealme.ai/details/inventory?store_id=${store_id}&subcategory_id=${subcategory_id}`;
    try {
        const subcategoryResponse = await axiosInstance.get(subcategoryUrl, {
            headers: {
                'id-Token': 'guiltless:ed5c325c-4f70-4dbc-abea-82515e0515bf'
            }
        });
        return subcategoryResponse.data.categories;
    } catch (error) {
        console.error("Error in fetchSubcategoryData:", error.message);
        throw error; // Rethrow the error to be caught in the calling function
    }
};

const groceryMenu = async (req, res) => {
    const { store_id } = req.body;

    try {
        if (!store_id) {
            return res.status(400).json({ error: 'Missing store_id' });
        }

        const response = await axios.get(`https://api.mealme.ai/details/inventory?store_id=${store_id}`, {
            headers: { 'id-Token': 'guiltless:ed5c325c-4f70-4dbc-abea-82515e0515bf' }
        });

        const categories = response.data.categories;

        const cat_data = []
        for (const category of categories) {
            try {
                const subcategoryData = category.subcategory_id
                    ? await fetchSubcategoryData(store_id, category.subcategory_id)
                    : [category];

                for (i of subcategoryData) {
                    try {
                        const subcategory_Data = i.subcategory_id
                            ? await fetchSubcategoryData(store_id, i.subcategory_id)
                            : [subcategoryData];
                        // console.log("🚀 ~ file: groceryController.js:138 ~ groceryMenu ~ subcategory_Data:", subcategory_Data)
                        cat_data.push(subcategory_Data);
                    } catch (error) {
                        console.error("Error in subcategoryData loop:", error.message);
                    }
                }
            } catch (error) {
                console.error("Error in category loop:", error.message);
            }
        }
        console.log(cat_data.length)
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: cat_data })
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//===================================================== Items Wishlist ===========================================================================
const wishlistAddItems = async (req, res) => {
    const findItem = await groceryItemModel.findOne({ product_id: req.params.product_id })
    if (!findItem) {
        console.log("Item Not Add in DB")
    }
    const Items = {
        name: findItem.item_name,
        image: findItem.image,
        formatted_price: findItem.formatted_price,
        product_id: findItem.product_id,
        pickup: findItem.store.pickup_enabled
    }
    try {
        const user = await userModel.findOne({ _id: req.user._id })
        if (!user) { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "User not found" }) }
        if (!user.wishlistgroceryitems.includes(Items)) {
            user.wishlistgroceryitems.push(Items)
            await user.save()
        }
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: 'Grocery Item added to wishlist' })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}
const wishlistItemRemove = async (req, res) => {
    try {
        const findUser = await userModel.findOneAndUpdate({ _id: req.user._id }, { $pull: { wishlistgroceryitems: { product_id: req.params.product_id } } }, { new: true })
        if (!findUser) { return res.status(404).json({ message: 'User not found' }) }
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: 'Grocery Item remove to wishlist' })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}
const wishlistAllItems = async (req, res) => {
    try {
        const findWishlistGrocery = await userModel.findOne({ _id: req.user._id.toString() })
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: findWishlistGrocery.wishlistgroceryitems })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

//===================================================== Store Wishlist ===========================================================================
const storeWishlistAdd = async (req, res) => {
    const findStore = await groceryModel.findOne({ _id: req.params._id })
    const objStore = {
        _id: findStore._id,
        name: findStore.name,
        logo_photos: findStore.logo_photos,
        rating: findStore.weighted_rating_value
    }
    try {
        const findUser = await userModel.findOne({ _id: req.user._id })
        if (!findUser) return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "User not found" })
        const findStore = await userModel.findOne({ _id: req.user._id, "wishlistgrocerystore._id": objStore._id })
        if (!findStore) {
            findUser.wishlistgrocerystore.push(objStore);
            await findUser.save()
        } else {
            return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: 'grocery Store Already Added' })
        }
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: 'grocery Store added to wishlist' })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}
const storeWishlistRemove = async (req, res) => {
    try {
        const user = await userModel.findOneAndUpdate({ _id: req.user._id }, { $pull: { wishlistgrocerystore: { _id: req.params._id } } }, { new: true })
        if (!user) { return res.status(404).json({ message: 'User not found' }) }
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, message: 'restaurant remove to wishlist' })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}
const storeWishListData = async (req, res) => {
    try {
        const findWishlistStore = await userModel.findOne({ _id: req.user._id })
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: findWishlistStore.wishlistgrocerystore })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

module.exports = {
    grocery,
    groceryItem,
    groceryMenu,

    wishlistAddItems,
    wishlistItemRemove,
    wishlistAllItems,
    storeWishlistAdd,
    storeWishlistRemove,
    storeWishListData,
}