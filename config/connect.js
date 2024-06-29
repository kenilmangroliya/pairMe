const mongoose = require('mongoose');

mongoose.connect(process.env.mongoDb, {
    useNewUrlParser: true,
    useUnifiedTopology:true,
})
    .then(() => { console.log("DB Connect Successfully") })
    .catch(() => { console.log("DB Not Connected") })

module.exports = mongoose