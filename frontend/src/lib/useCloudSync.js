import { useEffect, useRef } from 'react'
import { authFetch, getToken } from './api'

export function useCloudSync(userId, payload, { enabled = true } = {}) {
  const skipNextSync = useRef(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!enabled || !userId || !getToken()) return

    let cancelled = false

    async function pull() {
      try {
        const res = await authFetch('/api/data')
        if (cancelled || !res.data) return
        skipNextSync.current = true
        payload.onRemoteData?.(res.data)
      } catch {
        // offline or API down — local data still works
      }
    }

    pull()
    return () => { cancelled = true }
  }, [userId, enabled])

  useEffect(() => {
    if (!enabled || !userId || !getToken()) return
    if (skipNextSync.current) {
      skipNextSync.current = false
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        await authFetch('/api/data', {
          method: 'PUT',
          body: JSON.stringify(payload.data),
        })
        payload.onSyncSuccess?.()
      } catch {
        payload.onSyncError?.()
      }
    }, 1500)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [userId, enabled, payload.data, payload.onSyncSuccess, payload.onSyncError])
}
