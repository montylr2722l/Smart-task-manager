import { isoDate } from './dateUtils'
import { lastNDaysISO } from './analytics'

export const DEFAULT_WEEKLY_GOALS = {
  tasksTarget: 5,
  habitsTarget: 7,
  focusMinutesTarget: 300,
}

export function getWeekStartISO(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return isoDate(d)
}

export function computeWeeklyProgress(tasks, habits, sessions, goals = DEFAULT_WEEKLY_GOALS) {
  const weekDays = lastNDaysISO(7, new Date())
  const weekSet = new Set(weekDays)

  const tasksDone = tasks.filter(
    (t) => t.doneAt && weekSet.has(isoDate(new Date(t.doneAt))),
  ).length

  const habitCompletions = habits.reduce((sum, h) => {
    return sum + (h.completedDates ?? []).filter((d) => weekSet.has(d)).length
  }, 0)

  const focusMinutes = sessions
    .filter((s) => s.type === 'focus' && weekSet.has(isoDate(new Date(s.startedAt))))
    .reduce((a, s) => a + (s.durationSec ?? 0) / 60, 0)

  const tasksMet = tasksDone >= goals.tasksTarget
  const habitsMet = habitCompletions >= goals.habitsTarget
  const focusMet = focusMinutes >= goals.focusMinutesTarget
  const allMet = tasksMet && habitsMet && focusMet

  return {
    weekDays,
    tasksDone,
    habitCompletions,
    focusMinutes: Math.round(focusMinutes),
    tasksMet,
    habitsMet,
    focusMet,
    allMet,
    goals,
  }
}
