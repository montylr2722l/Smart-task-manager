const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const {
  createSharedList,
  joinSharedList,
  getMySharedLists,
  updateSharedListTasks,
} = require('../controllers/sharedController')

const router = express.Router()

router.get('/', authMiddleware, getMySharedLists)
router.post('/', authMiddleware, createSharedList)
router.post('/join', authMiddleware, joinSharedList)
router.put('/:code/tasks', authMiddleware, updateSharedListTasks)

module.exports = router
