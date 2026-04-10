import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, SkipForward, Timer, Sparkles, Bookmark } from 'lucide-react'
import { Card, Button, SelectInput, Pill, ProgressBar } from '../components/ui'

function modeLabel(mode) {
  if (mode === 'focus') return 'Focus'
  if (mode === 'shortBreak') return 'Short break'
  if (mode === 'longBreak') return 'Long break'
  return 'Focus'
}

function toMMSS(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds))
  const mm = Math.floor(s / 60)
  const ss = s % 60
  return `${mm}:${String(ss).padStart(2, '0')}`
}

export default function PomodoroPage({
  tasks,
  pomodoroSettings,
  pomodoroState,
  setPomodoroState,
  sessionsTodayCount,
  onFocusSessionCompleted,
}) {
  const [nowTick, setNowTick] = useState(() => Date.now())
  const handledEndAtRef = useRef(null)

  const durationSec = useMemo(() => {
    if (pomodoroState.mode === 'focus') return pomodoroSettings.focusMin * 60
    if (pomodoroState.mode === 'longBreak') return pomodoroSettings.longBreakMin * 60
    return pomodoroSettings.shortBreakMin * 60
  }, [pomodoroSettings, pomodoroState.mode])

  const isRunning = pomodoroState.status === 'running'

  const remainingSec = useMemo(() => {
    if (isRunning && pomodoroState.endAt) {
      return Math.max(0, Math.ceil((pomodoroState.endAt - nowTick) / 1000))
    }
    return pomodoroState.remainingSec ?? durationSec
  }, [durationSec, isRunning, nowTick, pomodoroState.endAt, pomodoroState.remainingSec])

  const progress01 = useMemo(() => {
    const d = Math.max(1, durationSec)
    const r = remainingSec
    return Math.max(0, Math.min(1, (d - r) / d))
  }, [durationSec, remainingSec])

  useEffect(() => {
    if (!isRunning) return
    const t = setInterval(() => setNowTick(Date.now()), 350)
    return () => clearInterval(t)
  }, [isRunning])

  const startMode = useCallback(
    (mode, { resetCycle = false } = {}) => {
    const nextDurationSec =
      mode === 'focus'
        ? pomodoroSettings.focusMin * 60
        : mode === 'longBreak'
          ? pomodoroSettings.longBreakMin * 60
          : pomodoroSettings.shortBreakMin * 60

    const startedAt = Date.now()
    const endAt = startedAt + nextDurationSec * 1000

    setPomodoroState((s) => ({
      ...s,
      status: 'running',
      mode,
      startedAt,
      endAt,
      modeDurationSec: nextDurationSec,
      remainingSec: nextDurationSec,
      focusCycle: resetCycle ? 0 : s.focusCycle,
    }))
    },
    [pomodoroSettings, setPomodoroState],
  )

  const startFocus = () => {
    startMode('focus', { resetCycle: pomodoroState.status !== 'running' || pomodoroState.mode !== 'focus' })
  }

  const pause = () => {
    if (pomodoroState.status !== 'running' || !pomodoroState.endAt) return
    const r = Math.max(0, Math.ceil((pomodoroState.endAt - Date.now()) / 1000))
    setPomodoroState((s) => ({
      ...s,
      status: 'paused',
      remainingSec: r,
      endAt: null,
    }))
  }

  const resume = () => {
    const r = pomodoroState.remainingSec ?? durationSec
    const startedAt = Date.now()
    const endAt = startedAt + r * 1000
    setPomodoroState((s) => ({
      ...s,
      status: 'running',
      startedAt,
      endAt,
      remainingSec: r,
    }))
  }

  const reset = () => {
    setPomodoroState((s) => ({
      ...s,
      status: 'idle',
      mode: 'focus',
      remainingSec: pomodoroSettings.focusMin * 60,
      startedAt: null,
      endAt: null,
      modeDurationSec: pomodoroSettings.focusMin * 60,
      focusCycle: 0,
    }))
  }

  const skip = () => {
    if (pomodoroState.status === 'idle') return
    // Skip behaves like finishing the current mode immediately.
    const endedAt = Date.now()
    if (pomodoroState.mode === 'focus') {
      const duration = pomodoroState.modeDurationSec ?? pomodoroSettings.focusMin * 60
      onFocusSessionCompleted({
        taskId: pomodoroState.selectedTaskId ?? null,
        durationSec: duration,
        startedAt: pomodoroState.startedAt ?? endedAt - duration * 1000,
        endedAt,
      })
      const nextFocusCycle = (pomodoroState.focusCycle ?? 0) + 1
      const shouldLongBreak =
        nextFocusCycle > 0 && nextFocusCycle % pomodoroSettings.longBreakEvery === 0

      const nextMode = shouldLongBreak ? 'longBreak' : 'shortBreak'
      const nextDurationSec =
        nextMode === 'longBreak'
          ? pomodoroSettings.longBreakMin * 60
          : pomodoroSettings.shortBreakMin * 60
      const nextStartedAt = Date.now()
      const nextEndAt = nextStartedAt + nextDurationSec * 1000
      setPomodoroState((s) => ({
        ...s,
        status: 'running',
        mode: nextMode,
        startedAt: nextStartedAt,
        endAt: nextEndAt,
        modeDurationSec: nextDurationSec,
        remainingSec: nextDurationSec,
        focusCycle: nextFocusCycle,
      }))
      return
    }

    // If breaking, go to focus.
    if (pomodoroState.mode === 'shortBreak' || pomodoroState.mode === 'longBreak') {
      startMode('focus')
    }
  }

  useEffect(() => {
    if (!isRunning || !pomodoroState.endAt) return
    if (handledEndAtRef.current === pomodoroState.endAt) return
    if (nowTick < pomodoroState.endAt) return

    handledEndAtRef.current = pomodoroState.endAt

    const endedAt = pomodoroState.endAt
    const modeJustEnded = pomodoroState.mode
    const startedAt = pomodoroState.startedAt ?? endedAt - (pomodoroState.modeDurationSec ?? durationSec) * 1000

    if (modeJustEnded === 'focus') {
      const duration = pomodoroState.modeDurationSec ?? durationSec
      onFocusSessionCompleted({
        taskId: pomodoroState.selectedTaskId ?? null,
        durationSec: duration,
        startedAt,
        endedAt,
      })

      const nextFocusCycle = (pomodoroState.focusCycle ?? 0) + 1
      const shouldLongBreak =
        nextFocusCycle > 0 && nextFocusCycle % pomodoroSettings.longBreakEvery === 0

      const nextMode = shouldLongBreak ? 'longBreak' : 'shortBreak'
      const nextDurationSec =
        nextMode === 'longBreak'
          ? pomodoroSettings.longBreakMin * 60
          : pomodoroSettings.shortBreakMin * 60
      const nextStartedAt = Date.now()
      const nextEndAt = nextStartedAt + nextDurationSec * 1000

      setPomodoroState((s) => ({
        ...s,
        mode: nextMode,
        status: 'running',
        startedAt: nextStartedAt,
        endAt: nextEndAt,
        modeDurationSec: nextDurationSec,
        remainingSec: nextDurationSec,
        focusCycle: nextFocusCycle,
      }))
      return
    }

    // break ended -> focus.
    if (modeJustEnded === 'shortBreak' || modeJustEnded === 'longBreak') {
      startMode('focus')
    }
  }, [
    durationSec,
    isRunning,
    nowTick,
    onFocusSessionCompleted,
    startMode,
    pomodoroSettings.focusMin,
    pomodoroSettings.longBreakEvery,
    pomodoroSettings.longBreakMin,
    pomodoroSettings.shortBreakMin,
    pomodoroState.endAt,
    pomodoroState.focusCycle,
    pomodoroState.mode,
    pomodoroState.modeDurationSec,
    pomodoroState.remainingSec,
    pomodoroState.selectedTaskId,
    pomodoroState.startedAt,
    setPomodoroState,
  ])

  useEffect(() => {
    handledEndAtRef.current = null
  }, [pomodoroState.endAt, pomodoroState.status, pomodoroState.mode])

  const task = tasks.find((t) => t.id === pomodoroState.selectedTaskId)

  return (
    <div className="stm-grid stm-grid-2">
      <Card className="stm-stretch">
        <div className="stm-card-top">
          <div className="stm-card-title">
            <Timer size={18} /> Pomodoro Focus
          </div>
          <Pill tone={pomodoroState.mode === 'focus' ? 'good' : 'neutral'}>{modeLabel(pomodoroState.mode)}</Pill>
        </div>

        <div className="stm-pomodoro-mid">
          <div className="stm-pomodoro-time">{toMMSS(remainingSec)}</div>
          <div className="stm-mt-8">
            <ProgressBar value01={progress01} label="Timer progress" />
          </div>
          <div className="stm-pomodoro-sub stm-mt-10">
            Cycle {pomodoroState.focusCycle ?? 0}
            {pomodoroState.mode === 'focus' ? ' • deep work' : ' • recover'}
          </div>
        </div>

        <div className="stm-mt-14 stm-flex stm-gap-10 stm-wrap">
          {pomodoroState.status === 'idle' ? (
            <Button variant="primary" onClick={startFocus}>
              <Play size={16} /> Start focus
            </Button>
          ) : null}

          {pomodoroState.status === 'running' ? (
            <>
              <Button variant="secondary" onClick={pause}>
                <Pause size={16} /> Pause
              </Button>
              <Button variant="ghost" onClick={skip}>
                <SkipForward size={16} /> Skip
              </Button>
            </>
          ) : null}

          {pomodoroState.status === 'paused' ? (
            <>
              <Button variant="primary" onClick={resume}>
                <Play size={16} /> Resume
              </Button>
              <Button variant="ghost" onClick={reset}>
                <RotateCcw size={16} /> Reset
              </Button>
            </>
          ) : null}

          {pomodoroState.status !== 'idle' ? (
            <Button variant="ghost" onClick={reset}>
              <RotateCcw size={16} /> Reset
            </Button>
          ) : null}
        </div>

        <div className="stm-mt-16 stm-grid stm-grid-2 stm-gap-12">
          <div className="stm-mini-card">
            <div className="stm-mini-card-title">
              <Sparkles size={16} /> Today stats
            </div>
            <div className="stm-mini-card-value">
              {sessionsTodayCount} focus session{sessionsTodayCount === 1 ? '' : 's'}
            </div>
            <div className="stm-note">Your sessions auto-log when focus ends.</div>
          </div>
          <div className="stm-mini-card">
            <div className="stm-mini-card-title">
              <Bookmark size={16} /> Active task
            </div>
            <div className="stm-mt-8">
              <SelectInput
                value={pomodoroState.selectedTaskId ?? ''}
                onChange={(e) => {
                  const next = e.target.value || null
                  setPomodoroState((s) => ({ ...s, selectedTaskId: next }))
                }}
                disabled={pomodoroState.status === 'running' && pomodoroState.mode === 'focus'}
              >
                <option value="">No task (general focus)</option>
                {tasks
                  .filter((t) => t.status !== 'done')
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
              </SelectInput>
            </div>
            <div className="stm-mt-8 stm-muted">
              {task ? `Focused on: ${task.title}` : 'Choose a task to track completion time.'}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="stm-card-top">
          <div className="stm-card-title">How it works</div>
          <Pill tone="neutral">Smart + simple</Pill>
        </div>
        <div className="stm-prose stm-mt-12">
          <div className="stm-prose-item">
            <b>Focus</b> sessions log your work time for analytics and smart sorting.
          </div>
          <div className="stm-prose-item">
            After each focus, you get a <b>short break</b>; after every{' '}
            <b>{pomodoroSettings.longBreakEvery}</b> focus cycles you get a <b>long break</b>.
          </div>
          <div className="stm-prose-item">
            Select a task to associate focus time with it. Remaining work updates automatically.
          </div>
          <div className="stm-prose-item stm-mt-14">
            Pro tip: keep tasks small. A focused 25-minute task beats a perfect plan.
          </div>
        </div>
      </Card>
    </div>
  )
}

