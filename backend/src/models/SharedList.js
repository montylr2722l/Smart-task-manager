const mongoose = require('mongoose')

const sharedListSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerName: { type: String, required: true },
    members: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    tasks: { type: Array, default: [] },
  },
  { timestamps: true },
)

module.exports = mongoose.model('SharedList', sharedListSchema)
