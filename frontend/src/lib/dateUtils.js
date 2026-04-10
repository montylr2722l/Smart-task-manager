export function isoDate(d = new Date()) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function daysBetween(aISO, bISO) {
  const a = new Date(`${aISO}T00:00:00`)
  const b = new Date(`${bISO}T00:00:00`)
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

export function startOfWeekISO(date = new Date()) {
  // Monday as week start.
  const d = new Date(date)
  const day = d.getDay() // 0 (Sun) .. 6 (Sat)
  const diffToMonday = (day === 0 ? -6 : 1) - day
  d.setDate(d.getDate() + diffToMonday)
  return isoDate(d)
}

export function formatTimeShort(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins <= 0) return `${secs}s`
  return secs ? `${mins}m ${String(secs).padStart(2, '0')}s` : `${mins}m`
}

export function formatDurationMinutes(mins) {
  if (!Number.isFinite(mins)) return '-'
  if (mins < 60) return `${Math.round(mins)}m`
  const h = Math.floor(mins / 60)
  const m = Math.round(mins % 60)
  return m ? `${h}h ${m}m` : `${h}h`
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

