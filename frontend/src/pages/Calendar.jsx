import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react'
import { Card, Pill } from '../components/ui'
import { getMonthGrid, tasksByDate } from '../lib/calendarUtils'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function CalendarPage({ tasks, todayISO }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState(todayISO)

  const grid = useMemo(() => getMonthGrid(year, month), [year, month])
  const byDate = useMemo(() => tasksByDate(tasks), [tasks])
  const selectedTasks = byDate[selected] ?? []

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  return (
    <div className="stm-stack">
      <div className="stm-page-head">
        <div>
          <div className="stm-page-title">Calendar</div>
          <div className="stm-page-sub">Tasks by due date — tap a day to see details.</div>
        </div>
        <div className="stm-flex stm-gap-12 stm-align-center">
          <button type="button" className="stm-iconbtn stm-iconbtn-ghost" onClick={prevMonth} aria-label="Previous month">
            <ChevronLeft size={20} />
          </button>
          <span className="stm-page-title" style={{ fontSize: '1.1rem' }}>
            {MONTHS[month]} {year}
          </span>
          <button type="button" className="stm-iconbtn stm-iconbtn-ghost" onClick={nextMonth} aria-label="Next month">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <Card>
        <div className="stm-cal-grid">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="stm-cal-head">{d}</div>
          ))}
          {grid.map((dateISO, i) => {
            if (!dateISO) return <div key={`e-${i}`} className="stm-cal-cell stm-cal-empty" />
            const dayTasks = byDate[dateISO] ?? []
            const isToday = dateISO === todayISO
            const isSelected = dateISO === selected
            return (
              <button
                key={dateISO}
                type="button"
                className={`stm-cal-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                onClick={() => setSelected(dateISO)}
              >
                <span className="stm-cal-day">{dateISO.slice(8)}</span>
                {dayTasks.length > 0 ? (
                  <span className="stm-cal-dots">
                    {dayTasks.slice(0, 3).map((t) => (
                      <span key={t.id} className={`stm-cal-dot priority-${t.priority}`} />
                    ))}
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      </Card>

      <Card>
        <div className="stm-card-top">
          <div className="stm-card-title">
            <CalendarDays size={18} /> {selected}
          </div>
          <Pill tone="info">{selectedTasks.length} task(s)</Pill>
        </div>
        {selectedTasks.length === 0 ? (
          <p className="stm-muted">No tasks due on this day.</p>
        ) : (
          <ul className="stm-list-plain">
            {selectedTasks.map((t) => (
              <li key={t.id} className="stm-flex stm-justify-between stm-align-center stm-mt-8">
                <span>{t.title}</span>
                <Pill tone={t.status === 'done' ? 'good' : 'warn'}>{t.status}</Pill>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
