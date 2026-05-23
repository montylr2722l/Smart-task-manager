const LS_REMINDERS_KEY = 'stm_reminders_scheduled'

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  const result = await Notification.requestPermission()
  return result
}

export function showNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(title, { body, icon: '/icons.svg' })
  } catch {
    // mobile may block without service worker
  }
}

export function scheduleDailyReminder(hour = 9, { tasksDueToday = 0, habitsPending = 0 } = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const now = new Date()
  const next = new Date()
  next.setHours(hour, 0, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)

  const delay = next.getTime() - now.getTime()
  const key = `${hour}-${tasksDueToday}-${habitsPending}`

  try {
    const prev = sessionStorage.getItem(LS_REMINDERS_KEY)
    if (prev === key) return
    sessionStorage.setItem(LS_REMINDERS_KEY, key)
  } catch {
    // ignore
  }

  setTimeout(() => {
    const parts = []
    if (tasksDueToday > 0) parts.push(`${tasksDueToday} task(s) due today`)
    if (habitsPending > 0) parts.push(`${habitsPending} habit(s) pending`)
    showNotification(
      'Smart Task Manager',
      parts.length ? parts.join(' · ') : 'Check your goals for today!',
    )
  }, delay)
}

export function checkDueTaskReminders(tasks, todayISO) {
  const dueSoon = tasks.filter(
    (t) => t.status !== 'done' && t.dueDate && t.dueDate <= todayISO,
  )
  if (dueSoon.length > 0 && Notification.permission === 'granted') {
    showNotification(
      'Due tasks reminder',
      `You have ${dueSoon.length} task(s) due today or overdue.`,
    )
  }
}
