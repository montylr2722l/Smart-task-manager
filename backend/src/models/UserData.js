const mongoose = require('mongoose')

const userDataSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    tasks: { type: Array, default: [] },
    habits: { type: Array, default: [] },
    sessions: { type: Array, default: [] },
    pomodoro: { type: Object, default: {} },
    smartSortEnabled: { type: Boolean, default: true },
    settings: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      notificationsEnabled: { type: Boolean, default: false },
      reminderHour: { type: Number, default: 9 },
      weeklyGoals: {
        tasksTarget: { type: Number, default: 5 },
        habitsTarget: { type: Number, default: 7 },
        focusMinutesTarget: { type: Number, default: 300 },
      },
      googleCalendarEnabled: { type: Boolean, default: false },
      unlockedAchievements: { type: [String], default: [] },
    },
  },
  { timestamps: true },
)

module.exports = mongoose.model('UserData', userDataSchema)
