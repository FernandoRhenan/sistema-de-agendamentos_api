const express = require('express')
const app = express()

const cors = require('cors')

require('dotenv').config()

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(cors())

const routerClient = require('./routes/client')
app.use('/client', routerClient)

const routerAdmin = require('./routes/admin.js')
app.use('/admin', routerAdmin)

const routerSystem = require('./routes/system.js')
app.use('/system', routerSystem)


const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log('Rodando na porta ' + port)
})