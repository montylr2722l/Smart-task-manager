import { isoDate } from './dateUtils'

export const ACHIEVEMENTS = [
  { id: 'first_task', title: 'First Step', desc: 'Complete your first task', icon: '✅' },
  { id: 'tasks_10', title: 'Task Crusher', desc: 'Complete 10 tasks', icon: '🔥' },
  { id: 'tasks_50', title: 'Productivity Pro', desc: 'Complete 50 tasks', icon: '⭐' },
  { id: 'habit_streak_3', title: 'Habit Starter', desc: '3-day habit streak', icon: '🌱' },
  { id: 'habit_streak_7', title: 'Week Warrior', desc: '7-day habit streak', icon: '💪' },
  { id: 'habit_streak_30', title: 'Habit Master', desc: '30-day habit streak', icon: '🏆' },
  { id: 'focus_60', title: 'Focus Hour', desc: '60+ focus minutes in a day', icon: '⏱️' },
  { id: 'focus_300_week', title: 'Deep Work', desc: '300+ focus minutes this week', icon: '🧠' },
  { id: 'pomodoro_4', title: 'Pomodoro Fan', desc: '4 focus sessions in one day', icon: '🍅' },
  { id: 'goals_week', title: 'Goal Getter', desc: 'Hit all weekly goals', icon: '🎯' },
]

export function computeUnlockedAchievements({ tasks, habits, sessions, todayISO, weeklyProgress }) {
  const unlocked = new Set()
  const doneCount = tasks.filter((t) => t.status === 'done').length

  if (doneCount >= 1) unlocked.add('first_task')
  if (doneCount >= 10) unlocked.add('tasks_10')
  if (doneCount >= 50) unlocked.add('tasks_50')

  let maxStreak = 0
  for (const h of habits) {
    const dates = [...(h.completedDates ?? [])].sort()
    let streak = 0
    let cursor = todayISO
    const set = new Set(dates)
    while (set.has(cursor)) {
      streak++
      const prev = new Date(`${cursor}T00:00:00`)
      prev.setDate(prev.getDate() - 1)
      cursor = isoDate(prev)
    }
    maxStreak = Math.max(maxStreak, streak)
  }
  if (maxStreak >= 3) unlocked.add('habit_streak_3')
  if (maxStreak >= 7) unlocked.add('habit_streak_7')
  if (maxStreak >= 30) unlocked.add('habit_streak_30')

  const focusToday = sessions
    .filter((s) => s.type === 'focus' && isoDate(new Date(s.startedAt)) === todayISO)
    .reduce((a, s) => a + (s.durationSec ?? 0) / 60, 0)
  if (focusToday >= 60) unlocked.add('focus_60')

  const sessionsToday = sessions.filter(
    (s) => s.type === 'focus' && isoDate(new Date(s.startedAt)) === todayISO,
  ).length
  if (sessionsToday >= 4) unlocked.add('pomodoro_4')

  if (weeklyProgress?.allMet) unlocked.add('goals_week')

  const weekFocus = sessions
    .filter((s) => s.type === 'focus')
    .slice(0, 200)
    .reduce((a, s) => a + (s.durationSec ?? 0) / 60, 0)
  if (weekFocus >= 300) unlocked.add('focus_300_week')

  return [...unlocked]
}
