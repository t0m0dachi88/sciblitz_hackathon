const API_BASE = '/api/reports'

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

export async function confirmReport(data) {
  const res = await fetch(`${API_BASE}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to save report')
  return res.json()
}
