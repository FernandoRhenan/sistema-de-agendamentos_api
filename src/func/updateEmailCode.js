const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const User = prisma['user']

const sendAuthCode = require('../func/sendAuthCode')

const updateEmailCode = async (email, id) => {

    const code = await Math.round(Math.random() * 100000)

    try {
        await User.update({
            where: { id: parseInt(id) },
            data: { authCode: code.toString() }
        })

        sendAuthCode(email, code)
    } catch (err) {
        console.log(err)
    }


}

module.exports = updateEmailCode