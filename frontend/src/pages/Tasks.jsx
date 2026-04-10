import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Plus,
  Trash2,
  Timer,
  Sparkles,
  Pencil,
  CalendarDays,
} from 'lucide-react'
import { Card, Button, Field, Modal, SelectInput, TextInput, Pill, IconButton } from '../components/ui'
import { formatDurationMinutes } from '../lib/dateUtils'
import { sortTasksSmart } from '../lib/smartPriority'
import { createId } from '../lib/useLocalStorageState'

function priorityTone(priority) {
  if (priority === 'high') return 'warn'
  if (priority === 'medium') return 'info'
  return 'neutral'
}

export default function TasksPage({
  todayISO,
  tasks,
  smartSortEnabled,
  onSmartSortEnabledChange,
  focusMinutesByTaskId,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTaskDone,
  onStartFocus,
}) {
  const [filter, setFilter] = useState('open') // open|done|all
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState(null)

  const [form, setForm] = useState({
    title: '',
    dueDate: '',
    estimateMin: '',
    priority: 'medium',
  })

  const resetForm = () => {
    setForm({ title: '', dueDate: '', estimateMin: '', priority: 'medium' })
    setEditId(null)
  }

  const openEdit = (task) => {
    setEditId(task.id)
    setForm({
      title: task.title ?? '',
      dueDate: task.dueDate ?? '',
      estimateMin: task.estimateMin ?? '',
      priority: task.priority ?? 'medium',
    })
    setAddOpen(true)
  }

  const saveTask = () => {
    const title = form.title.trim()
    if (!title) return

    const estimateMin = form.estimateMin === '' ? null : Math.max(0, Math.round(Number(form.estimateMin)))
    const dueDate = form.dueDate ? form.dueDate : null

    if (editId) {
      onUpdateTask(editId, {
        title,
        dueDate,
        estimateMin,
        priority: form.priority,
      })
    } else {
      const newTask = {
        id: createId('task'),
        title,
        dueDate,
        estimateMin,
        priority: form.priority,
        status: 'open',
        createdAt: Date.now(),
        doneAt: null,
      }
      onAddTask(newTask)
    }

    setAddOpen(false)
    resetForm()
  }

  const visibleTasks = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = tasks
    if (filter === 'open') list = list.filter((t) => t.status !== 'done')
    if (filter === 'done') list = list.filter((t) => t.status === 'done')
    if (q) list = list.filter((t) => (t.title ?? '').toLowerCase().includes(q))

    if (smartSortEnabled && filter !== 'done') {
      list = sortTasksSmart(list, { todayISO, focusMinutesByTaskId })
    } else {
      list = [...list].sort((a, b) => {
        // Sort open tasks by due date first, then created time.
        const da = a.dueDate ? new Date(`${a.dueDate}T00:00:00`).getTime() : Number.POSITIVE_INFINITY
        const db = b.dueDate ? new Date(`${b.dueDate}T00:00:00`).getTime() : Number.POSITIVE_INFINITY
        if (da !== db) return da - db
        return (b.createdAt ?? 0) - (a.createdAt ?? 0)
      })
    }
    return list
  }, [tasks, filter, query, smartSortEnabled, todayISO, focusMinutesByTaskId])

  const doneCount = useMemo(() => tasks.filter((t) => t.status === 'done').length, [tasks])
  const openCount = tasks.length - doneCount

  const dueTodayCount = tasks.filter((t) => t.status !== 'done' && t.dueDate === todayISO).length

  return (
    <div className="stm-stack">
      <div className="stm-page-head">
        <div>
          <div className="stm-page-title">Tasks</div>
          <div className="stm-page-sub">
            Smart prioritization + time-aware progress.
          </div>
        </div>
        <div className="stm-page-actions">
          <div className="stm-seg">
            <button
              className={`stm-seg-btn ${filter === 'open' ? 'is-active' : ''}`}
              onClick={() => setFilter('open')}
            >
              Open <span className="stm-badge">{openCount}</span>
            </button>
            <button
              className={`stm-seg-btn ${filter === 'done' ? 'is-active' : ''}`}
              onClick={() => setFilter('done')}
            >
              Done <span className="stm-badge stm-badge-good">{doneCount}</span>
            </button>
            <button
              className={`stm-seg-btn ${filter === 'all' ? 'is-active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
          </div>
          <div className="stm-flex stm-gap-12 stm-align-center">
            <label className="stm-switch">
              <input
                type="checkbox"
                checked={smartSortEnabled}
                onChange={(e) => onSmartSortEnabledChange(e.target.checked)}
              />
              <span className="stm-switch-slider" />
              <span className="stm-switch-label">
                <Sparkles size={14} /> Smart Sort
              </span>
            </label>
            <Button variant="primary" size="md" onClick={() => { resetForm(); setAddOpen(true); }}>
              <Plus size={16} /> Add
            </Button>
          </div>
        </div>
      </div>

      <div className="stm-card stm-card-compact">
        <div className="stm-flex stm-gap-12 stm-align-center stm-justify-between">
          <div className="stm-flex stm-gap-12 stm-align-center">
            <div className="stm-mini-kpi">
              <div className="stm-mini-kpi-label">Due today</div>
              <div className="stm-mini-kpi-value">{dueTodayCount}</div>
            </div>
            <div className="stm-mini-kpi">
              <div className="stm-mini-kpi-label">Next up</div>
              <div className="stm-mini-kpi-value">
                {visibleTasks.find((t) => t.status !== 'done')?.title ?? '—'}
              </div>
            </div>
          </div>
          <div className="stm-flex stm-gap-10 stm-align-center">
            <TextInput
              placeholder="Search tasks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search tasks"
            />
          </div>
        </div>
      </div>

      <div className="stm-grid stm-grid-2">
        {visibleTasks.map((t) => {
          const focusedMin = focusMinutesByTaskId[t.id] ?? 0
          const estimateMin = t.estimateMin ?? null
          const remainingMin = estimateMin != null ? Math.max(0, estimateMin - focusedMin) : null
          const dueTone =
            t.dueDate === todayISO ? 'good' : t.dueDate ? 'warn' : 'neutral'

          return (
            <Card key={t.id} className="stm-task-card">
              <div className="stm-task-main">
                <div className="stm-task-check">
                  <input
                    type="checkbox"
                    checked={t.status === 'done'}
                    onChange={(e) => onToggleTaskDone(t.id, e.target.checked)}
                    aria-label={`Mark ${t.title} as done`}
                  />
                </div>
                <div className="stm-task-body">
                  <div className="stm-task-title-row">
                    <div className="stm-task-title">{t.title}</div>
                    <div className="stm-task-actions">
                      {t.status !== 'done' ? (
                        <>
                          <IconButton
                            variant="ghost"
                            onClick={() => onStartFocus(t.id)}
                            aria-label="Start focus for this task"
                          >
                            <Timer size={16} />
                          </IconButton>
                          <IconButton
                            variant="ghost"
                            onClick={() => openEdit(t)}
                            aria-label="Edit task"
                          >
                            <Pencil size={16} />
                          </IconButton>
                        </>
                      ) : null}
                      <IconButton
                        variant="ghost"
                        onClick={() => onDeleteTask(t.id)}
                        aria-label="Delete task"
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  </div>
                  <div className="stm-task-meta">
                    {t.dueDate ? (
                      <Pill tone={dueTone}>
                        <CalendarDays size={14} /> {t.dueDate}
                      </Pill>
                    ) : (
                      <Pill tone="neutral">No due date</Pill>
                    )}
                    <Pill tone={priorityTone(t.priority)}>
                      Priority: {t.priority}
                    </Pill>
                    {estimateMin != null ? (
                      <Pill tone="neutral">Estimate: {formatDurationMinutes(estimateMin)}</Pill>
                    ) : (
                      <Pill tone="neutral">Estimate: —</Pill>
                    )}
                    <Pill tone="info">
                      Focused: {formatDurationMinutes(focusedMin)}
                    </Pill>
                    {remainingMin != null ? (
                      <Pill tone={remainingMin === 0 ? 'good' : 'warn'}>
                        Remaining: {formatDurationMinutes(remainingMin)}
                      </Pill>
                    ) : null}
                    {t.status === 'done' ? (
                      <Pill tone="good">
                        <CheckCircle2 size={14} /> Done
                      </Pill>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {visibleTasks.length === 0 ? (
        <div className="stm-empty">
          <div className="stm-empty-title">No tasks found</div>
          <div className="stm-empty-desc">Try adjusting your filters or add a new task.</div>
          <div className="stm-empty-action">
            <Button variant="primary" onClick={() => { resetForm(); setAddOpen(true); }}>
              <Plus size={16} /> Add task
            </Button>
          </div>
        </div>
      ) : null}

      <Modal
        open={addOpen}
        title={editId ? 'Edit task' : 'Add a task'}
        onClose={() => {
          setAddOpen(false)
          resetForm()
        }}
      >
        <div className="stm-form-grid">
          <Field label="Title" hint="What do you want to accomplish?">
            <TextInput
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Finish project report"
              autoFocus
            />
          </Field>

          <Field label="Due date" hint="Optional, improves Smart Sort.">
            <TextInput
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </Field>

          <Field label="Estimate (minutes)" hint="Used for remaining work + scheduling.">
            <TextInput
              type="number"
              min={0}
              value={form.estimateMin}
              onChange={(e) => setForm((f) => ({ ...f, estimateMin: e.target.value }))}
              placeholder="e.g. 45"
            />
          </Field>

          <Field label="Priority">
            <SelectInput
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </SelectInput>
          </Field>
        </div>
        <div className="stm-modal-footer">
          <Button variant="secondary" onClick={() => { setAddOpen(false); resetForm(); }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={saveTask} disabled={!form.title.trim()}>
            Save
          </Button>
        </div>
      </Modal>
    </div>
  )
}

