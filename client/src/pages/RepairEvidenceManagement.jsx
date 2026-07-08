import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wrench, Eye, Search, Filter } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchRepairCases } from '../api/reports'
import styles from './RepairEvidenceManagement.module.css'

const STATUS_FILTERS = [
  { key: '', label: 'All' },
  { key: 'in_progress', label: 'In Repair' },
  { key: 'needs_manual_review', label: 'Needs Review' },
  { key: 'verified_repaired', label: 'Verified Repaired' },
]

function fmtDate(iso) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const STATUS_COLORS = {
  in_progress: 'badge-pending',
  evidence_submitted: 'badge-verified',
  needs_manual_review: 'badge-rejected',
  ai_verified: 'badge-verified',
  verified_repaired: 'badge-resolved',
}

export default function RepairEvidenceManagement() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchRepairCases(filter)
      .then(data => setCases(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filter])

  const filtered = cases.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.repairId?.toLowerCase().includes(q) ||
      c.infrastructureId?.toLowerCase().includes(q) ||
      c.reportId?.toLowerCase().includes(q) ||
      c.assignedAuthority?.toLowerCase().includes(q)
    )
  })

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Repair Evidence Management</h2>
          <p className={styles.subtitle}>
            Authorities manage all completed repairs here. Upload evidence for AI validation.
          </p>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search by Repair ID, Infra ID, Report ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f.key}
              className={`${styles.filterBtn} ${filter === f.key ? styles.filterActive : ''}`}
              onClick={() => { setFilter(f.key); setLoading(true) }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`card ${styles.tableCard}`}>
        {loading ? (
          <div className={styles.empty}>Loading repair cases...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>No repair cases found.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Repair ID</th>
                <th>Infra ID</th>
                <th>Report ID</th>
                <th>Type</th>
                <th>Area</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Started</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c._id} className={styles.row}>
                  <td className="mono">{c.repairId}</td>
                  <td className="mono">{c.infrastructureId}</td>
                  <td className="mono">{c.reportId}</td>
                  <td>{c.type || '-'}</td>
                  <td>{c.area || '-'}</td>
                  <td>
                    <span className={`badge ${STATUS_COLORS[c.repairStatus] || 'badge-pending'}`}>
                      {c.repairStatus?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>{c.assignedAuthority}</td>
                  <td className={styles.dateCell}>{fmtDate(c.startedAt)}</td>
                  <td>
                    <button
                      className={styles.viewBtn}
                      onClick={() => navigate(`/admin/repair/${c.repairId}`)}
                    >
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
