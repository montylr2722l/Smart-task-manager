import { isoDate, daysBetween } from './dateUtils'

export function lastNDaysISO(n, endDate = new Date()) {
  const end = new Date(endDate)
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    out.push(isoDate(d))
  }
  return out
}

export function computeFocusMinutesByDay(sessions, days) {
  const map = Object.fromEntries(days.map((d) => [d, 0]))
  for (const s of sessions) {
    if (s.type !== 'focus') continue
    const day = isoDate(new Date(s.startedAt))
    if (day in map) map[day] += (s.durationSec ?? 0) / 60
  }
  return map
}

export function computeTaskCompletionsByDay(tasks, days) {
  const map = Object.fromEntries(days.map((d) => [d, 0]))
  for (const t of tasks) {
    if (!t.doneAt) continue
    const day = isoDate(new Date(t.doneAt))
    if (day in map) map[day] += 1
  }
  return map
}

export function computeHabitCompletionsByDay(habits, days) {
  const map = Object.fromEntries(days.map((d) => [d, 0]))
  for (const h of habits) {
    for (const cd of h.completedDates ?? []) {
      if (cd in map) map[cd] += 1
    }
  }
  return map
}

export function computeProductivityScore({ tasksDone7d, habitCompletions7d, focusMinutes7d }) {
  // Normalize each signal into 0..100-ish and blend.
  const tasksScore = Math.min(100, tasksDone7d * 14)
  const habitsScore = Math.min(100, habitCompletions7d * 6)
  const focusScore = Math.min(100, focusMinutes7d * 1.1)
  return Math.round(tasksScore * 0.42 + habitsScore * 0.28 + focusScore * 0.3)
}

export function computeTaskPriorityDistribution(tasks) {
  const dist = { low: 0, medium: 0, high: 0 }
  for (const t of tasks) {
    if (t.status === 'done') continue
    dist[t.priority] = (dist[t.priority] ?? 0) + 1
  }
  return dist
}

export function computeStreakSummary(habits, todayISO) {
  const summaries = habits.map((h) => {
    const dates = [...(h.completedDates ?? [])]
    if (h.frequency === 'weekly') {
      // Convert to week starts and compute consecutive weeks.
      const weekStarts = dates
        .map((d) => new Date(`${d}T00:00:00`))
        .map((dt) => {
          // Monday week start
          const day = dt.getDay()
          const diffToMonday = (day === 0 ? -6 : 1) - day
          dt.setDate(dt.getDate() + diffToMonday)
          return isoDate(dt)
        })
      const set = new Set(weekStarts)
      let best = 0
      let current = 0
      // Best streak by scanning backwards from earliest completion.
      if (weekStarts.length) {
        const unique = [...set].sort()
        for (let i = 0; i < unique.length; i++) {
          let len = 1
          for (let j = i + 1; j < unique.length; j++) {
            const diff = daysBetween(unique[i], unique[j])
            if (diff === 7) len++
            else break
          }
          best = Math.max(best, len)
        }
      }
      // Current streak ending at this week start.
      const today = new Date(`${todayISO}T00:00:00`)
      const day = today.getDay()
      const diffToMonday = (day === 0 ? -6 : 1) - day
      today.setDate(today.getDate() + diffToMonday)
      const todayWeek = isoDate(today)
      let cursor = todayWeek
      while (set.has(cursor)) {
        current++
        const prev = new Date(`${cursor}T00:00:00`)
        prev.setDate(prev.getDate() - 7)
        cursor = isoDate(prev)
      }
      return { habitId: h.id, currentStreak: current, bestStreak: best }
    }

    // Daily streak.
    const set = new Set(dates)
    let current = 0
    let cursor = todayISO
    while (set.has(cursor)) {
      current++
      const prev = new Date(`${cursor}T00:00:00`)
      prev.setDate(prev.getDate() - 1)
      cursor = isoDate(prev)
    }

    // Best streak.
    let best = 0
    const unique = [...set].sort()
    for (let i = 0; i < unique.length; i++) {
      let len = 1
      for (let j = i + 1; j < unique.length; j++) {
        const diff = daysBetween(unique[i], unique[j])
        if (diff === 1) len++
        else break
      }
      best = Math.max(best, len)
    }

    return { habitId: h.id, currentStreak: current, bestStreak: best }
  })

  return summaries
}

