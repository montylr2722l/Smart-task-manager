import { isoDate } from './dateUtils'

export function getMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startPad = (first.getDay() + 6) % 7
  const days = []

  for (let i = 0; i < startPad; i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(isoDate(new Date(year, month, d)))
  }
  while (days.length % 7 !== 0) days.push(null)
  return days
}

export function tasksByDate(tasks) {
  const map = {}
  for (const t of tasks) {
    if (!t.dueDate) continue
    if (!map[t.dueDate]) map[t.dueDate] = []
    map[t.dueDate].push(t)
  }
  return map
}

export function exportTasksICS(tasks) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Smart Task Manager//EN']
  for (const t of tasks) {
    if (!t.dueDate) continue
    const uid = t.id.replace(/[^a-zA-Z0-9]/g, '')
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}@smarttaskmanager`)
    lines.push(`DTSTART;VALUE=DATE:${t.dueDate.replace(/-/g, '')}`)
    lines.push(`SUMMARY:${(t.title || '').replace(/[,;\\]/g, '')}`)
    lines.push(`DESCRIPTION:Priority ${t.priority}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'tasks.ics'
  a.click()
  URL.revokeObjectURL(url)
}
