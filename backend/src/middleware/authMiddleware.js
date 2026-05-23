const jwt = require('jsonwebtoken')
const User = require('../models/User')

async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authentication required.' })
    }

    const token = header.slice(7)
    const secret = process.env.JWT_SECRET
    if (!secret) {
      return res.status(500).json({ success: false, message: 'JWT_SECRET is not configured.' })
    }

    const decoded = jwt.verify(token, secret)
    const user = await User.findById(decoded.id).select('name email')
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' })
    }

    req.user = { id: user._id.toString(), name: user.name, email: user.email }
    next()
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' })
  }
}

module.exports = authMiddleware
