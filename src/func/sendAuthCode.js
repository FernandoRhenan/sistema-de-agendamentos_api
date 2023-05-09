const sendEmail = require('./nodeMailer')

const sendAuthCode = async (email, code) => {

    try {

        await sendEmail(email, "Confirmação de conta.",
            `<h1>Seu e-mail de confirmação de conta chegou!</h1><hr/>
        <p>Seu código de autenticação:</p>
        <h2>${code}</h2>
        <hr/>
        <br/>
        <p><b>Caso este e-mail não tenha sido solicitado por você, apenas o ignore.</b></p>
        `)
        
    } catch (err) {
        console.log(err)
    }

}

module.exports = sendAuthCode