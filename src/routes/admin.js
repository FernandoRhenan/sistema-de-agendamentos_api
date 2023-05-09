const express = require('express')
const { login, allSchedules, selectScheduleAndUser, deleteUser, deleteSeller, getAllSellers, getAllSellerSchedules, register, allUsers } = require('../controllers/admin.js')
const { adminToken } = require('../middlewares/adminAuth')
const router = express.Router()

router.post('/apr-register', register)
router.post('/apr-login', login)
router.get('/apr-all-schedules', adminToken, allSchedules)
router.get('/apr-all-users', adminToken, allUsers)
router.get('/apr-select-user-schedule/:id', adminToken, selectScheduleAndUser)
router.get('/apr-get-all-seller-schedules', adminToken, getAllSellerSchedules)
router.get('/apr-all-sellers', adminToken, getAllSellers)
router.delete('/apr-delete-user/:id', adminToken, deleteUser)
router.delete('/apr-delete-seller/:id', adminToken, deleteSeller)

module.exports = router