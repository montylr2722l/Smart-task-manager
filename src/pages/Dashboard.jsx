import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Sparkles, Target, Timer, Flame, CheckCircle2 } from 'lucide-react'
import { Card } from '../components/ui'
import { computeProductivityScore, computeFocusMinutesByDay, computeHabitCompletionsByDay, computeTaskCompletionsByDay, lastNDaysISO } from '../lib/analytics'
import { formatDurationMinutes, isoDate } from '../lib/dateUtils'
import { Pill, ProgressBar, Button } from '../components/ui'

function toChartData(map, days) {
  return days.map((d) => ({ date: d.slice(5), value: map[d] ?? 0 }))
}

export default function Dashboard({
  todayISO,
  tasks,
  habits,
  sessions,
  bestHabitStreak,
  onNavigate,
}) {
  const days7 = lastNDaysISO(7, new Date())
  const focusByDay = computeFocusMinutesByDay(sessions, days7)
  const taskByDay = computeTaskCompletionsByDay(tasks, days7)
  const habitByDay = computeHabitCompletionsByDay(habits, days7)

  const focusMinutes7d = Object.values(focusByDay).reduce((a, b) => a + b, 0)
  const tasksDone7d = Object.values(taskByDay).reduce((a, b) => a + b, 0)
  const habitCompletions7d = Object.values(habitByDay).reduce((a, b) => a + b, 0)

  const score = computeProductivityScore({
    tasksDone7d,
    habitCompletions7d,
    focusMinutes7d,
  })

  const tasksDoneToday = tasks.filter((t) => t.status === 'done' && t.doneAt && isoDate(new Date(t.doneAt)) === todayISO).length
  const habitsDoneToday = habits.filter((h) => (h.completedDates ?? []).includes(todayISO)).length
  const focusMinutesToday = sessions
    .filter((s) => s.type === 'focus' && isoDate(new Date(s.startedAt)) === todayISO)
    .reduce((sum, s) => sum + (s.durationSec ?? 0) / 60, 0)

  const taskChartData = toChartData(taskByDay, days7)

  return (
    <div className="stm-grid stm-grid-3">
      <Card className="stm-stretch">
        <div className="stm-card-top">
          <div className="stm-card-title">
            <Sparkles size={18} />
            Productivity Score
          </div>
          <Pill tone={score >= 75 ? 'good' : score >= 50 ? 'info' : 'warn'}>{score}/100</Pill>
        </div>
        <div className="stm-mt-12">
          <ProgressBar value01={score / 100} label="Productivity score progress" />
        </div>
        <div className="stm-stat-row">
          <div className="stm-stat">
            <div className="stm-stat-icon">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <div className="stm-stat-label">Done today</div>
              <div className="stm-stat-value">{tasksDoneToday}</div>
            </div>
          </div>
          <div className="stm-stat">
            <div className="stm-stat-icon">
              <Flame size={16} />
            </div>
            <div>
              <div className="stm-stat-label">Habit check-ins</div>
              <div className="stm-stat-value">{habitsDoneToday}</div>
            </div>
          </div>
          <div className="stm-stat">
            <div className="stm-stat-icon">
              <Timer size={16} />
            </div>
            <div>
              <div className="stm-stat-label">Focus today</div>
              <div className="stm-stat-value">{formatDurationMinutes(focusMinutesToday)}</div>
            </div>
          </div>
        </div>
        <div className="stm-mt-12 stm-flex stm-gap-12">
          <Button variant="primary" size="md" onClick={() => onNavigate('tasks')}>
            <Target size={16} /> Continue tasks
          </Button>
          <Button variant="secondary" size="md" onClick={() => onNavigate('focus')}>
            <Timer size={16} /> Start focus
          </Button>
        </div>
      </Card>

      <Card>
        <div className="stm-card-top">
          <div className="stm-card-title">
            <Target size={18} />
            Tasks completed (7 days)
          </div>
          <Pill tone="neutral">Smart rhythm</Pill>
        </div>
        <div style={{ height: 220 }} className="stm-mt-12">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={taskChartData}>
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--accent)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="stm-note">
          Tip: use <b>Smart Sort</b> in Tasks to keep the next best action at the top.
        </div>
      </Card>

      <Card>
        <div className="stm-card-top">
          <div className="stm-card-title">
            <Flame size={18} />
            Streak highlight
          </div>
          <Pill tone={bestHabitStreak >= 7 ? 'good' : 'neutral'}>
            {bestHabitStreak} day{bestHabitStreak === 1 ? '' : 's'}
          </Pill>
        </div>
        <div className="stm-mt-12 stm-stack">
          <div className="stm-kpi">
            <div className="stm-kpi-label">Consistency wins</div>
            <div className="stm-kpi-value">Build a chain, not a mood.</div>
          </div>
          <div className="stm-kpi-actions">
            <Button variant="secondary" size="md" onClick={() => onNavigate('habits')}>
              <Flame size={16} /> Manage habits
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

