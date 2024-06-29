//=================================adminEmail.js================================

const nodemailer = require('nodemailer');

async function sendResetPasswordadmin(data, randomstring) {
    console.log("🚀 ~ file: adminemail.js:6 ~ sendResetPasswordadmin ~ data:", data.email)
    var transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: true,
        service: 'gmail',
        auth: {
            user: 'backend.tanthetaa@gmail.com',
            pass: 'bmgtecaecqdzdciy'
        }
    });

    var mailOptions = {
        from: 'frontend.tanthetaa@gmail.com',
        to: `${data.email}`,
        subject: 'Sending Email using Node.js',
        text: `<p>hii ${data.name} Please Copy The Link And <a href = 'http://192.168.29.238:3000/auth/reset-password?randomstring=${randomstring}'> Reset Your Password</p>`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error.message);
        } else {
            console.log('Email sent successfully: ' + info.response);
        }
    });
}

module.exports = {
    sendResetPasswordadmin
}