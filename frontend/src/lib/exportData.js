function escapeCsv(val) {
  const s = String(val ?? '')
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportTasksCSV(tasks) {
  const headers = ['Title', 'Status', 'Priority', 'Due Date', 'Estimate (min)', 'Tags', 'Subtasks Done', 'Created']
  const rows = tasks.map((t) => {
    const subs = t.subtasks ?? []
    const subsDone = subs.filter((s) => s.done).length
    return [
      escapeCsv(t.title),
      escapeCsv(t.status),
      escapeCsv(t.priority),
      escapeCsv(t.dueDate ?? ''),
      escapeCsv(t.estimateMin ?? ''),
      escapeCsv((t.tags ?? []).join('; ')),
      escapeCsv(`${subsDone}/${subs.length}`),
      escapeCsv(t.createdAt ? new Date(t.createdAt).toISOString() : ''),
    ].join(',')
  })
  const csv = [headers.join(','), ...rows].join('\n')
  downloadBlob(`tasks-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8')
}

export function exportAnalyticsCSV({ tasks, habits, sessions }) {
  const lines = [
    'Section,Metric,Value',
    `Tasks,Total,${tasks.length}`,
    `Tasks,Done,${tasks.filter((t) => t.status === 'done').length}`,
    `Habits,Total,${habits.length}`,
    `Sessions,Focus count,${sessions.filter((s) => s.type === 'focus').length}`,
    `Sessions,Total focus min,${Math.round(sessions.filter((s) => s.type === 'focus').reduce((a, s) => a + (s.durationSec ?? 0), 0) / 60)}`,
  ]
  downloadBlob(`analytics-${new Date().toISOString().slice(0, 10)}.csv`, lines.join('\n'), 'text/csv;charset=utf-8')
}

export function exportTasksPDF(tasks) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Tasks Export</title>
<style>body{font-family:system-ui,sans-serif;padding:24px}h1{color:#333}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}</style></head><body>
<h1>Smart Task Manager — Tasks</h1>
<p>Exported ${new Date().toLocaleString()}</p>
<table><thead><tr><th>Title</th><th>Status</th><th>Priority</th><th>Due</th><th>Tags</th></tr></thead><tbody>
${tasks.map((t) => `<tr><td>${escapeHtml(t.title)}</td><td>${t.status}</td><td>${t.priority}</td><td>${t.dueDate ?? '—'}</td><td>${(t.tags ?? []).join(', ') || '—'}</td></tr>`).join('')}
</tbody></table></body></html>`
  const w = window.open('', '_blank')
  if (w) {
    w.document.write(html)
    w.document.close()
    w.print()
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
