import { useMemo, useState } from 'react'
import { Plus, Trash2, Flame, CalendarDays, CheckCircle2, RotateCcw, Info } from 'lucide-react'
import { Card, Button, Field, Modal, SelectInput, TextInput, Pill, IconButton } from '../components/ui'
import { isoDate } from '../lib/dateUtils'

function toneForStreak(streak) {
  if (streak >= 14) return 'good'
  if (streak >= 7) return 'info'
  if (streak >= 3) return 'warn'
  return 'neutral'
}

export default function HabitsPage({
  todayISO,
  habits,
  streakByHabitId,
  onAddHabit,
  onToggleHabitDone,
  onDeleteHabit,
  onClearHabitHistory,
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState({ name: '', frequency: 'daily' })

  const doneTodayIds = useMemo(() => new Set(habits.filter((h) => (h.completedDates ?? []).includes(todayISO)).map((h) => h.id)), [habits, todayISO])

  const sortedHabits = useMemo(() => {
    return [...habits].sort((a, b) => {
      const sa = streakByHabitId[a.id]?.currentStreak ?? 0
      const sb = streakByHabitId[b.id]?.currentStreak ?? 0
      if (sa !== sb) return sb - sa
      return (b.createdAt ?? 0) - (a.createdAt ?? 0)
    })
  }, [habits, streakByHabitId])

  const addHabit = () => {
    const name = form.name.trim()
    if (!name) return
    onAddHabit({ id: `habit-${Date.now()}-${Math.random().toString(16).slice(2)}`, name, frequency: form.frequency, completedDates: [], createdAt: Date.now() })
    setAddOpen(false)
    setForm({ name: '', frequency: 'daily' })
  }

  const last14 = useMemo(() => {
    const arr = []
    const d = new Date(`${todayISO}T00:00:00`)
    for (let i = 13; i >= 0; i--) {
      const x = new Date(d)
      x.setDate(x.getDate() - i)
      arr.push(isoDate(x))
    }
    return arr
  }, [todayISO])

  return (
    <div className="stm-stack">
      <div className="stm-page-head">
        <div>
          <div className="stm-page-title">Habits</div>
          <div className="stm-page-sub">Streaks that reward consistency, not motivation.</div>
        </div>
        <div className="stm-page-actions">
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <Plus size={16} /> Add habit
          </Button>
        </div>
      </div>

      <div className="stm-grid stm-grid-3">
        {sortedHabits.map((h) => {
          const streak = streakByHabitId[h.id]?.currentStreak ?? 0
          const best = streakByHabitId[h.id]?.bestStreak ?? 0
          const doneToday = doneTodayIds.has(h.id)
          const history = new Set(h.completedDates ?? [])

          return (
            <Card key={h.id} className="stm-habit-card">
              <div className="stm-flex stm-justify-between stm-align-start stm-gap-12">
                <div>
                  <div className="stm-habit-name">{h.name}</div>
                  <div className="stm-task-meta stm-mt-8">
                    <Pill tone="neutral">
                      <CalendarDays size={14} /> {h.frequency === 'daily' ? 'Daily' : 'Weekly'}
                    </Pill>
                    <Pill tone={toneForStreak(streak)}>
                      <Flame size={14} /> {streak} streak
                    </Pill>
                    <Pill tone="info">Best: {best}</Pill>
                  </div>
                </div>

                <IconButton
                  variant={doneToday ? 'primary' : 'ghost'}
                  onClick={() => onToggleHabitDone(h.id, todayISO)}
                  aria-label="Toggle habit completion for today"
                  className="stm-habit-checkbtn"
                >
                  {doneToday ? <CheckCircle2 size={18} /> : <Flame size={18} />}
                </IconButton>
              </div>

              <div className="stm-mt-12">
                <div className="stm-habit-history-title">
                  Recent check-ins
                  <span className="stm-habit-history-hint">
                    <Info size={14} /> Tap today to update your streak.
                  </span>
                </div>

                <div className="stm-dots-grid" aria-label="Recent habit check-ins">
                  {last14.map((d) => (
                    <button
                      key={d}
                      className={`stm-dot ${history.has(d) ? 'is-on' : ''}`}
                      onClick={() => onToggleHabitDone(h.id, d)}
                      aria-label={`Toggle ${h.name} for ${d}`}
                    />
                  ))}
                </div>
              </div>

              <div className="stm-mt-14 stm-flex stm-justify-between stm-align-center">
                <div className="stm-flex stm-gap-10 stm-align-center">
                  <Button variant="secondary" size="sm" onClick={() => onClearHabitHistory(h.id)}>
                    <RotateCcw size={14} /> Clear history
                  </Button>
                </div>
                <IconButton variant="ghost" onClick={() => onDeleteHabit(h.id)} aria-label="Delete habit">
                  <Trash2 size={16} />
                </IconButton>
              </div>
            </Card>
          )
        })}
      </div>

      {habits.length === 0 ? (
        <div className="stm-empty">
          <div className="stm-empty-title">No habits yet</div>
          <div className="stm-empty-desc">Add one habit you can keep—small streaks compound.</div>
          <div className="stm-empty-action">
            <Button variant="primary" onClick={() => setAddOpen(true)}>
              <Plus size={16} /> Add your first habit
            </Button>
          </div>
        </div>
      ) : null}

      <Modal
        open={addOpen}
        title="Add a habit"
        onClose={() => {
          setAddOpen(false)
          setForm({ name: '', frequency: 'daily' })
        }}
      >
        <div className="stm-form-grid">
          <Field label="Habit name" hint="Keep it short and measurable.">
            <TextInput
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Drink water"
              autoFocus
            />
          </Field>
          <Field label="Frequency" hint="Streaks use consecutive periods.">
            <SelectInput value={form.frequency} onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </SelectInput>
          </Field>
        </div>
        <div className="stm-modal-footer">
          <Button variant="secondary" onClick={() => setAddOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={addHabit} disabled={!form.name.trim()}>
            Save habit
          </Button>
        </div>
      </Modal>
    </div>
  )
}

