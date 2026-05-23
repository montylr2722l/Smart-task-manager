import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Plus,
  Trash2,
  Timer,
  Sparkles,
  Pencil,
  CalendarDays,
  Wand2,
  Tag,
} from 'lucide-react'
import { Card, Button, Field, Modal, SelectInput, TextInput, Pill, IconButton } from '../components/ui'
import { formatDurationMinutes } from '../lib/dateUtils'
import { sortTasksSmart } from '../lib/smartPriority'
import { createId } from '../lib/useLocalStorageState'
import { suggestSubtasks, parseTagsInput } from '../lib/taskAI'

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
  onToggleSubtask,
  onStartFocus,
}) {
  const [filter, setFilter] = useState('open')
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)

  const [form, setForm] = useState({
    title: '',
    dueDate: '',
    estimateMin: '',
    priority: 'medium',
    tags: '',
    subtasks: [],
  })

  const allTags = useMemo(() => {
    const set = new Set()
    for (const t of tasks) {
      for (const tag of t.tags ?? []) set.add(tag)
    }
    return [...set].sort()
  }, [tasks])

  const resetForm = () => {
    setForm({ title: '', dueDate: '', estimateMin: '', priority: 'medium', tags: '', subtasks: [] })
    setEditId(null)
  }

  const openEdit = (task) => {
    setEditId(task.id)
    setForm({
      title: task.title ?? '',
      dueDate: task.dueDate ?? '',
      estimateMin: task.estimateMin ?? '',
      priority: task.priority ?? 'medium',
      tags: (task.tags ?? []).join(', '),
      subtasks: [...(task.subtasks ?? [])],
    })
    setAddOpen(true)
  }

  const applyAISubtasks = () => {
    const title = form.title.trim()
    if (!title) return
    const est = form.estimateMin === '' ? null : Math.max(0, Math.round(Number(form.estimateMin)))
    setForm((f) => ({ ...f, subtasks: suggestSubtasks(title, est) }))
  }

  const addSubtaskField = () => {
    setForm((f) => ({
      ...f,
      subtasks: [...f.subtasks, { id: createId('sub'), title: '', done: false, order: f.subtasks.length }],
    }))
  }

  const saveTask = () => {
    const title = form.title.trim()
    if (!title) return

    const estimateMin = form.estimateMin === '' ? null : Math.max(0, Math.round(Number(form.estimateMin)))
    const dueDate = form.dueDate ? form.dueDate : null
    const tags = parseTagsInput(form.tags)
    const subtasks = form.subtasks.filter((s) => s.title?.trim())

    if (editId) {
      onUpdateTask(editId, { title, dueDate, estimateMin, priority: form.priority, tags, subtasks })
    } else {
      onAddTask({
        id: createId('task'),
        title,
        dueDate,
        estimateMin,
        priority: form.priority,
        tags,
        subtasks,
        status: 'open',
        createdAt: Date.now(),
        doneAt: null,
      })
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
    if (tagFilter) list = list.filter((t) => (t.tags ?? []).includes(tagFilter))

    if (smartSortEnabled && filter !== 'done') {
      list = sortTasksSmart(list, { todayISO, focusMinutesByTaskId })
    } else {
      list = [...list].sort((a, b) => {
        const da = a.dueDate ? new Date(`${a.dueDate}T00:00:00`).getTime() : Number.POSITIVE_INFINITY
        const db = b.dueDate ? new Date(`${b.dueDate}T00:00:00`).getTime() : Number.POSITIVE_INFINITY
        if (da !== db) return da - db
        return (b.createdAt ?? 0) - (a.createdAt ?? 0)
      })
    }
    return list
  }, [tasks, filter, query, tagFilter, smartSortEnabled, todayISO, focusMinutesByTaskId])

  const doneCount = useMemo(() => tasks.filter((t) => t.status === 'done').length, [tasks])
  const openCount = tasks.length - doneCount
  const dueTodayCount = tasks.filter((t) => t.status !== 'done' && t.dueDate === todayISO).length

  return (
    <div className="stm-stack">
      <div className="stm-page-head">
        <div>
          <div className="stm-page-title">Tasks</div>
          <div className="stm-page-sub">Subtasks, tags, and AI breakdown.</div>
        </div>
        <div className="stm-page-actions">
          <div className="stm-seg">
            <button className={`stm-seg-btn ${filter === 'open' ? 'is-active' : ''}`} onClick={() => setFilter('open')}>
              Open <span className="stm-badge">{openCount}</span>
            </button>
            <button className={`stm-seg-btn ${filter === 'done' ? 'is-active' : ''}`} onClick={() => setFilter('done')}>
              Done <span className="stm-badge stm-badge-good">{doneCount}</span>
            </button>
            <button className={`stm-seg-btn ${filter === 'all' ? 'is-active' : ''}`} onClick={() => setFilter('all')}>All</button>
          </div>
          <div className="stm-flex stm-gap-12 stm-align-center">
            <label className="stm-switch">
              <input type="checkbox" checked={smartSortEnabled} onChange={(e) => onSmartSortEnabledChange(e.target.checked)} />
              <span className="stm-switch-slider" />
              <span className="stm-switch-label"><Sparkles size={14} /> Smart Sort</span>
            </label>
            <Button variant="primary" size="md" onClick={() => { resetForm(); setAddOpen(true) }}>
              <Plus size={16} /> Add
            </Button>
          </div>
        </div>
      </div>

      <div className="stm-card stm-card-compact">
        <div className="stm-flex stm-gap-12 stm-align-center stm-wrap stm-justify-between">
          <div className="stm-flex stm-gap-12 stm-align-center">
            <div className="stm-mini-kpi">
              <div className="stm-mini-kpi-label">Due today</div>
              <div className="stm-mini-kpi-value">{dueTodayCount}</div>
            </div>
          </div>
          <div className="stm-flex stm-gap-10 stm-align-center stm-wrap">
            {allTags.length > 0 ? (
              <SelectInput value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} aria-label="Filter by tag">
                <option value="">All tags</option>
                {allTags.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </SelectInput>
            ) : null}
            <TextInput placeholder="Search tasks..." value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search tasks" />
          </div>
        </div>
      </div>

      <div className="stm-grid stm-grid-2">
        {visibleTasks.map((t) => {
          const focusedMin = focusMinutesByTaskId[t.id] ?? 0
          const estimateMin = t.estimateMin ?? null
          const remainingMin = estimateMin != null ? Math.max(0, estimateMin - focusedMin) : null
          const dueTone = t.dueDate === todayISO ? 'good' : t.dueDate ? 'warn' : 'neutral'
          const subs = t.subtasks ?? []
          const subsDone = subs.filter((s) => s.done).length
          const expanded = expandedId === t.id

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
                    <button
                      type="button"
                      className="stm-task-title"
                      style={{ background: 'none', border: 'none', cursor: subs.length ? 'pointer' : 'default', textAlign: 'left', padding: 0, color: 'inherit' }}
                      onClick={() => subs.length && setExpandedId(expanded ? null : t.id)}
                    >
                      {t.title}
                      {subs.length > 0 ? (
                        <span className="stm-field-hint"> ({subsDone}/{subs.length})</span>
                      ) : null}
                    </button>
                    <div className="stm-task-actions">
                      {t.status !== 'done' ? (
                        <>
                          <IconButton variant="ghost" onClick={() => onStartFocus(t.id)} aria-label="Start focus">
                            <Timer size={16} />
                          </IconButton>
                          <IconButton variant="ghost" onClick={() => openEdit(t)} aria-label="Edit task">
                            <Pencil size={16} />
                          </IconButton>
                        </>
                      ) : null}
                      <IconButton variant="ghost" onClick={() => onDeleteTask(t.id)} aria-label="Delete task">
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  </div>
                  {(t.tags ?? []).length > 0 ? (
                    <div className="stm-tag-row">
                      {t.tags.map((tag) => (
                        <Pill key={tag} tone="info"><Tag size={12} /> {tag}</Pill>
                      ))}
                    </div>
                  ) : null}
                  <div className="stm-task-meta">
                    {t.dueDate ? <Pill tone={dueTone}><CalendarDays size={14} /> {t.dueDate}</Pill> : <Pill tone="neutral">No due date</Pill>}
                    <Pill tone={priorityTone(t.priority)}>Priority: {t.priority}</Pill>
                    {estimateMin != null ? <Pill tone="neutral">Estimate: {formatDurationMinutes(estimateMin)}</Pill> : null}
                    <Pill tone="info">Focused: {formatDurationMinutes(focusedMin)}</Pill>
                    {remainingMin != null ? <Pill tone={remainingMin === 0 ? 'good' : 'warn'}>Remaining: {formatDurationMinutes(remainingMin)}</Pill> : null}
                    {t.status === 'done' ? <Pill tone="good"><CheckCircle2 size={14} /> Done</Pill> : null}
                  </div>
                  {expanded && subs.length > 0 ? (
                    <div className="stm-subtask-list">
                      {subs.map((s) => (
                        <label key={s.id} className="stm-subtask-item">
                          <input
                            type="checkbox"
                            checked={!!s.done}
                            onChange={() => onToggleSubtask(t.id, s.id)}
                          />
                          <span style={{ textDecoration: s.done ? 'line-through' : 'none' }}>{s.title}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {visibleTasks.length === 0 ? (
        <div className="stm-empty">
          <div className="stm-empty-title">No tasks found</div>
          <Button variant="primary" onClick={() => { resetForm(); setAddOpen(true) }}><Plus size={16} /> Add task</Button>
        </div>
      ) : null}

      <Modal open={addOpen} title={editId ? 'Edit task' : 'Add a task'} onClose={() => { setAddOpen(false); resetForm() }}>
        <div className="stm-form-grid">
          <Field label="Title">
            <TextInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Prepare for exam" autoFocus />
          </Field>
          <Field label="Tags" hint="Comma-separated, e.g. work, urgent">
            <TextInput value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="work, study" />
          </Field>
          <Field label="Due date">
            <TextInput type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
          </Field>
          <Field label="Estimate (minutes)">
            <TextInput type="number" min={0} value={form.estimateMin} onChange={(e) => setForm((f) => ({ ...f, estimateMin: e.target.value }))} />
          </Field>
          <Field label="Priority">
            <SelectInput value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </SelectInput>
          </Field>
          <Field label="Subtasks" hint="Use AI to auto-generate steps.">
            <div className="stm-flex stm-gap-8 stm-mb-8">
              <Button variant="secondary" size="sm" onClick={applyAISubtasks} type="button">
                <Wand2 size={14} /> AI breakdown
              </Button>
              <Button variant="ghost" size="sm" onClick={addSubtaskField} type="button"><Plus size={14} /> Add step</Button>
            </div>
            {form.subtasks.map((s, idx) => (
              <TextInput
                key={s.id}
                className="stm-mt-8"
                value={s.title}
                placeholder={`Step ${idx + 1}`}
                onChange={(e) => {
                  const subtasks = [...form.subtasks]
                  subtasks[idx] = { ...subtasks[idx], title: e.target.value }
                  setForm((f) => ({ ...f, subtasks }))
                }}
              />
            ))}
          </Field>
        </div>
        <div className="stm-modal-footer">
          <Button variant="secondary" onClick={() => { setAddOpen(false); resetForm() }}>Cancel</Button>
          <Button variant="primary" onClick={saveTask} disabled={!form.title.trim()}>Save</Button>
        </div>
      </Modal>
    </div>
  )
}
