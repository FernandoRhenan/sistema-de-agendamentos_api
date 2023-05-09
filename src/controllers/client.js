require('dotenv').config()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const sendEmail = require('../func/nodeMailer')

const { PrismaClient } = require('@prisma/client')
const updateEmailCode = require('../func/updateEmailCode')

const prisma = new PrismaClient()

const Schedule = prisma['schedule']
const FixedSchedule = prisma['fixedSchedule']
const User = prisma['user']
const Seller = prisma['seller']
const SellerSchedule = prisma['sellerSchedule']

module.exports = {

    register: async (req, res) => {
        let { cnpj, name, social, email, phone, password, confirmPassword } = req.body
        if (!email || !name || !social || !cnpj || !password || !confirmPassword || !phone) {
            return res.status(400).json({ message: "Preencha todos os campos!", data: null, error: true })
        }
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Confirmação de senha não aprovada!", data: null, error: true })
        }

        try {

            const returnedCnpj = await User.findUnique({
                where: { cnpj }
            })

            if (returnedCnpj && returnedCnpj.cnpj === cnpj) {
                return res.status(400).json({ message: "Empresa já cadastrada!", data: null, error: true })
            }
        } catch (err) {
            console.log(err)
            return res.status(500).json({ message: "Erro, por favor tente novamente mais tarde!", data: null, error: true })
        }

        const hashPassword = await bcrypt.hash(password, 8)

        try {

            const code = Math.round(Math.random() * 100000)

            const user = await User.create({
                data: {
                    email,
                    cnpj,
                    name,
                    social,
                    phone,
                    attemps: 3,
                    authCode: code.toString(),
                    password: hashPassword
                }
            })

            await sendEmail(email, "Confirmação de conta.",
                `<h1>Seu e-mail de confirmação de conta chegou!</h1><hr/>
        <p>Seu código de autenticação:</p>
        <h2>${code}</h2>
        <hr/>
        <br/>
        <p><b>Caso este e-mail não tenha sido solicitado por você, apenas o ignore.</b></p>
        `)

            res.status(201).json({ message: "Sua conta foi criada!", error: false, data: [user.id, user.email] })

        } catch (err) {
            return res.status(500).json({ message: "Erro ao cadastrar empresa!", data: null, error: true })
        }

    },

    reSendAuthCode: async (req, res) => {

        const { id, email } = req.body

        try {
            await updateEmailCode(email, id)
            return res.status(200).json({ message: "E-mail reenviado", data: null, error: false })
        } catch (err) {
            return res.status(500).json({ message: "Erro ao reenviar o e-mail.", data: null, error: true })

        }
    },

    verifyCode: async (req, res) => {
        const { id, code } = req.params

        try {
            var user = await User.findUnique({
                where: { id: parseInt(id) },
                select: { authCode: true, name: true, attemps: true, id: true }
            })
        } catch (err) {
            return res.status(500).json({ message: "Erro ao reenviar o e-mail.", data: null, error: true })
        }

        if (user.attemps == 0) {
            return res.status(403).json({ message: "Número de tentativas esgotado. Para desbloquear sua conta entre em contato conosco!", error: true, data: null })
        }

        if (user && user.authCode == code) {

            let token = jwt.sign({ userId: id, admin: false }, process.env.JWT_SECRET, {
                expiresIn: 1200
            })

            return res.status(200).json({ message: "Sua conta foi confirmada!", error: false, data: [token, id, user.name] })
        } else {

            try {
                await User.update({
                    where: { id: parseInt(user.id) },
                    data: { attemps: parseInt(user.attemps - 1) }
                })
                return res.status(401).json({ message: "Código não aprovado.", error: true, data: null })
            } catch (err) {
                return res.status(500).json({ message: "Ocorreu um erro. Por favor tente novamente mais tarde.", data: null, error: true })
            }
        }
    },

    confirmAccount: async (req, res) => {
        const { userId } = req.body

        try {
            await User.update({
                data: { confirmedAccount: true },
                where: { id: parseInt(userId) }
            })
            return res.status(200).json({ message: "sucesso", data: null, error: false })
        } catch (err) {
            return res.status(500).json({ message: "Ocorreu um erro. Por favor tente novamente mais tarde.", data: null, error: true })
        }
    },

    login: async (req, res) => {
        const { cleanCnpj: cnpj, password } = req.body

        if (!cnpj || !password) {
            return res.status(400).json({ message: "Preencha todos os campos!", data: null, error: true })
        }

        const replacedCnpj = cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")

        try {
            var user = await User.findUnique({
                where: { cnpj: replacedCnpj },
                select: { id: true, password: true, confirmedAccount: true, name: true }
            })

        } catch (err) {
            return res.status(500).json({ message: "Ocorreu um erro. Por favor tente novamente mais tarde.", data: null, error: true })

        }
        if (!user) {
            return res.status(400).json({ message: "Conta não encontrada!", data: null, error: true })
        }

        if (user.confirmedAccount === false) {
            return res.status(403).json({ message: "Sua conta ainda não foi confirmada!", data: null, error: true })
        }

        if (user) {
            var clearPassword = await bcrypt.compare(password, user.password)
        } else {
            return res.status(400).json({ message: "Credencial(is) incorreta(s)!", data: null, error: true })
        }

        if (clearPassword) {

            let token = await jwt.sign({ userId: user.id, admin: false }, process.env.JWT_SECRET, {
                expiresIn: 1200
            })

            return res.status(200).json({ message: "Sucesso ao fazer login!", error: false, data: [token, user.name] })

        } else {
            return res.status(401).json({ message: "Credencial(is) incorreta(s)!", error: true, data: null })
        }
    },

    changePassword: async (req, res) => {

        const { password, newPassword, confirmNewPassword, id } = req.body
        if (id != req.userId) {
            return res.status(401).json({ message: "Usuário inválido", error: true, data: null })
        }

        if (password == '' || newPassword == '' || confirmNewPassword == '') {
            return res.status(400).json({ message: "Preencha todos os campos!", data: null, error: true })
        }
        if (password == newPassword || password == confirmNewPassword) {
            return res.status(400).json({ message: "A senha atual deve ser diferente da antiga!", data: null, error: true })
        }
        if (newPassword != confirmNewPassword) {
            return res.status(400).json({ message: "Confirmação de senha não aprovada!", data: null, error: true })
        }

        try {

            var user = await User.findUnique({
                where: { id: parseInt(id) },
                select: { password: true }
            })
        } catch (err) {
            return res.status(500).json({ message: "Ocorreu um erro. Por favor tente novamente mais tarde.", data: null, error: true })
        }

        if (user) {
            var clearPassword = await bcrypt.compare(password, user.password)
        } else {
            return res.status(400).json({ message: "Usuário inválido!", data: null, error: true })
        }

        if (clearPassword) {

            try {
                const hashPassword = await bcrypt.hash(confirmNewPassword, 8)
                await User.update({
                    where: { id: parseInt(id) },
                    data: { password: hashPassword }
                })

                return res.status(200).json({ message: "Senha alterada com sucesso!", error: false, data: null })
            } catch (err) {
                return res.status(500).json({ message: "Ocorreu um erro. Por favor tente novamente mais tarde.", data: null, error: true })
            }
        } else {
            return res.status(403).json({ message: "Senha atual incorreta!", error: true, data: null })
        }
    },

    getUser: async (req, res) => {
        const { id } = req.params
        if (id != req.userId) {
            return res.status(401).json({ message: "Usuário inválido", error: true, data: null })
        }

        try {
            const user = await User.findUnique({
                where: { id: parseInt(id) },
                select: { cnpj: true, name: true, social: true, email: true, phone: true }
            })

            return res.status(200).json({ message: "Dados buscados com sucesso!", error: false, data: user })

        } catch (err) {
            return res.status(500).json({ message: "Erro ao buscar os dados!", data: null, error: true })
        }

    },

    updateUser: async (req, res) => {
        const { phone, email, id } = req.body
        if (id != req.userId) {
            return res.status(401).json({ message: "Usuário inválido", error: true, data: null })
        }

        if (!phone || !email) {
            return res.status(400).json({ message: "Preencha todos os campos!", error: true, data: null })
        }

        try {

            const user = await User.update({
                where: {
                    id: parseInt(id)
                },
                data: {
                    email, phone
                }
            })

            return res.status(200).json({ message: "Usuário atualizado com sucesso!", error: false, data: user })
        } catch (err) {
            return res.status(500).json({ message: "Ocorreu um erro. Por favor tente novamente mais tarde!", error: true, data: null })
        }

    },

    getUserByEmail: async (req, res) => {
        const { email } = req.params

        if (!email) {
            return res.status(400).json({ message: "Solicitação recusada!", error: true, data: null })
        }

        try {
            const { id } = await User.findUnique({
                where: { email },
                select: { id: true }
            })
            return res.status(200).json({ message: "Dados buscados com sucesso", error: false, data: id })
        } catch (err) {
            return res.status(500).json({ message: "Ocorreu um erro. Por favor tente novamente mais tarde!", error: true, data: null })
        }

    },

    recoverPasswordEmail: async (req, res) => {
        const { id, email } = req.params

        if (!id) {
            return res.status(400).json({ message: "Preencha o campo de e-mail!", error: true, data: null })
        }

        try {

            let token = await jwt.sign({ id }, process.env.JWT_SECRET_REC_PASS, {
                expiresIn: 300
            })

            let [part1, part2, part3] = [token.split('.')[0], token.split('.')[1], token.split('.')[2]]

            let formatedToken = part1 + "~" + part2 + "~" + part3

            await sendEmail(email, "Alteração de senha.",
                `<h1>Seu e-mail de alteração de senha chegou!</h1><hr/>
        <p>Para continuar acesse o link abaixo:</p>
        <a href="${process.env.FRONT_URL}/recover-password/${formatedToken}">Clique aqui.</a>
        <hr/>
        <br/>
        <p><b>Caso este e-mail não tenha sido solicitado por você, apenas o ignore.</b></p>
        `)

            return res.status(200).json({ message: "Foi enviado um e-mail para a sua caixa de entrada!", error: false, data: null })

        } catch (err) {
            return res.status(500).json({ message: "Ocorreu um erro. Por favor tente novamente mais tarde.", error: true, data: null })
        }
    },

    updatePassword: async (req, res) => {
        const id = req.id
        const { newPassword, confirmPassword } = req.body

        if (newPassword != confirmPassword) {
            return res.status(400).json({ message: "Confirmação de senha não aprovada!", error: true, data: null })
        }

        try {

            const hashPassword = await bcrypt.hash(newPassword, 8)

            await User.update({
                where: { id: parseInt(id) },
                data: { password: hashPassword }
            })

            return res.status(200).json({ message: "Sua senha foi alterada!", error: false, data: null })
        } catch (err) {
            return res.status(500).json({ message: "Ocorreu um erro. Por favor tente novamente mais tarde.", error: true, data: null })
        }


    },

    // reportError: async (req, res) => {
    //     const userId = req.userId
    //     const { text, imageUrl } = req.body

    //     if (text && imageUrl) {

    //         try {
    //             await sendEmail('email', "Problemas no sistema.",
    //                 `<h1>O usuário com ID ${userId} enviou:</h1><hr/>
    //     <p>${text}</p>
    //     <img src=${imageUrl} alt='imagem' />
    //     <hr/>
    //     <br/>
    //     `)
    //             return res.status(200).json({ message: "Sua mensagem foi entregue. Obrigado por contribuir!", error: false, data: null })
    //         } catch (err) {
    //             return res.status(500).json({ message: "Ocorreu um erro. Por favor tente novamente mais tarde.", error: true, data: null })
    //         }

    //     } else {
    //         return res.status(400).json({ message: "Preencha o formulário por completo!", error: true, data: null })
    //     }
    // },

    newSchedule: async (req, res) => {
        const { date, time, day, boxQnt, loadValue, userId } = req.body

        if (!date) {
            return res.status(400).json({ message: "Preencha uma data!", error: true, data: null })
        }
        if (!time) {
            return res.status(400).json({ message: "Preencha um horário!", error: true, data: null })
        }
        if (!day) {
            return res.status(400).json({ message: "Preencha o dia!", error: true, data: null })
        }

        const countSchedule = await Schedule.count({
            where: { userId: parseInt(userId) }
        })
        const countFixedSchedule = await FixedSchedule.count({
            where: { userId: parseInt(userId) }
        })

        if (countFixedSchedule != 0 || countSchedule != 0) {
            return res.status(403).json({ message: "Sua empresa já tem um horário agendado!", error: true, data: null })
        }

        try {
            await Schedule.create({
                data: {
                    date,
                    time,
                    day,
                    boxQnt,
                    loadValue,
                    userId: parseInt(userId)
                }
            })

            return res.status(201).json({ error: false, message: "Horário agendado com sucesso!", data: null })

        } catch (err) {
            return res.status(500).json({ message: "Erro ao agendar horário!", error: true, data: null })
        }

    },

    // Cria um agendamento fixo quinzenal
    newFixedSchedule: async (req, res) => {
        const { time, day, frequency, currentDelivery, nextDelivery, nextNextDelivery, userId } = req.body

        if (!time) {
            return res.status(400).json({ message: "Preencha um horário!", error: true, data: null })
        }
        if (!day) {
            return res.status(400).json({ message: "Preencha um dia!", error: true, data: null })
        }
        if (!frequency) {
            return res.status(400).json({ message: "Preencha a frequência das entregas!", error: true, data: null })
        }
        if (!currentDelivery) {
            return res.status(400).json({ message: "Preencha a data da primeira entrega!", error: true, data: null })
        }

        const countSchedule = await Schedule.count({
            where: { userId: parseInt(userId) }
        })
        const countFixedSchedule = await FixedSchedule.count({
            where: { userId: parseInt(userId) }
        })

        if (countFixedSchedule != 0 || countSchedule != 0) {
            return res.status(403).json({ message: "Sua empresa já tem um horário agendado!", error: true, data: null })
        }

        try {
            await FixedSchedule.create({
                data: {
                    time,
                    day,
                    frequency,
                    currentDelivery,
                    nextDelivery,
                    nextNextDelivery,
                    userId: parseInt(userId)
                }
            })

            return res.status(201).json({ error: false, message: `Foi criado um horário ${frequency} para as entregas.`, data: null })

        } catch (err) {
            if (err.code == 'P2002') {
                return res.status(403).json({ message: "Para agendar novamente, primeiro apague seu agendamento atual!", error: true, data: null })
            }
            return res.status(500).json({ message: "Erro. Por favor, tente novamente mais tarde.", error: true, data: null })
        }


    },

    getSchedules: async (req, res) => {
        const { id } = req.params

        try {
            const schedules = await Schedule.findUnique({
                where: { userId: parseInt(id) },
                select: { id: true, date: true, time: true, day: true, boxQnt: true, loadValue: true }
            })
            const fixedSchedules = await FixedSchedule.findUnique({
                where: { userId: parseInt(id) },
                select: { id: true, time: true, day: true, frequency: true, currentDelivery: true, nextDelivery: true, nextNextDelivery: true }
            })
            return res.status(200).json({ error: false, data: { schedules, fixedSchedules }, message: "Dados buscados com sucesso!" })
        } catch (err) {
            return res.status(500).json({ message: "Erro ao buscar os dados!", error: true, data: null })
        }
    },

    getSchedule: async (req, res) => {
        const { id } = req.params

        try {
            const schedules = await Schedule.findUnique({
                where: { id: parseInt(id) },
                select: { id: true, date: true, time: true, day: true, boxQnt: true, loadValue: true }
            })

            return res.status(200).json({ error: false, data: schedules, message: "Dados buscados com sucesso!" })
        } catch (err) {
            return res.status(500).json({ message: "Erro ao buscar os dados!", error: true, data: null })
        }
    },

    // Chega a disponibilidade de horários nas datas escolhidas pelo usuário
    // Chamado quando o usuário escolher para fazer um agendamento fixo
    checkFixedSchedule: async (req, res) => {

        let timeSchedules = [];

        const { date1, date2, date3, day } = req.params

        try {
            const dates = await FixedSchedule.findMany({
                where: {
                    OR: [
                        { currentDelivery: { contains: date1 } },
                        { currentDelivery: { contains: date2 } },
                        { currentDelivery: { contains: date3 } },
                        { nextDelivery: { contains: date1 } },
                        { nextDelivery: { contains: date2 } },
                        { nextDelivery: { contains: date3 } },
                        { nextNextDelivery: { contains: date1 } },
                        { nextNextDelivery: { contains: date2 } },
                        { nextNextDelivery: { contains: date3 } },
                        { day: { contains: day } }
                    ],
                },
                select: { time: true, day: true, frequency: true, currentDelivery: true, nextDelivery: true, nextNextDelivery: true, id: true }
            })

            const date = await Schedule.findMany({
                where: {
                    OR: [
                        { date: { contains: date1 } },
                        { date: { contains: date2 } },
                        { date: { contains: date3 } }
                    ]
                },
                select: { time: true, day: true, date: true, id: true }
            })

            // Filtra os agendamentos semanais que caem no dia da semana escolhido.
            let weeklyFrequency = dates.filter((item) => {
                return item.frequency == 'semanal'
            })

            let fortnightlyFrequency = dates.filter((item) => {
                return item.frequency == 'quinzenal'
            })

            for (let i = 0; i < weeklyFrequency.length; i++) {
                timeSchedules.push(weeklyFrequency[i].time)
            }
            for (let i = 0; i < fortnightlyFrequency.length; i++) {
                let { currentDelivery, nextDelivery, nextNextDelivery } = fortnightlyFrequency[i]

                if (date1 == currentDelivery ||
                    date1 == nextDelivery ||
                    date1 == nextNextDelivery ||
                    date2 == currentDelivery ||
                    date2 == nextDelivery ||
                    date2 == nextNextDelivery ||
                    date3 == currentDelivery ||
                    date3 == nextDelivery ||
                    date3 == nextNextDelivery) {

                    timeSchedules.push(fortnightlyFrequency[i].time)
                }

            }
            // Pega os agendamentos exporadicos que caem no na data escolhida pelo usuário.
            for (let i = 0; i < date.length; i++) {
                let timeDate = date[i].time
                timeSchedules.push(timeDate)
            }

            // Definindo padrão de horários para receber no front.
            let standardTime = []
            for (let i = 0; i < timeSchedules.length; i++) {
                standardTime[i] = timeSchedules[i].slice(0, 5)
            }

            return res.status(200).json({ error: false, message: "Dados buscados com sucesso!", data: standardTime })


        } catch (err) {
            return res.status(500).json({ message: "Erro, por favor tente novamente mais tarde!", error: true, data: null })
        }

    },

    // Chega a disponibilidade de horários nas datas escolhidas pelo usuário
    // Chamado quando o usuário escolher para fazer um agendamento exporádico
    checkSchedule: async (req, res) => {
        const { date1, day } = req.params

        let timeSchedules = [];

        try {
            const dates = await FixedSchedule.findMany({
                where: {
                    OR: [
                        { currentDelivery: { contains: date1 } },
                        { nextDelivery: { contains: date1 } },
                        { nextNextDelivery: { contains: date1 } },
                        { day: { contains: day } }
                    ],

                },
                select: { time: true, day: true, frequency: true, currentDelivery: true, nextDelivery: true, nextNextDelivery: true, id: true }
            })

            const date = await Schedule.findMany({
                where: {
                    date: date1
                },
                select: { time: true, day: true, date: true, id: true }
            })

            let weeklyFrequency = dates.filter((item) => {
                return item.frequency == 'semanal'
            })

            let fortnightlyFrequency = dates.filter((item) => {
                return item.frequency == 'quinzenal'
            })

            for (let i = 0; i < weeklyFrequency.length; i++) {
                timeSchedules.push(weeklyFrequency[i].time)
                // Modificar para retornar todos os horarios semanais indiponiveis
            }
            for (let i = 0; i < fortnightlyFrequency.length; i++) {
                let { currentDelivery, nextDelivery, nextNextDelivery } = fortnightlyFrequency[i]

                if (date1 == currentDelivery ||
                    date1 == nextDelivery ||
                    date1 == nextNextDelivery
                ) {

                    timeSchedules.push(fortnightlyFrequency[i].time)
                }

            }
            // Pega os agendamentos exporadicos que caem no na data escolhida pelo usuário.
            for (let i = 0; i < date.length; i++) {
                let timeDate = date[i].time
                timeSchedules.push(timeDate)
            }

            // Definindo padrão de horários para receber no front.
            let standardTime = []
            for (let i = 0; i < timeSchedules.length; i++) {
                standardTime[i] = timeSchedules[i].slice(0, 5)
            }

            return res.status(200).json({ error: false, message: "Dados buscados com sucesso!", data: standardTime })

        } catch (err) {
            return res.status(500).json({ message: "Erro, por favor tente novamente mais tarde!", error: true, data: null })
        }
    },

    updateSchedule: async (req, res) => {
        const { date, time, day, boxQnt, loadValue, id } = req.body


        if (!date) {
            return res.status(400).json({ message: "Preencha uma data!", error: true, data: null })
        }
        if (!time) {
            return res.status(400).json({ message: "Preencha um horário!", error: true, data: null })
        }
        if (!day) {
            return res.status(400).json({ message: "Preencha o dia!", error: true, data: null })
        }

        try {
            await Schedule.update({
                where: { id: parseInt(id) },
                data: {
                    date, time, day, boxQnt, loadValue
                }
            })

            return res.status(200).json({ error: false, message: "Dados alterados com sucesso!", data: null })

        } catch (err) {
            return res.status(500).json({ message: "Erro, por favor tente novamente mais tarde!", error: true, data: null })
        }
    },

    updateFixedSchedule: async (req, res) => {
        const { time, day, frequency, currentDelivery, nextDelivery, nextNextDelivery, id } = req.body

        if (!time) {
            return res.status(400).json({ message: "Preencha um horário!", error: true, data: null })
        }
        if (!day) {
            return res.status(400).json({ message: "Preencha um dia!", error: true, data: null })
        }
        if (!frequency) {
            return res.status(400).json({ message: "Preencha a frequência das entregas!", error: true, data: null })
        }
        if (!currentDelivery) {
            return res.status(400).json({ message: "Preencha a data da primeira entrega!", error: true, data: null })
        }

        try {
            await FixedSchedule.update({
                data: {
                    time, day, frequency, currentDelivery, nextDelivery, nextNextDelivery
                },
                where: { id: parseInt(id) }
            })

            return res.status(200).json({ error: false, message: "Dados alterados com sucesso!", data: null })
        } catch (err) {
            return res.status(500).json({ message: "Erro, por favor tente novamente mais tarde!", error: true, data: null })
        }
    },

    deleteUser: async (req, res) => {

        const { id } = req.params

        try {
            await User.delete({
                where: { id: parseInt(id) }
            })
            res.status(200).json({ message: "Empresa deletada!", error: false, data: null })
        } catch (err) {
            return res.status(500).json({ message: "Erro ao deletar!", error: true, data: null })

        }
    },

    // Deleta um agendamento exporádico
    deleteSchedule: async (req, res) => {
        const { id } = req.params

        try {
            await Schedule.delete({
                where: { id: parseInt(id) }
            })
            res.status(200).json({ message: "Agendamento cancelado!", error: false, data: null })
        } catch (err) {
            return res.status(500).json({ message: "Erro ao excluir os dados!", error: true, data: null })
        }
    },

    // Deleta um agendamento fixo
    deleteFixedSchedule: async (req, res) => {

        const { id } = req.params

        try {
            await FixedSchedule.delete({
                where: { id: parseInt(id) }
            })
            return res.status(200).json({ message: "Agendamento fixo cancelado!", error: false, data: null })
        } catch (err) {
            return res.status(500).json({ message: "Erro ao excluir os dados!", error: true, data: null })
        }
    },

    checkCnpj: async (req, res) => {
        const { cnpj } = req.params
        if (cnpj) {
            const url = `https://receitaws.com.br/v1/cnpj/${cnpj}`;
            const options = { method: 'GET', headers: { Accept: 'application/json' } };

            try {
                const response = await fetch(url, options);
                const data = await response.json();
                return res.status(200).json({ message: "Empresa válida", error: false, data: data })

            } catch (error) {
                return res.status(500).json({ message: 'Ocorreu um erro. Por favor tente novamente mais tarde.', error: false, data: error })
            }
        }
    },

    registerSeller: async (req, res) => {
        const userId = req.userId
        const { name, email, phone, cpf } = req.body

        if (!name || !email || !phone || !cpf) {
            return res.status(400).json({ message: 'Preencha todos os campos!', error: true, data: null })
        }

        try {

            let company = await User.findUnique({
                where: { id: parseInt(userId) },
                select: { name: true }
            })

            let seller = await Seller.create({
                data: { name, email, phone, cpf, mainCompany: company.name, userId: parseInt(userId) }
            })
            return res.status(201).json({ message: 'Cadastro feito com sucesso!', error: false, data: seller })
        } catch (err) {
            console.log(err)
            return res.status(500).json({ message: 'Ocorreu um erro. Por favor tente novamente mais tarde.', error: true, data: null })
        }

    },

    checkSellerSchedule: async (req, res) => {
        const { date1 } = req.params

        let timeSchedules = [];

        try {

            const date = await SellerSchedule.findMany({
                where: {
                    date: date1
                },
                select: { time: true, day: true, date: true, id: true }
            })

            // Pega os agendamentos exporadicos que caem na data escolhida pelo usuário.
            for (let i = 0; i < date.length; i++) {
                let timeDate = date[i].time
                timeSchedules.push(timeDate)
            }

            // Definindo padrão de horários para receber no front.
            let standardTime = []
            for (let i = 0; i < timeSchedules.length; i++) {
                standardTime[i] = timeSchedules[i].slice(0, 5)
            }

            return res.status(200).json({ error: false, message: "Dados buscados com sucesso!", data: standardTime })

        } catch (err) {
            return res.status(500).json({ message: "Erro, por favor tente novamente mais tarde!", error: true, data: null })
        }
    },

    UpdateSeller: async (req, res) => {
        const { email, phone, id } = req.body

        if (!email || !phone) {
            return res.status(400).json({ message: 'Preencha todos os campos!', error: true, data: null })
        }
        try {
            await Seller.update({
                where: { id: parseInt(id) },
                data: { email, phone }
            })
            return res.status(200).json({ message: 'Dados atualizados com sucesso!', error: false, data: null })
        } catch (err) {
            return res.status(500).json({ message: 'Ocorreu um erro. Por favor tente novamente mais tarde.', error: true, data: null })
        }
    },

    deleteSeller: async (req, res) => {
        const { id } = req.params
        try {
            await Seller.delete({
                where: { id: parseInt(id) }
            })
            return res.status(200).json({ message: 'Vendedor descadastrado com sucesso!.', error: false, data: null })
        } catch (err) {
            return res.status(500).json({ message: 'Ocorreu um erro. Por favor tente novamente mais tarde.', error: true, data: null })
        }
    },

    getAllSellers: async (req, res) => {
        const { userId: id } = req.params
        const userId = req.userId

        if (id != userId) {
            return res.status(403).json({ message: 'Ação não autorizada!.', error: true, data: null })
        }
        try {
            const sellers = await Seller.findMany({
                where: { userId: parseInt(userId) },
                select: { name: true, email: true, cpf: true, phone: true, id: true }
            })
            return res.status(200).json({ message: 'Dados buscados com sucesso!', error: false, data: sellers })

        } catch (err) {
            console.log(err)
            return res.status(500).json({ message: 'Ocorreu um erro. Por favor tente novamente mais tarde.', error: true, data: null })
        }
    },

    newSellerSchedule: async (req, res) => {
        const { date, time, day, sellerId } = req.body

        if (!date || !time || !day || !sellerId) {
            return res.status(400).json({ message: 'Preencha todos os campos', error: true, data: null })
        }

        try {
            await SellerSchedule.create({
                data: { date, day, time, sellerId: parseInt(sellerId) }
            })
            return res.status(201).json({ error: false, message: "Horário agendado com sucesso!", data: null })
        } catch (err) {
            if (err.code == 'P2002') {
                return res.status(403).json({ message: 'Já existe um horário agendado com este(a) vendedor(a)', error: true, data: null })
            }
            return res.status(500).json({ message: 'Ocorreu um erro. Por favor tente novamente mais tarde.', error: true, data: null })
        }
    },

    getAllSellerSchedules: async (req, res) => {
        const { userId } = req.params

        try {
            let sellerSchedules = await Seller.findMany({
                where: { userId: parseInt(userId) },
                select: { name: true, sellerSchedule: { select: { date: true, day: true, time: true, id: true } } }
            })
            return res.status(200).json({ error: false, message: "Dados buscados com sucesso!", data: sellerSchedules })
        } catch (err) {
            return res.status(500).json({ message: 'Ocorreu um erro. Por favor tente novamente mais tarde.', error: true, data: null })
        }
    },

    deleteSellerSchedule: async (req, res) => {
        const { id } = req.params
        try {
            await SellerSchedule.delete({
                where: { id: parseInt(id) }
            })
            return res.status(200).json({ error: false, message: "Agendamento excluido com sucesso!", data: null })
        } catch (err) {
            return res.status(500).json({ message: 'Ocorreu um erro. Por favor tente novamente mais tarde.', error: true, data: null })
        }
    },

    howManySellers: async (req, res) => {
        const { userId } = req.params
        try {
            const count = await Seller.count({
                where: { userId: parseInt(userId) }
            })
            return res.status(200).json({ error: false, message: "Dados buscados com sucesso!", data: count })
        } catch (err) {
            return res.status(500).json({ message: 'Ocorreu um erro. Por favor tente novamente mais tarde.', error: true, data: null })
        }
    }
}