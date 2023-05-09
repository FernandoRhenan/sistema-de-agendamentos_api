const express = require('express')
const router = express.Router()
const { automaticUpdate, automaticDelete } = require('../controllers/system')

router.get('/automatic-delete', automaticDelete)
router.get('/automatic-update', automaticUpdate)

module.exports = router
