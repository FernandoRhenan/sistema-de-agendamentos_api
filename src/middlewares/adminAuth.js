require('dotenv').config()
const jwt = require('jsonwebtoken')

module.exports = {
    adminToken: async (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Página restrita.", error: true, data: null
            })
        }

        let [bearer, token] = authHeader.split(" ")

        if (!token) {
            return res.status(401).json({
                message: "Página restrita.", error: true, data: null
            })
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_ADM)
            req.userId = decoded.userId
            return next()
        } catch (err) {
            return res.status(500).json({
                message: "Erro. Por favor, tente novamente mais tarde.", error: true, data: null
            })
        }

    }
}