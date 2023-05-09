require('dotenv').config()
const nodemailer = require('nodemailer')

let transporter = nodemailer.createTransport({
    host: process.env.NODE_MAILER_HOST,
    port: process.env.NODE_MAILER_PORT,
    auth: {
        user: process.env.NODE_MAILER_USER,
        pass: process.env.NODE_MAILER_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        var info = await transporter.sendMail({
            from: '"Fernando Teste" <sandbox.smtp.mailtrap.io>',
            to: to,
            subject: subject,
            html: html
        });
    } catch (error) {
        console.log(error)
    }

    return info 
}

module.exports = sendEmail