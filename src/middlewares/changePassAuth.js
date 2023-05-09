require('dotenv').config()
const jwt = require('jsonwebtoken')

module.exports = {
    changePassAuth: async (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "Página restrita.", error: true, data: null })
        }

        let [bearer, token] = authHeader.split(' ')

        if (!token) {
            return res.status(401).json({ message: "Página restrita.", error: true, data: null })
        }

        try {
            const decoded = await jwt.verify(token, process.env.JWT_SECRET_REC_PASS)
            req.id = decoded.id
            return next()
        } catch (err) {
            return res.status(401).json({ message: "Página restrita.", error: true, data: null })
        }

    }
}