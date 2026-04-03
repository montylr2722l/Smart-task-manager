import { useEffect, useMemo, useState } from 'react'

function safeParseJSON(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

export function useLocalStorageState(key, initialValue) {
  const initial = useMemo(() => {
    if (typeof window === 'undefined') return initialValue
    const existing = window.localStorage.getItem(key)
    if (existing == null) return typeof initialValue === 'function' ? initialValue() : initialValue
    const parsed = safeParseJSON(existing)
    return parsed ?? initialValue
  }, [initialValue, key])

  const [value, setValue] = useState(initial)

  useEffect(() => {
    // Persist synchronously enough for a productivity app feel.
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

export function createId(prefix = 'id') {
  // crypto.randomUUID is supported in modern browsers; fallback keeps older environments working.
  const uuid =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${uuid}`
}

