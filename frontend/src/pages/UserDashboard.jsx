import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '../lib/AuthContext'
import DashboardPage from './Dashboard'
import TasksPage from './Tasks'
import HabitsPage from './Habits'
import PomodoroPage from './Pomodoro'
import AnalyticsPage from './Analytics'
import SchedulerPage from './Scheduler'
import { isoDate } from '../lib/dateUtils'
import { useLocalStorageState, createId } from '../lib/useLocalStorageState'
import { computeStreakSummary } from '../lib/analytics'
import '../styles/UIEnhancements.css'

const createLS = (userId) => ({
  tasks: `stm_tasks_${userId}_v1`,
  habits: `stm_habits_${userId}_v1`,
  sessions: `stm_sessions_${userId}_v1`,
  pomodoro: `stm_pomodoro_${userId}_v1`,
})

const seedTasks = () => {
  const today = isoDate(new Date())
  return [
    {
      id: createId('task'),
      title: 'Plan today in 5 minutes',
      dueDate: today,
      estimateMin: 20,
      priority: 'high',
      status: 'open',
      createdAt: Date.now(),
      doneAt: null,
    },
  ]
}

const seedHabits = () => [
  {
    id: createId('habit'),
    name: 'Drink water',
    frequency: 'daily',
    completedDates: [],
    createdAt: Date.now(),
  },
]

export default function UserDashboard() {
  const { user, logout } = useAuth()
  const [activePage, setActivePage] = useState('dashboard')
  const userId = user?.id ?? 'guest'
  const LS = useMemo(() => createLS(userId), [userId])

  const [tasks, setTasks] = useLocalStorageState(LS.tasks, seedTasks)
  const [habits, setHabits] = useLocalStorageState(LS.habits, seedHabits)
  const [sessions, setSessions] = useLocalStorageState(LS.sessions, () => [])
  const [smartSortEnabled, setSmartSortEnabled] = useLocalStorageState(`${LS.tasks}_smartSort`, true)
  const [pomodoroState, setPomodoroState] = useLocalStorageState(LS.pomodoro, () => ({
    status: 'idle',
    mode: 'focus',
    remainingSec: 25 * 60,
    startedAt: null,
    endAt: null,
    modeDurationSec: 25 * 60,
  }))

  const pomodoroSettings = useMemo(() => ({
    focusMin: 25,
    shortBreakMin: 5,
    longBreakMin: 15,
    longBreakEvery: 4,
  }), [])

  const todayISO = useMemo(() => isoDate(new Date()), [])

  // Compute derived data
  const streakByHabitId = useMemo(() => {
    const summaries = computeStreakSummary(habits, todayISO)
    const map = {}
    for (const s of summaries) {
      map[s.habitId] = { currentStreak: s.currentStreak, bestStreak: s.bestStreak }
    }
    return map
  }, [habits, todayISO])

  const bestHabitStreak = useMemo(() => {
    return Math.max(0, ...Object.values(streakByHabitId).map((s) => s.currentStreak ?? 0))
  }, [streakByHabitId])

  const focusMinutesByTaskId = useMemo(() => {
    const map = {}
    for (const s of sessions) {
      if (s.type !== 'focus' || !s.taskId) continue
      map[s.taskId] = (map[s.taskId] ?? 0) + (s.durationSec ?? 0) / 60
    }
    return map
  }, [sessions])

  const sessionsTodayCount = useMemo(() => {
    return sessions.filter((s) => {
      const sessionDate = s.startedAt ? isoDate(new Date(s.startedAt)) : todayISO
      return s.type === 'focus' && sessionDate === todayISO
    }).length
  }, [sessions, todayISO])

  const onFocusSessionCompleted = useCallback((sessionData) => {
    const session = {
      id: createId('session'),
      type: 'focus',
      taskId: sessionData.taskId,
      startedAt: sessionData.startedAt,
      endedAt: sessionData.endedAt,
      durationSec: sessionData.durationSec,
      createdAt: Date.now(),
    }
    setSessions((prev) => [session, ...prev])
  }, [setSessions])

  // Task callbacks
  const onAddTask = useCallback((task) => {
    setTasks((prev) => [task, ...prev])
  }, [setTasks])

  const onUpdateTask = useCallback((taskId, patch) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)))
  }, [setTasks])

  const onDeleteTask = useCallback((taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
  }, [setTasks])

  const onToggleTaskDone = useCallback((taskId, done) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t
        return done ? { ...t, status: 'done', doneAt: Date.now() } : { ...t, status: 'open', doneAt: null }
      }),
    )
  }, [setTasks])

  const onStartFocus = useCallback((taskId) => {
    // Start a Pomodoro session for this task
    setPomodoroState({
      status: 'idle',
      mode: 'focus',
      remainingSec: 25 * 60,
      selectedTaskId: taskId,
      startedAt: null,
      endAt: null,
      modeDurationSec: 25 * 60,
      focusCycle: 0,
    })
    setActivePage('pomodoro')
  }, [setPomodoroState, setActivePage])

  // Habit callbacks
  const onAddHabit = useCallback((habit) => {
    setHabits((prev) => [habit, ...prev])
  }, [setHabits])

  const onToggleHabitDone = useCallback((habitId, dateISO) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h
        const set = new Set(h.completedDates ?? [])
        if (set.has(dateISO)) {
          set.delete(dateISO)
        } else {
          set.add(dateISO)
        }
        return { ...h, completedDates: [...set] }
      }),
    )
  }, [setHabits])

  const onDeleteHabit = useCallback((habitId) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId))
  }, [setHabits])

  const onClearHabitHistory = useCallback((habitId) => {
    setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, completedDates: [] } : h)))
  }, [setHabits])

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout()
    }
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'habits', label: 'Habits' },
    { id: 'pomodoro', label: 'Pomodoro' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'scheduler', label: 'Scheduler' },
  ]

  if (!user) {
    return <div style={{ padding: '20px' }}>Error: User not found</div>
  }

  return (
    <div className="flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-[var(--bg)] md:flex-row">
      {/* Sidebar */}
      <aside className="flex w-full shrink-0 flex-col gap-4 overflow-visible border-b border-[var(--border)] bg-[var(--card)] px-3.5 py-3.5 shadow-[inset_0_-1px_0_var(--border)] md:h-svh md:w-[280px] md:basis-[280px] md:overflow-y-auto md:border-r md:border-b-0 md:px-5 md:py-6 md:shadow-[inset_-1px_0_0_var(--border)]">
        <div>
          <h2 className="mb-2 text-base font-bold text-[var(--text-h)] md:text-lg">
            Smart Task Manager
          </h2>
          <p className="m-0 text-[13px] text-[var(--text)]">
            Hi, {user.name || user.username || 'User'}!
          </p>
        </div>

        {/* Navigation */}
        <nav
          className="flex flex-row gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] md:mb-6 md:flex-1 md:flex-col md:gap-1.5 md:overflow-x-visible md:pb-0"
          aria-label="Dashboard navigation"
        >
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`shrink-0 whitespace-nowrap rounded-[10px] border px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200 md:px-3.5 md:py-3 md:text-sm ${
                activePage === item.id
                  ? 'border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent)] font-semibold'
                  : 'border-transparent bg-transparent text-[var(--text)] hover:bg-[rgba(170,59,255,0.08)] hover:text-[var(--accent)] md:hover:translate-x-1'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="self-start rounded-[10px] border border-[rgba(244,67,54,0.2)] bg-[rgba(244,67,54,0.1)] px-3 py-2.5 text-[13px] font-semibold text-[#f44336] transition-all hover:border-[rgba(244,67,54,0.3)] hover:bg-[rgba(244,67,54,0.2)] md:w-full md:px-3.5 md:py-3 md:text-sm"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="w-full min-w-0 flex-1 bg-[var(--bg)] px-3 py-3.5 md:overflow-auto md:p-8">
        <div className="mx-auto w-full max-w-[1400px] min-w-0">
          {activePage === 'dashboard' && (
            <DashboardPage 
              todayISO={todayISO}
              tasks={tasks}
              habits={habits}
              sessions={sessions}
              bestHabitStreak={bestHabitStreak}
              onNavigate={setActivePage}
            />
          )}
          {activePage === 'tasks' && (
            <TasksPage
              todayISO={todayISO}
              tasks={tasks}
              smartSortEnabled={smartSortEnabled}
              onSmartSortEnabledChange={setSmartSortEnabled}
              focusMinutesByTaskId={focusMinutesByTaskId}
              onAddTask={onAddTask}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onToggleTaskDone={onToggleTaskDone}
              onStartFocus={onStartFocus}
            />
          )}
          {activePage === 'habits' && (
            <HabitsPage
              todayISO={todayISO}
              habits={habits}
              streakByHabitId={streakByHabitId}
              onAddHabit={onAddHabit}
              onToggleHabitDone={onToggleHabitDone}
              onDeleteHabit={onDeleteHabit}
              onClearHabitHistory={onClearHabitHistory}
            />
          )}
          {activePage === 'pomodoro' && (
            <PomodoroPage
              tasks={tasks}
              pomodoroSettings={pomodoroSettings}
              pomodoroState={pomodoroState}
              setPomodoroState={setPomodoroState}
              sessionsTodayCount={sessionsTodayCount}
              onFocusSessionCompleted={onFocusSessionCompleted}
            />
          )}
          {activePage === 'analytics' && (
            <AnalyticsPage
              todayISO={todayISO}
              tasks={tasks}
              habits={habits}
              sessions={sessions}
            />
          )}
          {activePage === 'scheduler' && (
            <SchedulerPage
              todayISO={todayISO}
              tasks={tasks}
              focusMinutesByTaskId={focusMinutesByTaskId}
              smartSortEnabled={smartSortEnabled}
              pomodoroSettings={pomodoroSettings}
              onStartFocusForTask={onStartFocus}
            />
          )}
        </div>
      </main>
    </div>
  )
}
