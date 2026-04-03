import { useMemo, useState } from 'react'
import { Sparkles, Wand2, Timer, CalendarDays, Zap } from 'lucide-react'
import { Card, Button, Field, Pill, SelectInput, TextInput } from '../components/ui'
import { sortTasksSmart } from '../lib/smartPriority'
import { formatDurationMinutes } from '../lib/dateUtils'

function roundUpTo5Minutes(d = new Date()) {
  const x = new Date(d)
  const m = x.getMinutes()
  const rounded = m + (5 - (m % 5 || 5))
  if (rounded >= 60) {
    x.setHours(x.getHours() + 1)
    x.setMinutes(0)
  } else {
    x.setMinutes(rounded)
  }
  x.setSeconds(0)
  x.setMilliseconds(0)
  return x
}

function toTimeInputValue(d) {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function addMinutes(date, mins) {
  const x = new Date(date)
  x.setMinutes(x.getMinutes() + mins)
  return x
}

function toHHMM(date) {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function computeRemainingMin(task, focusMinutesByTaskId) {
  const estimateMin = task.estimateMin ?? null
  const focusedMin = focusMinutesByTaskId[task.id] ?? 0
  if (estimateMin == null) {
    // Unknown estimate: treat as "needs at least one focus block" (not infinite).
    return focusedMin > 0 ? 0 : 25
  }
  return Math.max(0, estimateMin - focusedMin)
}

export default function SchedulerPage({
  todayISO,
  tasks,
  focusMinutesByTaskId,
  smartSortEnabled,
  pomodoroSettings,
  onStartFocusForTask,
}) {
  const [availableMin, setAvailableMin] = useState(90)
  const [startTime, setStartTime] = useState(() => toTimeInputValue(roundUpTo5Minutes()))
  const [includeBreaks, setIncludeBreaks] = useState(true)

  const openTasks = useMemo(() => tasks.filter((t) => t.status !== 'done'), [tasks])

  const sortedOpenTasks = useMemo(() => {
    if (!smartSortEnabled) return [...openTasks]
    return sortTasksSmart(openTasks, { todayISO, focusMinutesByTaskId })
  }, [openTasks, smartSortEnabled, todayISO, focusMinutesByTaskId])

  const plan = useMemo(() => {
    const focusMin = pomodoroSettings.focusMin
    const shortBreakMin = pomodoroSettings.shortBreakMin
    const longBreakMin = pomodoroSettings.longBreakMin
    const longBreakEvery = pomodoroSettings.longBreakEvery

    const [hh, mm] = startTime.split(':').map((x) => Number(x))
    const start = new Date(`${todayISO}T00:00:00`)
    start.setHours(hh, mm, 0, 0)

    let cursor = start
    let remainingBudget = availableMin
    let focusCount = 0
    const usedTaskIds = new Set()
    const blocks = []

    // Greedy allocation while decrementing simulated remaining work.
    const remainingById = new Map(
      sortedOpenTasks.map((t) => [t.id, computeRemainingMin(t, focusMinutesByTaskId)]),
    )
    const taskQueue = sortedOpenTasks.filter((t) => (remainingById.get(t.id) ?? 0) > 0)
    let idx = 0

    while (remainingBudget >= focusMin && focusCount < 12 && taskQueue.length > 0) {
      let task = null
      let attempts = 0
      while (!task && attempts < taskQueue.length) {
        const candidate = taskQueue[idx % taskQueue.length]
        if ((remainingById.get(candidate.id) ?? 0) > 0) task = candidate
        idx++
        attempts++
      }
      if (!task) break

      const blockStart = cursor
      const blockEnd = addMinutes(cursor, focusMin)
      blocks.push({
        id: `focus-${task.id}-${focusCount}-${blockStart.getTime()}`,
        type: 'focus',
        taskId: task.id,
        title: task.title,
        start: blockStart,
        end: blockEnd,
      })

      cursor = blockEnd
      remainingBudget -= focusMin
      focusCount++
      usedTaskIds.add(task.id)
      remainingById.set(task.id, Math.max(0, (remainingById.get(task.id) ?? 0) - focusMin))

      if (!includeBreaks) continue
      // Breaks after focus except if budget is too low.
      const isLong = focusCount > 0 && focusCount % longBreakEvery === 0
      const breakMin = isLong ? longBreakMin : shortBreakMin
      if (remainingBudget >= breakMin) {
        const bStart = cursor
        const bEnd = addMinutes(cursor, breakMin)
        blocks.push({
          id: `break-${isLong ? 'long' : 'short'}-${focusCount}-${bStart.getTime()}`,
          type: 'break',
          title: isLong ? `Long break` : `Short break`,
          start: bStart,
          end: bEnd,
        })
        cursor = bEnd
        remainingBudget -= breakMin
      } else {
        break
      }
    }

    const end = blocks.length ? blocks[blocks.length - 1].end : start
    return { blocks, end }
  }, [
    availableMin,
    startTime,
    includeBreaks,
    sortedOpenTasks,
    focusMinutesByTaskId,
    pomodoroSettings,
    todayISO,
  ])

  const focusBlocks = plan.blocks.filter((b) => b.type === 'focus')
  const focusTotalMin = focusBlocks.length * pomodoroSettings.focusMin

  return (
    <div className="stm-grid stm-grid-2">
      <Card className="stm-stretch">
        <div className="stm-card-top">
          <div className="stm-card-title">
            <Wand2 size={18} /> Smart Planner
          </div>
          <Pill tone="neutral">{todayISO}</Pill>
        </div>

        <div className="stm-form-grid stm-mt-12">
          <Field label="Available minutes" hint="How much focus time you actually have.">
            <TextInput type="number" min={0} value={availableMin} onChange={(e) => setAvailableMin(Number(e.target.value))} />
          </Field>
          <Field label="Start time" hint="Used to generate time blocks.">
            <TextInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </Field>
          <Field label="Include breaks">
            <label className="stm-switch stm-mt-6">
              <input type="checkbox" checked={includeBreaks} onChange={(e) => setIncludeBreaks(e.target.checked)} />
              <span className="stm-switch-slider" />
              <span className="stm-switch-label">Breaks between focuses</span>
            </label>
          </Field>
          <Field label="Allocation style" hint="For now, we use Smart Sort (optional).">
            <SelectInput value={smartSortEnabled ? 'smart' : 'manual'} onChange={() => {}} disabled>
              <option value="smart">Smart Sort</option>
              <option value="manual">Due Date</option>
            </SelectInput>
          </Field>
        </div>

        <div className="stm-mt-14 stm-flex stm-gap-12 stm-wrap">
          <Pill tone="good">
            <Timer size={14} /> Focus blocks: {focusBlocks.length}
          </Pill>
          <Pill tone="neutral">
            Total focus: {formatDurationMinutes(focusTotalMin)}
          </Pill>
          <Pill tone="info">
            Ends around: {focusBlocks.length ? `${toHHMM(plan.end)}` : '—'}
          </Pill>
        </div>

        <div className="stm-note stm-mt-14">
          Plan is generated greedily from your open tasks using due date + priority + remaining work.
        </div>
      </Card>

      <Card>
        <div className="stm-card-top">
          <div className="stm-card-title">
            <CalendarDays size={18} /> Today schedule
          </div>
          <Pill tone="neutral">{plan.blocks.length ? `${plan.blocks.length} blocks` : 'No blocks yet'}</Pill>
        </div>

        <div className="stm-mt-12 stm-stack">
          {plan.blocks.length === 0 ? (
            <div className="stm-muted">
              Add tasks with estimates to unlock better scheduling, then generate again.
            </div>
          ) : (
            plan.blocks.map((b) => {
              if (b.type === 'break') {
                return (
                  <div key={b.id} className="stm-sched-break">
                    <div className="stm-sched-time">
                      {toHHMM(b.start)} - {toHHMM(b.end)}
                    </div>
                    <div className="stm-sched-title">{b.title}</div>
                    <div className="stm-sched-sub">Recover • hydrate • breathe</div>
                  </div>
                )
              }

              const taskRemaining = tasks.find((t) => t.id === b.taskId)?.estimateMin ?? null
              return (
                <div key={b.id} className="stm-sched-focus">
                  <div className="stm-sched-time">
                    {toHHMM(b.start)} - {toHHMM(b.end)}
                  </div>
                  <div className="stm-sched-main">
                    <div className="stm-sched-title">{b.title}</div>
                    <div className="stm-sched-sub">
                      <Zap size={14} /> Ready to start a focus session.
                    </div>
                  </div>
                  <div className="stm-sched-actions">
                    <Button variant="primary" size="sm" onClick={() => onStartFocusForTask(b.taskId)}>
                      <Timer size={16} /> Start
                    </Button>
                  </div>
                  {taskRemaining != null && taskRemaining > 0 ? (
                    <div className="stm-sched-meta">
                      <Pill tone="neutral">Estimate: {formatDurationMinutes(taskRemaining)}</Pill>
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}

