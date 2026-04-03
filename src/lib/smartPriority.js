import { daysBetween } from './dateUtils'

const PRIORITY_WEIGHT = {
  low: 10,
  medium: 22,
  high: 35,
}

export function computeTaskSmartScore(task, { todayISO, focusMinutesByTaskId = {} }) {
  const prio = PRIORITY_WEIGHT[task.priority] ?? 0

  let dueUrgency = 0
  if (task.dueDate) {
    const diffDays = daysBetween(todayISO, task.dueDate)
    // If dueDate is today diffDays=0, future positive, past negative.
    if (diffDays < 0) dueUrgency = 120
    else dueUrgency = Math.max(0, 90 - diffDays * 3)
  } else {
    dueUrgency = 20
  }

  const estimateMin = task.estimateMin ?? 0
  const estimateBoost = estimateMin ? Math.min(60, estimateMin * 0.7) : 0

  const focused = focusMinutesByTaskId[task.id] ?? 0
  const remainingWork = Math.max(0, estimateMin - focused)
  const remainingBoost = remainingWork ? Math.min(70, remainingWork * 0.9) : 0

  // Light preference for tasks with due dates closer and with more remaining work.
  // The scoring is intentionally simple to keep the UI explainable.
  return dueUrgency + prio + estimateBoost + remainingBoost
}

export function sortTasksSmart(tasks, opts) {
  return [...tasks].sort((a, b) => {
    const sa = computeTaskSmartScore(a, opts)
    const sb = computeTaskSmartScore(b, opts)
    return sb - sa
  })
}

