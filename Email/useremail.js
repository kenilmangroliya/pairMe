//=================================userEmail.js================================

const nodemailer = require('nodemailer');
const fs = require('fs');
const handlebars = require('handlebars');

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

async function sendMail(sendData) {
    try {
        return new Promise(async resolve => {
            var file_template = sendData.file_template
            var subject = sendData.subject

            // let transporter = nodemailer.createTransport({
            //     host: "mail.privateemail.com",
            //     port: 465,
            //     secure: true,
            //     auth: {
            //     user: 'frontend.tanthetaa@gmail.com',
            //       pass: 'ocvuwlphecqhquop'
            //     }
            // });
            fs.readFile(file_template, { encoding: 'utf-8' }, function (err, html) {
                var template = handlebars.compile(html);
                var htmlToSend = template(sendData);
                var mailOptions = {
                    from: "noreply@GFTRcoin.io",
                    to: sendData.email,
                    subject: subject,
                    html: htmlToSend
                };
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log("error" + error)
                        return ({ status: false, data: [], message: 'Could not send mail!' });
                    }
                    return ({ status: true, data: [], message: 'mail sent!.' });
                })
            });
        })
    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Unable to send email!", data: {} })
    }
}

async function sendResetPassword(data, randomstring) {

    var mailOptions = {
        from: 'backend.tanthetaa@gmail.com',
        to: `${data.email}`,
        subject: 'Sending Email using Node.js',
        text: `${data.forgot_otp}`
        // text: `<p>hii ${data.name} Please Copy The Link And <a href = 'http://localhost:3332/reset_password?randomstring=${randomstring}'> Reset Your Password</p>`
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
    sendMail,
    sendResetPassword
}