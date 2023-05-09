const express = require('express')
const { register,
    verifyCode,
    checkCnpj,
    reSendAuthCode,
    /*reportError,*/
    registerSeller,
    updatePassword,
    getUserByEmail,
    getAllSellerSchedules,
    confirmAccount,
    recoverPasswordEmail,
    login,
    changePassword,
    UpdateSeller,
    getAllSellers,
    getUser,
    newSellerSchedule,
    deleteFixedSchedule,
    deleteUser,
    deleteSeller,
    newSchedule,
    newFixedSchedule,
    getSchedules,
    getSchedule,
    checkFixedSchedule,
    checkSellerSchedule,
    howManySellers,
    deleteSellerSchedule,
    changeData,
    /*updateSchedule, updateFixedSchedule,*/
    updateUser,
    deleteSchedule,
    checkSchedule } = require('../controllers/client.js')
const { clientToken } = require('../middlewares/auth.js')
const { changePassAuth } = require('../middlewares/changePassAuth.js')
const router = express.Router()

// Authentication
router.post('/register', register)
router.post('/login', login)
router.get('/verify-code/:id/:code', verifyCode)
router.patch('/re-send-auth-code', reSendAuthCode)
router.patch('/confirmAccount', confirmAccount)
router.get('/check-cnpj/:cnpj', checkCnpj)

router.patch('/chenge-data', changeData)

// Geral
router.patch('/change-password', clientToken, changePassword)
router.get('/get-user/:id', clientToken, getUser)
router.get('/get-user-by-email/:email', getUserByEmail)
router.patch('/update-user', clientToken, updateUser)
router.patch('/update-password', changePassAuth, updatePassword)
router.delete('/delete-user/:id', clientToken, deleteUser)
// router.post('/report-error', clientToken, reportError)

// Sales
router.post('/register-seller', clientToken, registerSeller)
router.post('/new-seller-schedule', clientToken, newSellerSchedule)
router.patch('/update-seller', clientToken, UpdateSeller)
router.delete('/delete-seller/:id', clientToken, deleteSeller)
router.get('/get-all-sellers/:userId', clientToken, getAllSellers)
router.get('/check-seller-schedule/:date1', clientToken, checkSellerSchedule)
router.get('/get-all-seller-schedules/:userId', clientToken, getAllSellerSchedules)
router.delete(`/delete-seller-schedule/:id`, clientToken, deleteSellerSchedule)
router.get(`/how-many-sellers/:userId`, clientToken, howManySellers)

// Logistic
router.post('/new-schedule', clientToken, newSchedule)
router.post('/new-fixed-schedule', clientToken, newFixedSchedule)
router.get('/schedules/:id', clientToken, getSchedules)
router.get('/get-schedule/:id', clientToken, getSchedule)
router.get('/check-fixed-schedule/:date1/:date2/:date3/:day', clientToken, checkFixedSchedule)
router.get('/check-schedule/:date1/:day', clientToken, checkSchedule)
router.patch('/recover-password-email/:id/:email', recoverPasswordEmail)
// router.put('/update-schedule', clientToken, updateSchedule)
// router.put('/update-fixed-schedule', clientToken, updateFixedSchedule)
router.delete('/delete-schedule/:id', clientToken, deleteSchedule)
router.delete('/delete-fixed-schedule/:id', clientToken, deleteFixedSchedule)

module.exports = router