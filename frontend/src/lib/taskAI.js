import { createId } from './useLocalStorageState'

const TEMPLATES = {
  exam: ['Review syllabus', 'Make study notes', 'Practice past papers', 'Take mock test', 'Final revision'],
  project: ['Define requirements', 'Create outline', 'Build first draft', 'Review & edit', 'Submit / deliver'],
  workout: ['Warm up', 'Main workout', 'Cool down', 'Log progress'],
  meeting: ['Prepare agenda', 'Gather materials', 'Attend meeting', 'Send follow-up notes'],
  default: ['Research & plan', 'Break into steps', 'Execute main work', 'Review & finish'],
}

function detectCategory(title) {
  const t = title.toLowerCase()
  if (/exam|test|study|padhai|पढ़ाई/.test(t)) return 'exam'
  if (/project|report|assignment|build|website|app/.test(t)) return 'project'
  if (/workout|gym|exercise|yoga|fitness/.test(t)) return 'workout'
  if (/meeting|call|interview|presentation/.test(t)) return 'meeting'
  return 'default'
}

export function suggestSubtasks(title, estimateMin = null) {
  const category = detectCategory(title)
  const steps = TEMPLATES[category] ?? TEMPLATES.default
  const perStep = estimateMin ? Math.max(5, Math.round(estimateMin / steps.length)) : null

  return steps.map((stepTitle, i) => ({
    id: createId('sub'),
    title: stepTitle,
    done: false,
    estimateMin: perStep,
    order: i,
  }))
}

export function parseTagsInput(raw) {
  return String(raw || '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8)
}
