const crypto = require('crypto')
const SharedList = require('../models/SharedList')

function generateCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase()
}

async function createSharedList(req, res) {
  try {
    const { name } = req.body
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'List name is required.' })
    }

    let code = generateCode()
    for (let i = 0; i < 5; i++) {
      const exists = await SharedList.findOne({ code })
      if (!exists) break
      code = generateCode()
    }

    const list = await SharedList.create({
      code,
      name: name.trim(),
      ownerId: req.user.id,
      ownerName: req.user.name,
      members: [{ userId: req.user.id, name: req.user.name }],
      tasks: [],
    })

    return res.status(201).json({ success: true, list })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

async function joinSharedList(req, res) {
  try {
    const code = String(req.body.code || '').trim().toUpperCase()
    if (!code) {
      return res.status(400).json({ success: false, message: 'Share code is required.' })
    }

    const list = await SharedList.findOne({ code })
    if (!list) {
      return res.status(404).json({ success: false, message: 'List not found.' })
    }

    const already = list.members.some((m) => m.userId.toString() === req.user.id)
    if (!already) {
      list.members.push({ userId: req.user.id, name: req.user.name })
      await list.save()
    }

    return res.status(200).json({ success: true, list })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

async function getMySharedLists(req, res) {
  try {
    const lists = await SharedList.find({ 'members.userId': req.user.id }).sort({ updatedAt: -1 })
    return res.status(200).json({ success: true, lists })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

async function updateSharedListTasks(req, res) {
  try {
    const { code } = req.params
    const { tasks } = req.body
    const list = await SharedList.findOne({ code: code.toUpperCase() })
    if (!list) {
      return res.status(404).json({ success: false, message: 'List not found.' })
    }

    const isMember = list.members.some((m) => m.userId.toString() === req.user.id)
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not a member of this list.' })
    }

    list.tasks = tasks ?? []
    await list.save()
    return res.status(200).json({ success: true, list })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = {
  createSharedList,
  joinSharedList,
  getMySharedLists,
  updateSharedListTasks,
}
