import { useMemo } from 'react'
import { Target, CheckCircle2, Flame, Timer } from 'lucide-react'
import { Card, Pill, ProgressBar } from '../components/ui'
import { computeWeeklyProgress } from '../lib/weeklyGoals'

export default function GoalsPage({
  tasks,
  habits,
  sessions,
  weeklyGoals,
  onWeeklyGoalsChange,
}) {
  const progress = useMemo(
    () => computeWeeklyProgress(tasks, habits, sessions, weeklyGoals),
    [tasks, habits, sessions, weeklyGoals],
  )

  const updateGoal = (key, value) => {
    const num = Math.max(1, Math.round(Number(value)))
    onWeeklyGoalsChange({ ...weeklyGoals, [key]: num })
  }

  return (
    <div className="stm-stack">
      <div className="stm-page-head">
        <div>
          <div className="stm-page-title">Weekly Goals</div>
          <div className="stm-page-sub">Set targets and track progress this week.</div>
        </div>
        {progress.allMet ? <Pill tone="good"><CheckCircle2 size={14} /> All goals met!</Pill> : null}
      </div>

      <div className="stm-grid stm-grid-3">
        <GoalCard
          icon={<Target size={18} />}
          label="Tasks completed"
          current={progress.tasksDone}
          target={progress.goals.tasksTarget}
          met={progress.tasksMet}
          onTargetChange={(v) => updateGoal('tasksTarget', v)}
        />
        <GoalCard
          icon={<Flame size={18} />}
          label="Habit check-ins"
          current={progress.habitCompletions}
          target={progress.goals.habitsTarget}
          met={progress.habitsMet}
          onTargetChange={(v) => updateGoal('habitsTarget', v)}
        />
        <GoalCard
          icon={<Timer size={18} />}
          label="Focus minutes"
          current={progress.focusMinutes}
          target={progress.goals.focusMinutesTarget}
          met={progress.focusMet}
          onTargetChange={(v) => updateGoal('focusMinutesTarget', v)}
        />
      </div>

      <Card>
        <div className="stm-card-title stm-mb-12">Weekly report</div>
        <p className="stm-muted">
          This week you completed <strong>{progress.tasksDone}</strong> tasks,
          logged <strong>{progress.habitCompletions}</strong> habit check-ins, and
          focused for <strong>{progress.focusMinutes}</strong> minutes.
        </p>
      </Card>
    </div>
  )
}

function GoalCard({ icon, label, current, target, met, onTargetChange }) {
  const pct = Math.min(100, Math.round((current / target) * 100))
  return (
    <Card>
      <div className="stm-card-top">
        <div className="stm-card-title">{icon} {label}</div>
        <Pill tone={met ? 'good' : 'info'}>{current} / {target}</Pill>
      </div>
      <ProgressBar value01={pct / 100} label={`${label} progress`} />
      <div className="stm-mt-12 stm-flex stm-gap-8 stm-align-center">
        <span className="stm-field-hint">Target:</span>
        <input
          type="number"
          min={1}
          className="stm-input"
          style={{ width: 72 }}
          value={target}
          onChange={(e) => onTargetChange(e.target.value)}
        />
      </div>
    </Card>
  )
}
