import { useEffect, useState } from 'react'
import { Users, Plus, Link2, CheckCircle2 } from 'lucide-react'
import { Card, Button, Field, TextInput, Pill, IconButton } from '../components/ui'
import { authFetch } from '../lib/api'
import { createId } from '../lib/useLocalStorageState'

export default function TeamPage() {
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [selectedCode, setSelectedCode] = useState(null)

  const loadLists = async () => {
    try {
      const res = await authFetch('/api/shared')
      setLists(res.lists ?? [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadLists() }, [])

  const createList = async () => {
    if (!newName.trim()) return
    try {
      const res = await authFetch('/api/shared', {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim() }),
      })
      setLists((prev) => [res.list, ...prev])
      setNewName('')
      setSelectedCode(res.list.code)
    } catch (e) {
      setError(e.message)
    }
  }

  const joinList = async () => {
    if (!joinCode.trim()) return
    try {
      const res = await authFetch('/api/shared/join', {
        method: 'POST',
        body: JSON.stringify({ code: joinCode.trim() }),
      })
      setLists((prev) => {
        const exists = prev.some((l) => l.code === res.list.code)
        return exists ? prev.map((l) => (l.code === res.list.code ? res.list : l)) : [res.list, ...prev]
      })
      setJoinCode('')
      setSelectedCode(res.list.code)
    } catch (e) {
      setError(e.message)
    }
  }

  const selected = lists.find((l) => l.code === selectedCode)

  const addSharedTask = async () => {
    if (!selected) return
    const task = {
      id: createId('shared'),
      title: 'New shared task',
      status: 'open',
      priority: 'medium',
      createdAt: Date.now(),
    }
    const tasks = [task, ...(selected.tasks ?? [])]
    try {
      const res = await authFetch(`/api/shared/${selected.code}/tasks`, {
        method: 'PUT',
        body: JSON.stringify({ tasks }),
      })
      setLists((prev) => prev.map((l) => (l.code === res.list.code ? res.list : l)))
    } catch (e) {
      setError(e.message)
    }
  }

  const toggleTask = async (taskId) => {
    if (!selected) return
    const tasks = (selected.tasks ?? []).map((t) =>
      t.id === taskId
        ? { ...t, status: t.status === 'done' ? 'open' : 'done' }
        : t,
    )
    try {
      const res = await authFetch(`/api/shared/${selected.code}/tasks`, {
        method: 'PUT',
        body: JSON.stringify({ tasks }),
      })
      setLists((prev) => prev.map((l) => (l.code === res.list.code ? res.list : l)))
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) return <div className="stm-muted">Loading team lists...</div>

  return (
    <div className="stm-stack">
      <div className="stm-page-head">
        <div>
          <div className="stm-page-title">Team Lists</div>
          <div className="stm-page-sub">Share tasks with family or teammates via a code.</div>
        </div>
      </div>

      {error ? <Pill tone="warn">{error}</Pill> : null}

      <div className="stm-grid stm-grid-2">
        <Card>
          <div className="stm-card-title stm-mb-12"><Plus size={18} /> Create list</div>
          <Field label="List name">
            <TextInput value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Family chores" />
          </Field>
          <Button variant="primary" className="stm-mt-12" onClick={createList}>Create</Button>
        </Card>
        <Card>
          <div className="stm-card-title stm-mb-12"><Link2 size={18} /> Join with code</div>
          <Field label="Share code">
            <TextInput value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="ABC123" />
          </Field>
          <Button variant="secondary" className="stm-mt-12" onClick={joinList}>Join</Button>
        </Card>
      </div>

      <Card>
        <div className="stm-card-title stm-mb-12"><Users size={18} /> Your lists</div>
        {lists.length === 0 ? (
          <p className="stm-muted">No shared lists yet. Create or join one above.</p>
        ) : (
          <div className="stm-flex stm-gap-8 stm-wrap stm-mb-12">
            {lists.map((l) => (
              <Button
                key={l.code}
                variant={selectedCode === l.code ? 'primary' : 'secondary'}
                onClick={() => setSelectedCode(l.code)}
              >
                {l.name} ({l.code})
              </Button>
            ))}
          </div>
        )}
        {selected ? (
          <>
            <Pill tone="info">Members: {selected.members?.length ?? 1}</Pill>
            <Button variant="primary" className="stm-mt-12" onClick={addSharedTask}>
              <Plus size={16} /> Add task
            </Button>
            <ul className="stm-list-plain stm-mt-12">
              {(selected.tasks ?? []).map((t) => (
                <li key={t.id} className="stm-flex stm-justify-between stm-align-center stm-mt-8">
                  <span style={{ textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</span>
                  <IconButton onClick={() => toggleTask(t.id)} aria-label="Toggle done">
                    <CheckCircle2 size={16} />
                  </IconButton>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </Card>
    </div>
  )
}
