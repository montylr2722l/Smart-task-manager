const UserData = require('../models/UserData')

async function getUserData(req, res) {
  try {
    let doc = await UserData.findOne({ userId: req.user.id })
    if (!doc) {
      doc = await UserData.create({ userId: req.user.id })
    }
    return res.status(200).json({
      success: true,
      data: {
        tasks: doc.tasks,
        habits: doc.habits,
        sessions: doc.sessions,
        pomodoro: doc.pomodoro,
        smartSortEnabled: doc.smartSortEnabled,
        settings: doc.settings,
        updatedAt: doc.updatedAt,
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

async function syncUserData(req, res) {
  try {
    const { tasks, habits, sessions, pomodoro, smartSortEnabled, settings } = req.body
    const doc = await UserData.findOneAndUpdate(
      { userId: req.user.id },
      {
        ...(tasks !== undefined && { tasks }),
        ...(habits !== undefined && { habits }),
        ...(sessions !== undefined && { sessions }),
        ...(pomodoro !== undefined && { pomodoro }),
        ...(smartSortEnabled !== undefined && { smartSortEnabled }),
        ...(settings !== undefined && { settings }),
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    )
    return res.status(200).json({
      success: true,
      message: 'Data synced.',
      updatedAt: doc.updatedAt,
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = { getUserData, syncUserData }
