const mongoose = require('mongoose')

async function connectDB() {
  const mongoUri = process.env.MONGODB_URI
  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing in environment variables.')
  }

  const conn = await mongoose.connect(mongoUri)
  // Keep this log concise; useful to verify Atlas connection.
  console.log(`MongoDB connected: ${conn.connection.host}`)
}

module.exports = connectDB

