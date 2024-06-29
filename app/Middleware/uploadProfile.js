const multer = require('multer');
const fs = require('fs');
const dir = "upload/profileimg/"

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
}

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'upload/profileimg/')
    },
    filename: function (req, file, cb) {
        const ext = file.mimetype.split('/')[1];
        cb(null, file.originalname + '-' + Date.now() + '.' + ext)
    }
})
const maxSize = 4 * 1024 * 1024
var upload = multer({
    storage: storage,
    limits: { fileSize: maxSize },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/(http(s?):)|([/|.|\w|\s])*\.(?:jpg|gif|png)/)) {
            return cb(new Error("Invalid File Extention"))
        }
        cb(null, true)
    }
}).single('profile_img')

module.exports = upload