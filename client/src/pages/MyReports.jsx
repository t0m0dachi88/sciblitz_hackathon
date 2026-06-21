import { useState, useEffect } from 'react'
import { Inbox, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { fetchMyReports } from '../api/reports'
import styles from './MyReports.module.css'

function fmtTime(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' +
         d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

const STATUS_ICONS = {
  pending:  Clock,
  verified: CheckCircle,
  rejected: XCircle,
  resolved: CheckCircle,
}

export default function MyReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMyReports()
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.page}>
      <div className="card">
        <div className={styles.header}>
          <p className={styles.headerTitle}>Your Submitted Reports</p>
          <p className={styles.headerSub}>{reports.length} report{reports.length !== 1 ? 's' : ''} total</p>
        </div>

        {loading ? (
          <div className={styles.empty}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading your reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className={styles.empty}>
            <Inbox size={24} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>No reports yet</p>
            <p className={styles.emptySub}>Reports you submit will appear here with their current status.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {reports.map(r => {
              const Icon = STATUS_ICONS[r.status] || Clock
              const statusColor = r.status === 'verified' || r.status === 'resolved' ? '#22c55e' : r.status === 'rejected' ? '#ef4444' : '#eab308'
              return (
                <div key={r._id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <span className={styles.cardId}>{r._id.slice(-6).toUpperCase()}</span>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </div>
                  <p className={styles.cardCategory}>{r.category}{r.damageType ? ` — ${r.damageType}` : ''}</p>
                  <p className={styles.cardThana}>{r.thana}</p>
                  {r.description && <p className={styles.cardDesc}>{r.description}</p>}
                  <div className={styles.cardFooter}>
                    <span className={styles.cardTime}>{fmtTime(r.createdAt)}</span>
                    <span className={styles.cardStatus} style={{ color: statusColor }}>
                      <Icon size={11} /> {r.status === 'pending' ? 'Awaiting review' : r.status === 'verified' ? 'Verified by authority' : r.status === 'resolved' ? 'Resolved' : 'Rejected'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
