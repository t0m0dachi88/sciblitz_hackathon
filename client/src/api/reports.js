const API_BASE = 'https://sciblitz-hackathon-backend.onrender.com/api/reports'
const AUTH_BASE = 'https://sciblitz-hackathon-backend.onrender.com/api/auth'
const AREAS_BASE = 'https://sciblitz-hackathon-backend.onrender.com/api/areas'

function authHeaders() {
  const token = localStorage.getItem('ncdn_token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

export async function fetchReports(filters = {}) {
  const params = new URLSearchParams()
  if (filters.status) params.set('status', filters.status)
  if (filters.thana) params.set('thana', filters.thana)
  if (filters.severity) params.set('severity', filters.severity)
  if (filters.all) params.set('all', 'true')
  const qs = params.toString()
  const res = await fetch(qs ? `${API_BASE}?${qs}` : API_BASE, {
    headers: { ...authHeaders() }
  })
  if (!res.ok) throw new Error('Failed to fetch reports')
  return res.json()
}

export async function fetchReportById(id) {
  const res = await fetch(`${API_BASE}/${id}`)
  if (!res.ok) throw new Error('Failed to fetch report')
  return res.json()
}

export async function fetchStats(filters = {}) {
  const params = new URLSearchParams()
  if (filters.all) params.set('all', 'true')
  const qs = params.toString()
  const res = await fetch(qs ? `${API_BASE}/stats?${qs}` : `${API_BASE}/stats`, {
    headers: { ...authHeaders() }
  })
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function updateReport(id, data) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update report')
  return res.json()
}

export async function signup(data) {
  const res = await fetch(`${AUTH_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Signup failed')
  return json
}

export async function getMe() {
  const token = localStorage.getItem('ncdn_token')
  if (!token) return null
  const res = await fetch(`${AUTH_BASE}/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) return null
  const json = await res.json()
  return json.user
}

export async function fetchMyReports() {
  const token = localStorage.getItem('ncdn_token')
  const res = await fetch(`${API_BASE}/mine`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to fetch your reports')
  return res.json()
}

export async function analyzeImage(imageFile, address = '') {
  const formData = new FormData()
  formData.append('image', imageFile)
  if (address) formData.append('address', address)
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(err?.details || err?.error || 'Failed to analyze image')
  }
  return res.json()
}

export async function fetchAreaProfiles() {
  const res = await fetch(`${AREAS_BASE}/profiles`)
  if (!res.ok) throw new Error('Failed to fetch area profiles')
  return res.json()
}

export async function fetchAreaProfile(thana) {
  const res = await fetch(`${AREAS_BASE}/profiles/${encodeURIComponent(thana)}`)
  if (!res.ok) throw new Error('Failed to fetch area profile')
  return res.json()
}

export async function fetchLeaderboard() {
  const res = await fetch(`${AREAS_BASE}/leaderboard`)
  if (!res.ok) throw new Error('Failed to fetch leaderboard')
  return res.json()
}

export async function generateAreaReport(thana) {
  const res = await fetch(`${AREAS_BASE}/report/${encodeURIComponent(thana)}`, {
    method: 'POST',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error('Failed to generate report')
  return res.json()
}

export async function confirmReport(data) {
  const res = await fetch(`${API_BASE}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to save report')
  return res.json()
}
