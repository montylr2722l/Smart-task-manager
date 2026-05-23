const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const { getUserData, syncUserData } = require('../controllers/dataController')

const router = express.Router()

router.get('/', authMiddleware, getUserData)
router.put('/', authMiddleware, syncUserData)

module.exports = router
