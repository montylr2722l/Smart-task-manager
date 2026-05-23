const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const LS_TOKEN_KEY = 'stm_auth_token'

export function getToken() {
  return localStorage.getItem(LS_TOKEN_KEY)
}

export async function authFetch(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }
  return data
}

export { API_BASE_URL }
