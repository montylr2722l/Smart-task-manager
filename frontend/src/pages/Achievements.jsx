import { useMemo } from 'react'
import { Trophy } from 'lucide-react'
import { Card, Pill } from '../components/ui'
import { ACHIEVEMENTS, computeUnlockedAchievements } from '../lib/achievements'

export default function AchievementsPage({
  tasks,
  habits,
  sessions,
  todayISO,
  weeklyProgress,
}) {
  const unlocked = useMemo(
    () => new Set(computeUnlockedAchievements({ tasks, habits, sessions, todayISO, weeklyProgress })),
    [tasks, habits, sessions, todayISO, weeklyProgress],
  )

  const unlockedCount = ACHIEVEMENTS.filter((a) => unlocked.has(a.id)).length

  return (
    <div className="stm-stack">
      <div className="stm-page-head">
        <div>
          <div className="stm-page-title">Achievements</div>
          <div className="stm-page-sub">
            Earn badges by completing tasks, habits, and focus sessions.
          </div>
        </div>
        <Pill tone="good">
          <Trophy size={14} /> {unlockedCount} / {ACHIEVEMENTS.length}
        </Pill>
      </div>

      <div className="stm-grid stm-grid-3">
        {ACHIEVEMENTS.map((a) => {
          const isUnlocked = unlocked.has(a.id)
          return (
            <Card key={a.id} className={isUnlocked ? '' : 'stm-card-muted'}>
              <div className="stm-flex stm-gap-12 stm-align-center">
                <span style={{ fontSize: '2rem', opacity: isUnlocked ? 1 : 0.35 }}>{a.icon}</span>
                <div>
                  <div className="stm-card-title">{a.title}</div>
                  <div className="stm-field-hint">{a.desc}</div>
                  <Pill tone={isUnlocked ? 'good' : 'neutral'} className="stm-mt-8">
                    {isUnlocked ? 'Unlocked' : 'Locked'}
                  </Pill>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
