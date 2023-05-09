require('dotenv').config()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const Schedule = prisma['schedule']
const Seller = prisma['seller']
const User = prisma['user']
const Admin = prisma['admin']

module.exports = {

    register: async (req, res) => {
        let { name, password } = req.body
        if (!name || !password) {
            res.status(401).json({ error: "Preencha todos os campos!", success: false })
            return
        }


        const returndName = await Admin.findFirst({ where: { name: name }, select: { name: true } })
        if (returndName && returndName.name === name) {
            return res.status(401).json({ error: "Usuário já cadastrado!", success: false })
        }

        const hashPassword = await bcrypt.hash(password, 8)

        try {
            const admin = await Admin.create({
                data: {
                    name,
                    password: hashPassword
                }
            })

            const { id } = admin

            res.status(201).json({ error: false, success: "Cadastro feito com sucesso!", data: null })

        } catch (error) {
            res.status(500).json({ error: "Erro ao cadastrar usuário!", success: false, err: error })
        }
    },

    login: async (req, res) => {
        const { name, password } = req.body

        if (!name || !password) {
            return res.status(400).json({ message: "Preencha todos os campos!", error: true, data: null })
        }

        const admin = await Admin.findFirst({
            where: { name },
            select: { id: true, password: true }
        })

        if (admin) {
            var clearPassword = await bcrypt.compare(password, admin.password)
        } else {
            return res.status(401).json({ message: "Credencial(is) incorreta(s)!", error: true, data: null })
        }

        if (clearPassword) {

            try {

                let adminToken = await jwt.sign({ userId: admin.id, admin: true }, process.env.JWT_SECRET_ADM, {
                    expiresIn: 36000
                })

                return res.status(200).json({ message: "Sucesso ao fazer login!", error: false, data: adminToken })
            } catch (err) {
                return res.status(500).json({ message: "Erro ao buscar os dados!", error: true, data: null })
            }

        } else {
            return res.status(401).json({ message: "Credencial(is) incorreta(s)!", error: true, data: null })
        }
    },

    allSchedules: async (req, res) => {

        if (req.admin == false) {
            return res.status(401).json({ message: "Não autorizado!", error: true, data: null })
        }

        try {

            const allSchedules = await User.findMany({
                select: {
                    id: true, name: true, schedule: {
                        select: { date: true, time: true, day: true, id: true, userId: true }
                    }, fixedSchedule: {
                        select: { day: true, time: true, currentDelivery: true, frequency: true, id: true, userId: true }
                    }
                }
            })

            return res.status(200).json({ message: "Dados buscados com sucesso!", error: false, data: allSchedules })
        } catch (err) {
            console.log(err)
            return res.status(500).json({ message: "Erro ao buscar os dados!", error: true, data: null })
        }
    },

    selectScheduleAndUser: async (req, res) => {

        if (req.admin == false) {
            return res.status(401).json({ message: "Não autorizado!", error: true, data: null })
        }
        const { id } = req.params

        try {
            const schedule = await User.findFirst({
                where: { id: parseInt(id) },
                select: {
                    name: true, cnpj: true, phone: true, email: true, social: true,
                    schedule: {
                        select: { date: true, day: true, time: true, boxQnt: true, loadValue: true, id: true }
                    }, fixedSchedule: {
                        select: { day: true, time: true, frequency: true, id: true, currentDelivery: true, nextDelivery: true, nextNextDelivery: true }
                    }
                },
            })

            return res.status(200).json({ error: false, message: "Agendamento selecionado!", data: schedule })
        } catch (err) {
            console.log(err)
            return res.status(500).json({ message: "Erro ao buscar os dados!", error: true, data: null })
        }
    },

    allUsers: async (req, res) => {

        if (req.admin == false) {
            return res.status(401).json({ message: "Não autorizado!", error: true, data: null })
        }
        try {
            const users = await User.findMany({
                where: { confirmedAccount: true },
                select: { name: true, social: true, cnpj: true, email: true, phone: true, createdAt: true, id: true}
            })
            return res.status(200).json({ message: "Dados buscados com sucesso!", error: false, data: users })
        } catch (err) {
            return res.status(500).json({ message: "Ocorreu um erro, por favor tente novamente mais tarde!", error: true, data: null })
        }
    },

    getAllSellerSchedules: async (req, res) => {
        if (req.admin == false) {
            return res.status(401).json({ message: "Não autorizado!", error: true, data: null })
        }

        try {
            const sellers = await Seller.findMany({
                select: { name: true, mainCompany: true, sellerSchedule: { select: { date: true, day: true, time: true } } }
            })

            return res.status(200).json({ message: "Dados buscados com sucesso!", error: false, data: sellers })
        } catch (err) {
            return res.status(500).json({ message: "Ocorreu um erro, por favor tente novamente mais tarde!", error: true, data: null })
        }
    },

    getAllSellers: async (req, res) => {
        if (req.admin == false) {
            return res.status(401).json({ message: "Não autorizado!", error: true, data: null })
        }

        try {

            const users = await Seller.findMany({
                select: { name: true, cpf: true, email: true, phone: true, mainCompany: true, id: true }
            })

            return res.status(200).json({ message: "Dados buscados com sucesso!", error: false, data: users })
        } catch (err) {
            return res.status(500).json({ message: "Ocorreu um erro, por favor tente novamente mais tarde!", error: true, data: null })
        }


    },

    deleteUser: async (req, res) => {
        if (req.admin == false) {
            return res.status(401).json({ message: "Não autorizado!", error: true, data: null })
        }
        const { id } = req.params

        try {
            await User.delete({
                where: { id: parseInt(id) }
            })
            res.status(200).json({ message: "Empresa deletada!", error: false, data: null })
        } catch (err) {
            res.status(500).json({ message: "Erro ao deletar!", error: true, data: null })
        }
    },

    deleteSeller: async (req, res) => {
        if (req.admin == false) {
            return res.status(401).json({ message: "Não autorizado!", error: true, data: null })
        }
        const { id } = req.params

        try {
            await Seller.delete({
                where: { id: parseInt(id) }
            })
            res.status(200).json({ message: "Vendedor(a) deletado(a)!", error: false, data: null })
        } catch (err) {
            res.status(500).json({ message: "Erro ao deletar!", error: true, data: null })
        }
    },

}