import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts'
import { Sparkles, Target, Flame, Clock } from 'lucide-react'
import { Card, Pill } from '../components/ui'
import { lastNDaysISO, computeFocusMinutesByDay, computeTaskCompletionsByDay, computeHabitCompletionsByDay, computeProductivityScore, computeTaskPriorityDistribution, computeStreakSummary } from '../lib/analytics'
import { formatDurationMinutes } from '../lib/dateUtils'

function mapToSeries(map, days) {
  return days.map((d) => ({ date: d.slice(5), value: map[d] ?? 0 }))
}

export default function AnalyticsPage({ todayISO, tasks, habits, sessions }) {
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

  const streakSummaries = computeStreakSummary(habits, todayISO)
  const topStreaks = [...streakSummaries]
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 4)
    .map((s) => {
      const habit = habits.find((h) => h.id === s.habitId)
      return { habit, ...s }
    })

  const priorityDist = computeTaskPriorityDistribution(tasks)
  const pieData = [
    { name: 'High', value: priorityDist.high ?? 0, color: 'var(--warn)' },
    { name: 'Medium', value: priorityDist.medium ?? 0, color: 'var(--info)' },
    { name: 'Low', value: priorityDist.low ?? 0, color: 'var(--neutral-2)' },
  ]

  const focusSeries = mapToSeries(focusByDay, days7)
  const taskSeries = mapToSeries(taskByDay, days7)
  const habitSeries = mapToSeries(habitByDay, days7)

  return (
    <div className="stm-stack">
      <div className="stm-page-head">
        <div>
          <div className="stm-page-title">Analytics</div>
          <div className="stm-page-sub">See patterns. Then improve consistency.</div>
        </div>
        <div className="stm-page-actions">
          <Pill tone={score >= 75 ? 'good' : score >= 50 ? 'info' : 'warn'}>
            <Sparkles size={14} /> Score {score}/100
          </Pill>
        </div>
      </div>

      <div className="stm-grid stm-grid-2">
        <Card>
          <div className="stm-card-top">
            <div className="stm-card-title">
              <Clock size={18} /> Focus minutes (7 days)
            </div>
            <Pill tone="neutral">{formatDurationMinutes(focusMinutes7d)}</Pill>
          </div>
          <div style={{ height: 250 }} className="stm-mt-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={focusSeries}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="var(--accent)" fill="var(--accent-bg)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="stm-card-top">
            <div className="stm-card-title">
              <Target size={18} /> Tasks completed
            </div>
            <Pill tone="neutral">{tasksDone7d} total</Pill>
          </div>
          <div style={{ height: 250 }} className="stm-mt-12">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskSeries}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="stm-card-top">
            <div className="stm-card-title">
              <Flame size={18} /> Habit check-ins
            </div>
            <Pill tone="neutral">{habitCompletions7d} total</Pill>
          </div>
          <div style={{ height: 250 }} className="stm-mt-12">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={habitSeries}>
                <XAxis dataKey="date" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="var(--info)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="stm-card-top">
            <div className="stm-card-title">Open tasks by priority</div>
            <Pill tone="neutral">Plan focus</Pill>
          </div>
          <div style={{ height: 250 }} className="stm-mt-12">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="stm-note">
            Smart Sort uses due date + priority + remaining work to keep your queue realistic.
          </div>
        </Card>
      </div>

      <div className="stm-grid stm-grid-3">
        <Card>
          <div className="stm-card-top">
            <div className="stm-card-title">
              <Flame size={18} /> Top streaks
            </div>
            <Pill tone="neutral">Now</Pill>
          </div>
          <div className="stm-stack stm-mt-12">
            {topStreaks.length === 0 ? (
              <div className="stm-muted">Create a habit to see streaks.</div>
            ) : (
              topStreaks.map((s) => (
                <div key={s.habitId} className="stm-row">
                  <div className="stm-row-title">{s.habit?.name ?? 'Habit'}</div>
                  <div className="stm-row-actions">
                    <Pill tone={s.currentStreak >= 7 ? 'good' : s.currentStreak >= 3 ? 'info' : 'neutral'}>
                      {s.currentStreak} current • best {s.bestStreak}
                    </Pill>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="stm-card-compact">
          <div className="stm-card-top">
            <div className="stm-card-title">
              <Clock size={18} /> What to do next
            </div>
            <Pill tone="neutral">Actionable</Pill>
          </div>
          <div className="stm-prose stm-mt-12">
            <div className="stm-prose-item">
              If focus minutes are low, pick <b>one</b> high-priority task and start a short focus session.
            </div>
            <div className="stm-prose-item">
              If habit check-ins are spiky, reduce friction: aim for smaller check-ins that you can do daily.
            </div>
          </div>
        </Card>

        <Card className="stm-card-compact">
          <div className="stm-card-top">
            <div className="stm-card-title">
              <Sparkles size={18} /> Productivity tip
            </div>
            <Pill tone="neutral">Small wins</Pill>
          </div>
          <div className="stm-prose stm-mt-12">
            <div className="stm-prose-item">
              Try a <b>2-focus cycle</b> day. Track time honestly, then reduce remaining tasks until your queue feels calm.
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

