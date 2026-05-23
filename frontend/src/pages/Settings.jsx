import { useState } from 'react'
import { Moon, Sun, Monitor, Bell, Download, Cloud, Calendar, Mail } from 'lucide-react'
import { Card, Button, Field, SelectInput, Pill } from '../components/ui'
import { useTheme } from '../lib/ThemeContext'
import { requestNotificationPermission, scheduleDailyReminder } from '../lib/notifications'
import { exportTasksCSV, exportAnalyticsCSV, exportTasksPDF } from '../lib/exportData'
import { exportTasksICS } from '../lib/calendarUtils'

export default function SettingsPage({
  tasks,
  habits,
  sessions,
  syncStatus,
  onSyncNow,
  settings,
  onSettingsChange,
  todayISO,
}) {
  const { theme, setTheme } = useTheme()
  const [msg, setMsg] = useState('')

  const habitsPending = habits.filter((h) => !(h.completedDates ?? []).includes(todayISO)).length
  const tasksDueToday = tasks.filter((t) => t.status !== 'done' && t.dueDate === todayISO).length

  const enableNotifications = async () => {
    const perm = await requestNotificationPermission()
    if (perm === 'granted') {
      onSettingsChange({ ...settings, notificationsEnabled: true })
      scheduleDailyReminder(settings.reminderHour ?? 9, { tasksDueToday, habitsPending })
      setMsg('Notifications enabled!')
    } else {
      setMsg('Permission denied. Enable notifications in browser settings.')
    }
  }

  return (
    <div className="stm-stack">
      <div className="stm-page-head">
        <div>
          <div className="stm-page-title">Settings</div>
          <div className="stm-page-sub">Theme, sync, reminders, and exports.</div>
        </div>
      </div>

      {msg ? <Pill tone="info">{msg}</Pill> : null}

      <Card>
        <div className="stm-card-title stm-mb-12"><Monitor size={18} /> Theme</div>
        <div className="stm-flex stm-gap-8 stm-wrap">
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'system', label: 'System', icon: Monitor },
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={theme === id ? 'primary' : 'secondary'}
              size="md"
              onClick={() => { setTheme(id); onSettingsChange({ ...settings, theme: id }) }}
            >
              <Icon size={16} /> {label}
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="stm-card-title stm-mb-12"><Cloud size={18} /> Cloud sync</div>
        <p className="stm-muted stm-mb-12">
          Your data syncs to the cloud when logged in. Status: <strong>{syncStatus}</strong>
        </p>
        <Button variant="secondary" onClick={onSyncNow}>Sync now</Button>
      </Card>

      <Card>
        <div className="stm-card-title stm-mb-12"><Bell size={18} /> Reminders</div>
        <Field label="Daily reminder hour">
          <SelectInput
            value={settings.reminderHour ?? 9}
            onChange={(e) => onSettingsChange({ ...settings, reminderHour: Number(e.target.value) })}
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>{i}:00</option>
            ))}
          </SelectInput>
        </Field>
        <Button variant="primary" className="stm-mt-12" onClick={enableNotifications}>
          Enable notifications
        </Button>
      </Card>

      <Card>
        <div className="stm-card-title stm-mb-12"><Download size={18} /> Export data</div>
        <div className="stm-flex stm-gap-8 stm-wrap">
          <Button variant="secondary" onClick={() => exportTasksCSV(tasks)}>Export tasks (CSV)</Button>
          <Button variant="secondary" onClick={() => exportAnalyticsCSV({ tasks, habits, sessions })}>Export analytics (CSV)</Button>
          <Button variant="secondary" onClick={() => exportTasksPDF(tasks)}>Print tasks (PDF)</Button>
        </div>
      </Card>

      <Card>
        <div className="stm-card-title stm-mb-12"><Calendar size={18} /> Calendar integration</div>
        <p className="stm-muted stm-mb-12">
          Download tasks as .ics file and import into Google Calendar, Outlook, or Apple Calendar.
        </p>
        <div className="stm-flex stm-gap-8 stm-wrap">
          <Button variant="secondary" onClick={() => exportTasksICS(tasks)}>
            <Calendar size={16} /> Export .ics
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Smart+Task+Manager`
              window.open(url, '_blank')
            }}
          >
            <Mail size={16} /> Open Google Calendar
          </Button>
        </div>
      </Card>
    </div>
  )
}
