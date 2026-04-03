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

  if (!user) {
    return <div style={{ padding: '20px' }}>Error: User not found</div>
  }

  const LS = useMemo(() => createLS(user.id), [user.id])

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
      const sessionDate = isoDate(new Date(s.startedAt ?? Date.now()))
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

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div style={{
        width: '280px',
        borderRight: '1px solid var(--border)',
        padding: '24px 20px',
        background: 'var(--card)',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        boxShadow: 'inset -1px 0 0 var(--border)',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: 'var(--text-h)' }}>
            Smart Task Manager
          </h2>
          <p style={{ margin: '0', fontSize: '13px', color: 'var(--text)' }}>
            Hi, {user.username}!
          </p>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              style={{
                padding: '12px 14px',
                background: activePage === item.id ? 'var(--accent-bg)' : 'transparent',
                color: activePage === item.id ? 'var(--accent)' : 'var(--text)',
                border: activePage === item.id ? '1px solid var(--accent-border)' : 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: activePage === item.id ? '600' : '500',
                fontSize: '14px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (activePage !== item.id) {
                  e.target.style.background = 'rgba(170, 59, 255, 0.08)';
                  e.target.style.color = 'var(--accent)';
                  e.target.style.transform = 'translateX(4px)';
                }
              }}
              onMouseLeave={(e) => {
                if (activePage !== item.id) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--text)';
                  e.target.style.transform = 'translateX(0)';
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          style={{
            padding: '12px 14px',
            background: 'rgba(244, 67, 54, 0.1)',
            color: '#f44336',
            border: '1px solid rgba(244, 67, 54, 0.2)',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(244, 67, 54, 0.2)';
            e.target.style.borderColor = 'rgba(244, 67, 54, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(244, 67, 54, 0.1)';
            e.target.style.borderColor = 'rgba(244, 67, 54, 0.2)';
          }}
        >
          Logout
        </button>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        padding: '32px',
        overflow: 'auto',
        background: 'var(--bg)',
        boxSizing: 'border-box',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
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
      </div>
    </div>
  )
}
