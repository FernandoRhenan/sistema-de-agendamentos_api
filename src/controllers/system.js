const dateForecast = require('../func/dateForecast')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const Schedule = prisma['schedule']
const FixedSchedule = prisma['fixedSchedule']

function convertToString(num) {
    const strNum = num.toString()
    if (strNum.length == 1) {
        return `0${strNum}`
    } else {
        return strNum
    }
}

module.exports = {

    automaticUpdate: async (req, res) => {

        const date = new Date()
        let convertedDate = convertToString(date.getDate()) + "-" + convertToString(date.getMonth() + 1) + "-" + convertToString(date.getFullYear())

        const { formatedDate2: nextDateForecast } = dateForecast(convertedDate)

        const { formatedDate1, formatedDate2, formatedDate3 } = dateForecast(nextDateForecast)

        await FixedSchedule.findMany({
            where: { currentDelivery: convertedDate },
            select: { id: true }
        }).then((data) => {
            data.forEach(async (item) => {
                await FixedSchedule.update({
                    where: {
                        id: parseInt(item.id)
                    },
                    data: {
                        currentDelivery: formatedDate1,
                        nextDelivery: formatedDate2,
                        nextNextDelivery: formatedDate3
                    }
                })
            })
            return res.status(200).json({ message: "Ok!", data: null, error: false })
        }).catch((err) => {
            return res.status(500).json({ message: "Error!", data: err, error: false })

        })
    },

    automaticDelete: async (req, res) => {
        const date = new Date()
        let convertedDate = convertToString(date.getDate()) + "-" + convertToString(date.getMonth() + 1) + "-" + convertToString(date.getFullYear())

        await Schedule.findMany({
            where: { date: convertedDate },
            select: { id: true }
        }).then((data) => {
            data.forEach(async (item) => {
                await Schedule.delete({
                    where: { id: parseInt(item.id) }
                })
            })
            return res.status(200).json({ message: "Ok!", data: null, error: false })
        }).catch((err) => {
            console.log(err)
            return res.status(500).json({ message: "Error!", data: null, error: false })
        })


    }
}