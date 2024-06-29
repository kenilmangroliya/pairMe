const axios = require("axios");
const restaurantsModel = require('../Models/restaurantsModel');
const dishModel = require('../Models/dishModel')
const HTTP = require('../../constants/responseCode.constant');
const { jwt } = require("twilio");

const restaurants = async (req, res) => {
    console.log("==================all restaurant api====================")
    try {
        const { latitude, longitude, store_type } = req.body
        const url = `https://api.mealme.ai/search/store/v3?latitude=${latitude}&longitude=${longitude}&store_type=${store_type}`
        const data = await axios.get(url,
            {
                headers: {
                    'id-Token': 'guiltless:ed5c325c-4f70-4dbc-abea-82515e0515bf'
                }
            })
        const restaurantData = [];

        for (const item of data.data.stores) {   //.slice(0, 50)
            if (item.type === 'restaurant') {
                restaurantData.push(item);
                const existingRestaurant = await restaurantsModel.findOne({ _id: item._id });
                if (!existingRestaurant) {
                    const savedata = await restaurantsModel.create(item);
                }
            }
        }
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: restaurantData })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

const inventory = async (req, res) => {
    const { store_id, user_latitude, user_longitude, user_street_num, user_street_name, user_city, user_state, user_zipcode, user_country } = req.body
    try {
        const data = await axios.get(`https://api.mealme.ai/details/inventory?store_id=${store_id}`,
            {
                headers: {
                    'id-Token': 'guiltless:ed5c325c-4f70-4dbc-abea-82515e0515bf'
                }
            }
        )
        const findResto = await restaurantsModel.findOne({ _id: store_id })
        for (i of data.data.categories) {
            for (j of i.menu_item_list) {
                const findDish = await dishModel.findOne({ product_id: j.product_id })
                if (!findDish) {
                    const obj = new dishModel({
                        product_id: j.product_id,
                        item_name: j.name,
                        image: j.image,
                        description: j.description,
                        price: j.price,
                        formatted_price: j.formatted_price,
                        original_price: j.original_price,
                        menu_id: data.data.menu_id,
                        store: {
                            _id: findResto._id,
                            name: findResto.name,
                            phone_number: findResto.phone_number,
                            address: {
                                street_addr: findResto.address.street_addr,
                                city: findResto.address.city,
                                state: findResto.address.state,
                                zipcode: findResto.address.zipcode,
                                country: findResto.address.country,
                                latitude: findResto.address.latitude,
                                longitude: findResto.address.longitude,
                            },
                            type: findResto.type,
                            pickup_enabled: findResto.pickup_enabled
                        }
                    })
                    obj.save()
                }
            }
        }
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: data.data })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

//  show only healthy dish data in inventory api 
// const filterHealthy = async (req, res) => {
//     const { keyword, store_id } = req.body
//     const options = {
//         method: 'GET',
//         headers: {
//             accept: 'application/json',
//             'content-type': 'application/json',
//             'Id-Token': 'guiltless:ed5c325c-4f70-4dbc-abea-82515e0515bf'
//         },
//     }
//     const array = []
//     await fetch(`https://api.mealme.ai/details/inventory?store_id=${store_id}`, options)
//         .then(response => response.json())
//         .then(async (response) => {
//             for (i of response.categories) {
//                 for (j of i.menu_item_list) {
//                     array.push(j)
//                 }
//             }
//             if (keyword.length === 0) {
//                 return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, length: array.length, data: array })
//             }
//             const filterItems = keyword.split(',');
//             const searchData = array.filter(item =>
//                 !filterItems.some(filterItem =>
//                     item.name.toLowerCase().includes(filterItem.toLowerCase()) ||
//                     item.description.toLowerCase().includes(filterItem.toLowerCase())
//                 )
//             );
//             // console.log("🚀 ~ file: restaurantController.js:120 ~ .then ~ array.customizations:", array)
//             // const search_customizations = array.customizations.filter(item =>
//             //     item.name.toLowerCase().includes(keyword.toLowerCase())
//             // )
//             // console.log("🚀 ~ file: restaurantController.js:120 ~ .then ~ search_customizations:", search_customizations)
//             // const mergeArray = filterItems.concat(search_customizations)
//             return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, length: searchData.length, data: searchData })
//         })
//         .catch(error => { return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.SUCCESS, msg: error.message }) })
// }


const product_details = async (req, res) => {
    const { product_id } = req.body
    const url = `https://api.mealme.ai/details/product?product_id=${product_id}`
    const findProduct = await dishModel.findOne({ product_id: product_id })
    try {
        const product_data = await axios.get(url, {
            headers: {
                'id-Token': 'guiltless:ed5c325c-4f70-4dbc-abea-82515e0515bf'
            }
        })

        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, data: product_data.data, name: findProduct.item_name })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}

const dish = async (req, res) => {
    console.log("==================all dish api====================")
    try {
        const { latitude, longitude, keywords } = req.body
        if (!latitude || !longitude) {
            return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Latitude And Longitude Is Require Field" })
        }
        const dish_url = `https://api.mealme.ai/search/product/v4?user_latitude=${latitude}&user_longitude=${longitude}`
        const dishData = await axios.get(dish_url,
            {
                headers: { 'id-Token': 'guiltless:ed5c325c-4f70-4dbc-abea-82515e0515bf' }
            })
        let dishArray = []
        for (i of dishData.data.products) {
            if (i.store.type === 'restaurant') {
                dishArray.push(i)
                const findDish = await dishModel.findOne({ product_id: i.product_id })
                if (!findDish) {
                    await dishModel.create(i)
                }
            }
        }
        // const filterItems = keywords.split(',');
        // const searchData = dishArray.filter(item =>
        //     !filterItems.some(filterItem =>
        //         item.item_name.toLowerCase().includes(filterItem.toLowerCase()) ||
        //         item.description.toLowerCase().includes(filterItem.toLowerCase())
        //     )
        // );
        return res.status(HTTP.SUCCESS).send({ status: true, code: HTTP.SUCCESS, length: dishArray.length, data: dishArray })
    } catch (error) {
        return res.status(HTTP.SUCCESS).send({ status: false, code: HTTP.INTERNAL_SERVER_ERROR, msg: "Something Went Wrong", error: error.message })
    }
}


module.exports = {
    restaurants,
    inventory,
    // filterHealthy,
    product_details,
    dish
}