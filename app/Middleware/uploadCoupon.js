const multer = require('multer');
const fs = require('fs');
const dir = "upload/couponimg/"

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'upload/couponimg/')
    },
    filename: function (req, file, cb) {
        const ext = file.mimetype.split('/')[1];
        cb(null, file.originalname + '-' + Date.now() + '.' + ext)
    }
})
const maxSize = 4 * 1024 * 1024
var upload_coupon = multer({
    storage: storage,
    limits: { fileSize: maxSize },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/(http(s?):)|([/|.|\w|\s])*\.(?:jpg|gif|png)/)) {
            return cb(new Error("Invalid File Extention"))
        }
        cb(null, true)
    }
}).single('coupon_img')

module.exports = upload_coupon