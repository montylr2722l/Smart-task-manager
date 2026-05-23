import { useMemo, useCallback, useState, useEffect } from 'react'
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useTheme } from '../lib/ThemeContext'
import { authFetch } from '../lib/api'
import { useCloudSync } from '../lib/useCloudSync'
import { scheduleDailyReminder } from '../lib/notifications'
import { computeWeeklyProgress } from '../lib/weeklyGoals'
import DashboardPage from './Dashboard'
import TasksPage from './Tasks'
import HabitsPage from './Habits'
import PomodoroPage from './Pomodoro'
import AnalyticsPage from './Analytics'
import SchedulerPage from './Scheduler'
import CalendarPage from './Calendar'
import GoalsPage from './Goals'
import AchievementsPage from './Achievements'
import SettingsPage from './Settings'
import TeamPage from './Team'
import { isoDate } from '../lib/dateUtils'
import { useLocalStorageState, createId } from '../lib/useLocalStorageState'
import { computeStreakSummary } from '../lib/analytics'
import { DEFAULT_WEEKLY_GOALS } from '../lib/weeklyGoals'
import '../styles/UIEnhancements.css'

const createLS = (userId) => ({
  tasks: `stm_tasks_${userId}_v1`,
  habits: `stm_habits_${userId}_v1`,
  sessions: `stm_sessions_${userId}_v1`,
  pomodoro: `stm_pomodoro_${userId}_v1`,
  settings: `stm_settings_${userId}_v1`,
})

const DEFAULT_SETTINGS = {
  theme: 'system',
  notificationsEnabled: false,
  reminderHour: 9,
  weeklyGoals: { ...DEFAULT_WEEKLY_GOALS },
}

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
      tags: ['planning'],
      subtasks: [],
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

const DASHBOARD_SECTIONS = [
  { id: 'dashboard', path: '', label: 'Dashboard' },
  { id: 'tasks', path: 'tasks', label: 'Tasks' },
  { id: 'habits', path: 'habits', label: 'Habits' },
  { id: 'calendar', path: 'calendar', label: 'Calendar' },
  { id: 'pomodoro', path: 'pomodoro', label: 'Pomodoro' },
  { id: 'scheduler', path: 'scheduler', label: 'Scheduler' },
  { id: 'goals', path: 'goals', label: 'Goals' },
  { id: 'analytics', path: 'analytics', label: 'Analytics' },
  { id: 'achievements', path: 'achievements', label: 'Badges' },
  { id: 'team', path: 'team', label: 'Team' },
  { id: 'settings', path: 'settings', label: 'Settings' },
]

export default function UserDashboard() {
  const { user, logout } = useAuth()
  const { setTheme } = useTheme()
  const navigate = useNavigate()
  const userId = user?.id ?? 'guest'
  const LS = useMemo(() => createLS(userId), [userId])

  const [tasks, setTasks] = useLocalStorageState(LS.tasks, seedTasks)
  const [habits, setHabits] = useLocalStorageState(LS.habits, seedHabits)
  const [sessions, setSessions] = useLocalStorageState(LS.sessions, () => [])
  const [settings, setSettings] = useLocalStorageState(LS.settings, () => ({ ...DEFAULT_SETTINGS }))
  const [smartSortEnabled, setSmartSortEnabled] = useLocalStorageState(`${LS.tasks}_smartSort`, true)
  const [pomodoroState, setPomodoroState] = useLocalStorageState(LS.pomodoro, () => ({
    status: 'idle',
    mode: 'focus',
    remainingSec: 25 * 60,
    startedAt: null,
    endAt: null,
    modeDurationSec: 25 * 60,
  }))
  const [syncStatus, setSyncStatus] = useState('local')

  const pomodoroSettings = useMemo(() => ({
    focusMin: 25,
    shortBreakMin: 5,
    longBreakMin: 15,
    longBreakEvery: 4,
  }), [])

  const todayISO = useMemo(() => isoDate(new Date()), [])

  const weeklyProgress = useMemo(
    () => computeWeeklyProgress(tasks, habits, sessions, settings.weeklyGoals ?? DEFAULT_WEEKLY_GOALS),
    [tasks, habits, sessions, settings.weeklyGoals],
  )

  const syncPayload = useMemo(
    () => ({
      tasks,
      habits,
      sessions,
      pomodoro: pomodoroState,
      smartSortEnabled,
      settings,
    }),
    [tasks, habits, sessions, pomodoroState, smartSortEnabled, settings],
  )

  const handleRemoteData = useCallback(
    (remote) => {
      const hasData = (remote.tasks?.length ?? 0) > 0 || (remote.habits?.length ?? 0) > 0
      if (!hasData) return
      setTasks(remote.tasks)
      setHabits(remote.habits ?? [])
      setSessions(remote.sessions ?? [])
      if (remote.pomodoro && Object.keys(remote.pomodoro).length) setPomodoroState(remote.pomodoro)
      if (remote.smartSortEnabled !== undefined) setSmartSortEnabled(remote.smartSortEnabled)
      if (remote.settings) {
        setSettings(remote.settings)
        if (remote.settings.theme) setTheme(remote.settings.theme)
      }
      setSyncStatus('synced')
    },
    [setTasks, setHabits, setSessions, setPomodoroState, setSmartSortEnabled, setSettings, setTheme],
  )

  useCloudSync(userId, {
    data: syncPayload,
    onRemoteData: handleRemoteData,
    onSyncSuccess: () => setSyncStatus('synced'),
    onSyncError: () => setSyncStatus('offline'),
  })

  useEffect(() => {
    if (settings.theme) setTheme(settings.theme)
  }, [settings.theme, setTheme])

  useEffect(() => {
    if (!settings.notificationsEnabled) return
    const tasksDue = tasks.filter((t) => t.status !== 'done' && t.dueDate === todayISO).length
    const habitsPending = habits.filter((h) => !(h.completedDates ?? []).includes(todayISO)).length
    scheduleDailyReminder(settings.reminderHour ?? 9, { tasksDueToday: tasksDue, habitsPending })
  }, [settings.notificationsEnabled, settings.reminderHour, tasks, habits, todayISO])

  const onSyncNow = useCallback(async () => {
    try {
      await authFetch('/api/data', { method: 'PUT', body: JSON.stringify(syncPayload) })
      setSyncStatus('synced')
    } catch {
      setSyncStatus('offline')
    }
  }, [syncPayload])

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
    setSessions((prev) => [
      {
        id: createId('session'),
        type: 'focus',
        taskId: sessionData.taskId,
        startedAt: sessionData.startedAt,
        endedAt: sessionData.endedAt,
        durationSec: sessionData.durationSec,
        createdAt: Date.now(),
      },
      ...prev,
    ])
  }, [setSessions])

  const onAddTask = useCallback((task) => setTasks((prev) => [task, ...prev]), [setTasks])
  const onUpdateTask = useCallback(
    (taskId, patch) => setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t))),
    [setTasks],
  )
  const onDeleteTask = useCallback((taskId) => setTasks((prev) => prev.filter((t) => t.id !== taskId)), [setTasks])
  const onToggleTaskDone = useCallback((taskId, done) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: done ? 'done' : 'open', doneAt: done ? Date.now() : null } : t,
      ),
    )
  }, [setTasks])
  const onToggleSubtask = useCallback((taskId, subId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t
        return {
          ...t,
          subtasks: (t.subtasks ?? []).map((s) => (s.id === subId ? { ...s, done: !s.done } : s)),
        }
      }),
    )
  }, [setTasks])

  const onStartFocus = useCallback((taskId) => {
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
    navigate('/dashboard/pomodoro')
  }, [setPomodoroState, navigate])

  const onAddHabit = useCallback((habit) => setHabits((prev) => [habit, ...prev]), [setHabits])
  const onToggleHabitDone = useCallback((habitId, dateISO) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h
        const set = new Set(h.completedDates ?? [])
        if (set.has(dateISO)) set.delete(dateISO)
        else set.add(dateISO)
        return { ...h, completedDates: [...set] }
      }),
    )
  }, [setHabits])
  const onDeleteHabit = useCallback((habitId) => setHabits((prev) => prev.filter((h) => h.id !== habitId)), [setHabits])
  const onClearHabitHistory = useCallback((habitId) => {
    setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, completedDates: [] } : h)))
  }, [setHabits])

  const onSettingsChange = useCallback(
    (next) => {
      setSettings(next)
      if (next.theme) setTheme(next.theme)
    },
    [setSettings, setTheme],
  )

  const onWeeklyGoalsChange = useCallback(
    (weeklyGoals) => onSettingsChange({ ...settings, weeklyGoals }),
    [settings, onSettingsChange],
  )

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) logout()
  }

  const goToSection = useCallback(
    (section) => navigate(section === 'dashboard' ? '/dashboard' : `/dashboard/${section}`),
    [navigate],
  )

  if (!user) return <div style={{ padding: '20px' }}>Error: User not found</div>

  return (
    <div className="flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-[var(--bg)] md:flex-row">
      <aside className="flex w-full shrink-0 flex-col gap-4 overflow-visible border-b border-[var(--border)] bg-[var(--card)] px-3.5 py-3.5 shadow-[inset_0_-1px_0_var(--border)] md:h-svh md:w-[280px] md:basis-[280px] md:overflow-y-auto md:border-r md:border-b-0 md:px-5 md:py-6 md:shadow-[inset_-1px_0_0_var(--border)]">
        <div>
          <h2 className="mb-2 text-base font-bold text-[var(--text-h)] md:text-lg">Smart Task Manager</h2>
          <p className="m-0 text-[13px] text-[var(--text)]">Hi, {user.name || 'User'}!</p>
          {syncStatus === 'synced' ? (
            <p className="m-0 mt-1 text-[11px] text-[var(--accent)]">☁️ Synced</p>
          ) : syncStatus === 'offline' ? (
            <p className="m-0 mt-1 text-[11px] opacity-70">Offline mode</p>
          ) : null}
        </div>

        <nav
          className="flex flex-row gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] md:mb-6 md:flex-1 md:flex-col md:gap-1.5 md:overflow-x-visible md:pb-0"
          aria-label="Dashboard navigation"
        >
          {DASHBOARD_SECTIONS.map((item) => (
            <NavLink
              key={item.id}
              to={item.path ? `/dashboard/${item.path}` : '/dashboard'}
              end={item.id === 'dashboard'}
              className={({ isActive }) =>
                `shrink-0 whitespace-nowrap rounded-[10px] border px-3 py-2.5 text-left text-[13px] font-medium transition-all duration-200 md:px-3.5 md:py-3 md:text-sm ${
                  isActive
                    ? 'border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent)] font-semibold'
                    : 'border-transparent bg-transparent text-[var(--text)] hover:bg-[rgba(170,59,255,0.08)] hover:text-[var(--accent)] md:hover:translate-x-1'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="self-start rounded-[10px] border border-[rgba(244,67,54,0.2)] bg-[rgba(244,67,54,0.1)] px-3 py-2.5 text-[13px] font-semibold text-[#f44336] transition-all hover:border-[rgba(244,67,54,0.3)] hover:bg-[rgba(244,67,54,0.2)] md:w-full md:px-3.5 md:py-3 md:text-sm"
        >
          Logout
        </button>
      </aside>

      <main className="w-full min-w-0 flex-1 bg-[var(--bg)] px-3 py-3.5 md:overflow-auto md:p-8">
        <div className="mx-auto w-full max-w-[1400px] min-w-0">
          <Routes>
            <Route
              index
              element={
                <DashboardPage
                  todayISO={todayISO}
                  tasks={tasks}
                  habits={habits}
                  sessions={sessions}
                  bestHabitStreak={bestHabitStreak}
                  onNavigate={goToSection}
                />
              }
            />
            <Route
              path="tasks"
              element={
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
                  onToggleSubtask={onToggleSubtask}
                  onStartFocus={onStartFocus}
                />
              }
            />
            <Route
              path="habits"
              element={
                <HabitsPage
                  todayISO={todayISO}
                  habits={habits}
                  streakByHabitId={streakByHabitId}
                  onAddHabit={onAddHabit}
                  onToggleHabitDone={onToggleHabitDone}
                  onDeleteHabit={onDeleteHabit}
                  onClearHabitHistory={onClearHabitHistory}
                />
              }
            />
            <Route path="calendar" element={<CalendarPage tasks={tasks} todayISO={todayISO} />} />
            <Route
              path="pomodoro"
              element={
                <PomodoroPage
                  tasks={tasks}
                  pomodoroSettings={pomodoroSettings}
                  pomodoroState={pomodoroState}
                  setPomodoroState={setPomodoroState}
                  sessionsTodayCount={sessionsTodayCount}
                  onFocusSessionCompleted={onFocusSessionCompleted}
                />
              }
            />
            <Route
              path="analytics"
              element={<AnalyticsPage todayISO={todayISO} tasks={tasks} habits={habits} sessions={sessions} />}
            />
            <Route
              path="scheduler"
              element={
                <SchedulerPage
                  todayISO={todayISO}
                  tasks={tasks}
                  focusMinutesByTaskId={focusMinutesByTaskId}
                  smartSortEnabled={smartSortEnabled}
                  pomodoroSettings={pomodoroSettings}
                  onStartFocusForTask={onStartFocus}
                />
              }
            />
            <Route
              path="goals"
              element={
                <GoalsPage
                  tasks={tasks}
                  habits={habits}
                  sessions={sessions}
                  weeklyGoals={settings.weeklyGoals ?? DEFAULT_WEEKLY_GOALS}
                  onWeeklyGoalsChange={onWeeklyGoalsChange}
                />
              }
            />
            <Route
              path="achievements"
              element={
                <AchievementsPage
                  tasks={tasks}
                  habits={habits}
                  sessions={sessions}
                  todayISO={todayISO}
                  weeklyProgress={weeklyProgress}
                />
              }
            />
            <Route path="team" element={<TeamPage />} />
            <Route
              path="settings"
              element={
                <SettingsPage
                  tasks={tasks}
                  habits={habits}
                  sessions={sessions}
                  syncStatus={syncStatus}
                  onSyncNow={onSyncNow}
                  settings={settings}
                  onSettingsChange={onSettingsChange}
                  todayISO={todayISO}
                />
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
