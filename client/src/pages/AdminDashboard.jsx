import { useState } from 'react'
import { CheckCircle, XCircle, Edit2, RotateCcw, ShieldCheck } from 'lucide-react'
import { MOCK_REPORTS, STATS } from '../data/mockReports'
import styles from './AdminDashboard.module.css'

const SEVERITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low']

function fmtTime(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminDashboard() {
  const [reports, setReports] = useState(
    [...MOCK_REPORTS].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  )
  const [selected,    setSelected]    = useState(null)
  const [editSev,     setEditSev]     = useState(null)
  const [adminNote,   setAdminNote]   = useState('')
  const [activeTab,   setActiveTab]   = useState('pending')

  const pending  = reports.filter(r => r.status === 'pending')
  const verified = reports.filter(r => r.status === 'verified')
  const rejected = reports.filter(r => r.status === 'rejected')
  const resolved = reports.filter(r => r.status === 'resolved')

  const tabReports = {
    pending, verified, rejected, resolved
  }[activeTab] ?? pending

  function updateStatus(id, status) {
    setReports(prev => prev.map(r =>
      r.id === id
        ? { ...r, status, severity: editSev ?? r.severity, adminNote: adminNote || r.adminNote }
        : r
    ))
    if (selected?.id === id) setSelected(null)
    setEditSev(null)
    setAdminNote('')
  }

  function selectReport(r) {
    setSelected(r)
    setEditSev(r.severity)
    setAdminNote(r.adminNote ?? '')
  }

  const systemStats = {
    total:    reports.length,
    pending:  pending.length,
    verified: verified.length,
    rejected: rejected.length,
    resolved: resolved.length,
    rate: reports.length > 0
      ? Math.round(((verified.length + resolved.length) / reports.length) * 100)
      : 0,
  }

  return (
    <div className={styles.page}>
      {/* Auth notice */}
      <div className={styles.authBanner}>
        <ShieldCheck size={13} />
        <span>Authority Access — Simulated Mode. All actions update local state only. Supabase integration in Phase 4.</span>
      </div>

      {/* System stats row */}
      <div className={styles.statsRow}>
        {[
          { label: 'Total',    val: systemStats.total,    cls: '' },
          { label: 'Pending',  val: systemStats.pending,  cls: styles.statYellow },
          { label: 'Verified', val: systemStats.verified, cls: styles.statGreen },
          { label: 'Rejected', val: systemStats.rejected, cls: styles.statRed },
          { label: 'Resolved', val: systemStats.resolved, cls: styles.statBlue },
          { label: 'Resolution Rate', val: `${systemStats.rate}%`, cls: '' },
        ].map(({ label, val, cls }) => (
          <div key={label} className={`card ${styles.statBox}`}>
            <span className={styles.statLabel}>{label}</span>
            <span className={`${styles.statValue} ${cls}`}>{val}</span>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className={styles.grid}>
        {/* Queue */}
        <div className={`card ${styles.queueCard}`}>
          {/* Tabs */}
          <div className={styles.tabs}>
            {[
              { key: 'pending',  label: `Pending (${pending.length})` },
              { key: 'verified', label: `Verified (${verified.length})` },
              { key: 'rejected', label: `Rejected (${rejected.length})` },
              { key: 'resolved', label: `Resolved (${resolved.length})` },
            ].map(t => (
              <button
                key={t.key}
                className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
                onClick={() => { setActiveTab(t.key); setSelected(null) }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Queue table */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Thana</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Reports</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {tabReports.map(r => (
                  <tr
                    key={r.id}
                    className={`${styles.row} ${selected?.id === r.id ? styles.rowSelected : ''}`}
                    onClick={() => selectReport(r)}
                  >
                    <td className="mono">{r.id}</td>
                    <td>{r.thana}</td>
                    <td>{r.category}</td>
                    <td><span className={`badge badge-${r.severity.toLowerCase()}`}>{r.severity}</span></td>
                    <td className={styles.monoCell}>{r.reportCount}</td>
                    <td className={`${styles.timeCell} mono`}>{fmtTime(r.createdAt)}</td>
                  </tr>
                ))}
                {tabReports.length === 0 && (
                  <tr><td colSpan={6} className={styles.emptyCell}>No reports in this category.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Panel */}
        <div className={styles.actionCol}>
          {selected ? (
            <div className={`card ${styles.actionCard}`}>
              <p className={styles.actionTitle}>Report Review</p>

              <div className={styles.reportMeta}>
                <div className={styles.metaRow}>
                  <span className={styles.metaKey}>ID</span>
                  <span className="mono" style={{ fontSize: 12 }}>{selected.id}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaKey}>Category</span>
                  <span className={styles.metaVal}>{selected.category}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaKey}>Thana</span>
                  <span className={styles.metaVal}>{selected.thana}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaKey}>Current Status</span>
                  <span className={`badge badge-${selected.status}`}>{selected.status}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className={styles.metaKey}>Citizen Reports</span>
                  <span className={styles.metaVal}>{selected.reportCount}</span>
                </div>
              </div>

              <div className={styles.divider} />

              <p className={styles.aiLabel}>AI Analysis</p>
              <p className={styles.aiDamageType}>{selected.damageType}</p>
              <p className={styles.aiExplanation}>{selected.explanation}</p>

              <div className={styles.divider} />

              <label className="label" htmlFor="sev-override">Override AI Severity</label>
              <select
                id="sev-override"
                className="select"
                value={editSev ?? selected.severity}
                onChange={e => setEditSev(e.target.value)}
                style={{ marginBottom: 14 }}
              >
                {SEVERITY_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <label className="label" htmlFor="admin-note">Admin Notes</label>
              <textarea
                id="admin-note"
                className="textarea"
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="Add verification notes or rejection reason..."
                rows={3}
                style={{ marginBottom: 16 }}
              />

              <div className={styles.actionBtns}>
                {selected.status === 'pending' && (
                  <>
                    <button
                      className={styles.btnApprove}
                      onClick={() => updateStatus(selected.id, 'verified')}
                    >
                      <CheckCircle size={13} /> Verify Report
                    </button>
                    <button
                      className={styles.btnReject}
                      onClick={() => updateStatus(selected.id, 'rejected')}
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  </>
                )}
                {selected.status === 'verified' && (
                  <button
                    className={styles.btnResolve}
                    onClick={() => updateStatus(selected.id, 'resolved')}
                  >
                    <RotateCcw size={13} /> Mark Resolved
                  </button>
                )}
                {selected.status === 'rejected' && (
                  <button
                    className={styles.btnApprove}
                    onClick={() => updateStatus(selected.id, 'verified')}
                  >
                    <CheckCircle size={13} /> Re-Verify
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={`card ${styles.emptyAction}`}>
              <Edit2 size={16} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No report selected</p>
              <p className={styles.emptySub}>Click a row from the queue to review and take action.</p>
            </div>
          )}

          {/* Guidelines card */}
          <div className={`card ${styles.guideCard}`}>
            <p className={styles.guideTitle}>Verification Guidelines</p>
            <ul className={styles.guideList}>
              <li>Cross-check report image with description before verifying.</li>
              <li>Override AI severity only when field assessment differs significantly.</li>
              <li>Add notes for all rejected reports to guide the citizen.</li>
              <li>Mark "Resolved" only after physical repair has been confirmed.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
