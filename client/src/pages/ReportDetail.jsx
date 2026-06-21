import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Clock, AlertTriangle, CheckCircle, XCircle, RotateCcw, ShieldCheck, User } from 'lucide-react'
import { fetchReportById } from '../api/reports'
import styles from './ReportDetail.module.css'

const STATUS_CONFIG = {
  pending:  { icon: Clock,        label: 'Pending — Awaiting Review',    color: '#eab308' },
  verified: { icon: CheckCircle,  label: 'Verified by Authority',        color: '#22c55e' },
  resolved: { icon: RotateCcw,    label: 'Resolved',                     color: '#3b82f6' },
  rejected: { icon: XCircle,      label: 'Rejected',                     color: '#ef4444' },
}

function fmtTime(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' +
         d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function ReportDetail() {
  const { id } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReportById(id)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading report...</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className={styles.page}>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <AlertTriangle size={20} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Report not found.</p>
          <Link to="/priority" style={{ color: 'var(--accent)', fontSize: 12, marginTop: 8, display: 'inline-block' }}>Back to Priority List</Link>
        </div>
      </div>
    )
  }

  const StatusIcon = STATUS_CONFIG[report.status]?.icon || Clock
  const sevColor = report.severityLevel === 'Critical' ? '#ef4444' : report.severityLevel === 'High' ? '#f97316' : report.severityLevel === 'Medium' ? '#eab308' : '#3b82f6'

  return (
    <div className={styles.page}>
      <Link to="/priority" className={styles.backLink}>
        <ArrowLeft size={13} /> Back to Priority List
      </Link>

      <div className={styles.grid}>
        {/* Main card */}
        <div className={`card ${styles.mainCard}`}>
          <div className={styles.topRow}>
            <span className={styles.reportId}>{report._id.slice(-6).toUpperCase()}</span>
            <span className={`badge badge-${report.status}`} style={{ fontSize: 11 }}>{report.status}</span>
          </div>

          <div className={styles.titleRow}>
            <span className={styles.damageType}>{report.damageType || report.category}</span>
            <span className={`badge`} style={{ background: `${sevColor}22`, color: sevColor, border: `1px solid ${sevColor}44` }}>
              {report.severityLevel}
            </span>
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <MapPin size={11} />
              <span>{report.thana}</span>
            </div>
            <div className={styles.metaItem}>
              <Clock size={11} />
              <span>{fmtTime(report.createdAt)}</span>
            </div>
            {report.userId && (
              <div className={styles.metaItem}>
                <User size={11} />
                <span>Citizen reported</span>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <p className={styles.sectionTitle}>Description</p>
            <p className={styles.description}>{report.description || report.aiExplanation || 'No description provided.'}</p>
          </div>

          <div className={styles.section}>
            <p className={styles.sectionTitle}>AI Analysis</p>
            <div className={styles.aiCard}>
              <p className={styles.aiLabel}>Damage Type</p>
              <p className={styles.aiValue}>{report.damageType || report.category}</p>
              <p className={styles.aiLabel}>Assessment</p>
              <p className={styles.aiValue}>{report.aiExplanation}</p>
            </div>
          </div>

          {report.adminNote && (
            <div className={styles.section}>
              <p className={styles.sectionTitle}>Admin Note</p>
              <div className={styles.adminNote}>
                <ShieldCheck size={11} />
                <span>{report.adminNote}</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={`card ${styles.scoreCard}`}>
            <p className={styles.scoreLabel}>Priority Score</p>
            <p className={styles.scoreValue} style={{ color: report.priorityScore >= 80 ? '#ef4444' : report.priorityScore >= 60 ? '#f97316' : report.priorityScore >= 40 ? '#eab308' : '#3b82f6' }}>
              {report.priorityScore ?? '—'}
            </p>
            <span className={`badge badge-${(report.priorityTier || 'low').toLowerCase()}`}>{report.priorityTier || 'Low'}</span>
          </div>

          <div className={`card ${styles.statusCard}`}>
            <p className={styles.statusLabel}>Status</p>
            <div className={styles.statusRow}>
              <StatusIcon size={14} style={{ color: STATUS_CONFIG[report.status]?.color }} />
              <span style={{ color: STATUS_CONFIG[report.status]?.color, fontWeight: 600 }}>
                {STATUS_CONFIG[report.status]?.label || report.status}
              </span>
            </div>
            <div className={styles.statusTimeline}>
              <div className={styles.timelineItem}>
                <span className={styles.timelineDot} style={{ background: '#eab308' }} />
                <span>Submitted — {fmtTime(report.createdAt)}</span>
              </div>
              {report.status !== 'pending' && (
                <div className={styles.timelineItem}>
                  <span className={styles.timelineDot} style={{ background: report.status === 'rejected' ? '#ef4444' : '#22c55e' }} />
                  <span>{report.status === 'verified' ? 'Verified' : report.status === 'resolved' ? 'Verified then Resolved' : 'Rejected'}</span>
                </div>
              )}
            </div>
          </div>

          <div className={`card ${styles.locationCard}`}>
            <p className={styles.locationTitle}>Location</p>
            <p className={styles.locationThana}>{report.thana}</p>
            {report.lat && report.lng && (
              <p className={styles.locationCoords}>Lat: {report.lat.toFixed(4)}, Lng: {report.lng.toFixed(4)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
