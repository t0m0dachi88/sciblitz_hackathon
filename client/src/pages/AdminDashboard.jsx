import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Edit2, RotateCcw, ShieldCheck, LogOut, Wrench, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchReports, updateReport, createRepairCase, fetchRepairCases } from '../api/reports'
import styles from './AdminDashboard.module.css'

const SEVERITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low']
const SEVERITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 }

const SORT_OPTIONS = [
  { key: 'date-desc',  label: 'Newest First',    by: 'date',  dir: 'desc' },
  { key: 'date-asc',   label: 'Oldest First',    by: 'date',  dir: 'asc' },
  { key: 'sev-desc',   label: 'Severity (High→Low)', by: 'severity', dir: 'desc' },
  { key: 'sev-asc',    label: 'Severity (Low→High)', by: 'severity', dir: 'asc' },
  { key: 'priority-desc', label: 'Priority (High→Low)', by: 'priority', dir: 'desc' },
  { key: 'priority-asc',  label: 'Priority (Low→High)', by: 'priority', dir: 'asc' },
]

function fmtTime(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function AdminDashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected,    setSelected]    = useState(null)
  const [editSev,     setEditSev]     = useState(null)
  const [adminNote,   setAdminNote]   = useState('')
  const [activeTab,   setActiveTab]   = useState('pending')
  const [sortBy, setSortBy] = useState('date-desc')
  const [startingRepair, setStartingRepair] = useState(false)

  useEffect(() => {
    fetchReports({ all: true })
      .then(data => setReports(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const pending  = reports.filter(r => r.status === 'pending')
  const verified = reports.filter(r => r.status === 'verified')
  const inRepair = reports.filter(r => r.status === 'in_repair')
  const needsReview = reports.filter(r => r.status === 'needs_manual_review' || r.status === 'false_report')
  const repaired = reports.filter(r => r.status === 'repaired' || r.status === 'resolved')
  const rejected = reports.filter(r => r.status === 'rejected')

  const tabReports = {
    pending, verified, inRepair, needsReview, repaired, rejected
  }[activeTab] ?? pending

  const sortedReports = useMemo(() => {
    const opt = SORT_OPTIONS.find(o => o.key === sortBy) || SORT_OPTIONS[0]
    const arr = [...tabReports]
    arr.sort((a, b) => {
      let cmp = 0
      if (opt.by === 'date') {
        cmp = new Date(a.createdAt) - new Date(b.createdAt)
      } else if (opt.by === 'severity') {
        cmp = (SEVERITY_ORDER[a.severityLevel] ?? 4) - (SEVERITY_ORDER[b.severityLevel] ?? 4)
      } else if (opt.by === 'priority') {
        cmp = (a.priorityScore ?? 0) - (b.priorityScore ?? 0)
      }
      return opt.dir === 'desc' ? -cmp : cmp
    })
    return arr
  }, [tabReports, sortBy])

  async function updateStatus(id, status) {
    try {
      const updated = await updateReport(id, {
        status,
        severityLevel: editSev || undefined,
        adminNote: adminNote || undefined,
      })
      setReports(prev => prev.map(r => r._id === id ? updated.report : r))
      if (selected?._id === id) setSelected(null)
      setEditSev(null)
      setAdminNote('')
    } catch (error) {
      console.error('Failed to update report:', error)
    }
  }

  async function startRepair(report) {
    setStartingRepair(true)
    try {
      await createRepairCase({
        reportMongoId: report._id,
        reportId: report.reportId,
        infrastructureId: report.infrastructureId,
        assignedAuthority: 'Authority',
      })
      // Refresh reports
      const updated = await fetchReports({ all: true })
      setReports(updated)
      setSelected(null)
    } catch (err) {
      console.error('Failed to start repair:', err)
      alert('Failed to start repair: ' + err.message)
    } finally {
      setStartingRepair(false)
    }
  }

  function selectReport(r) {
    setSelected(r)
    setEditSev(r.severityLevel || r.severity)
    setAdminNote(r.adminNote ?? '')
  }

  const systemStats = {
    total:    reports.length,
    pending:  pending.length,
    verified: verified.length,
    inRepair: inRepair.length,
    repaired: repaired.length,
    rejected: rejected.length,
    rate: reports.length > 0
      ? Math.round(((verified.length + repaired.length) / reports.length) * 100)
      : 0,
  }

  return (
    <div className={styles.page}>
      {/* Auth notice */}
      <div className={styles.authBanner}>
        <ShieldCheck size={13} />
        <span>Authority Access — Live database. Admin actions update reports in MongoDB.</span>
        <button className={styles.logoutBtn} onClick={() => { logout(); navigate('/login') }}>
          <LogOut size={12} /> Logout
        </button>
      </div>

      {/* System stats row */}
      <div className={styles.statsRow}>
        {[
          { label: 'Total',    val: systemStats.total,    cls: '' },
          { label: 'Pending',  val: systemStats.pending,  cls: styles.statYellow },
          { label: 'Verified', val: systemStats.verified, cls: styles.statGreen },
          { label: 'In Repair', val: systemStats.inRepair, cls: styles.statBlue },
          { label: 'Repaired', val: systemStats.repaired, cls: styles.statGreen },
          { label: 'Rejected', val: systemStats.rejected, cls: styles.statRed },
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
              { key: 'inRepair', label: `In Repair (${inRepair.length})` },
              { key: 'needsReview', label: `Needs Review (${needsReview.length})` },
              { key: 'repaired', label: `Repaired (${repaired.length})` },
              { key: 'rejected', label: `Rejected (${rejected.length})` },
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

          {/* Sort controls */}
          <div className={styles.sortBar}>
            <ArrowUpDown size={12} className={styles.sortIcon} />
            <span className={styles.sortLabel}>Sort by:</span>
            {SORT_OPTIONS.map(o => (
              <button
                key={o.key}
                className={`${styles.sortBtn} ${sortBy === o.key ? styles.sortActive : ''}`}
                onClick={() => setSortBy(o.key)}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Queue table */}
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Report ID</th>
                  <th>Infra ID</th>
                  <th>Thana</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {sortedReports.map(r => (
                  <tr
                    key={r._id}
                    className={`${styles.row} ${selected?._id === r._id ? styles.rowSelected : ''}`}
                    onClick={() => selectReport(r)}
                  >
                    <td>
                      <span className={`badge badge-${(r.priorityTier || 'low').toLowerCase()}`}>
                        {r.priorityScore ?? '-'}
                      </span>
                    </td>
                    <td className="mono">{r.reportId || r._id.slice(-6).toUpperCase()}</td>
                    <td className="mono">{r.infrastructureId || '-'}</td>
                    <td>{r.thana}</td>
                    <td>{r.category}</td>
                    <td><span className={`badge badge-${(r.severityLevel || 'low').toLowerCase()}`}>{r.severityLevel}</span></td>
                    <td className={`${styles.timeCell} mono`}>{fmtTime(r.createdAt)}</td>
                  </tr>
                ))}
                {sortedReports.length === 0 && (
                  <tr><td colSpan={7} className={styles.emptyCell}>No reports in this category.</td></tr>
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
                  <span className={styles.metaKey}>Report ID</span>
                  <span className="mono" style={{ fontSize: 12 }}>{selected.reportId || selected._id.slice(-6).toUpperCase()}</span>
                </div>
                {selected.infrastructureId && (
                  <div className={styles.metaRow}>
                    <span className={styles.metaKey}>Infra ID</span>
                    <span className="mono" style={{ fontSize: 12 }}>{selected.infrastructureId}</span>
                  </div>
                )}
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
                  <span className={styles.metaKey}>Priority</span>
                  <span className={`badge badge-${(selected.priorityTier || 'low').toLowerCase()}`}>
                    {selected.priorityScore ?? '-'} — {selected.priorityTier || 'Low'}
                  </span>
                </div>
              </div>

              <div className={styles.divider} />

              <p className={styles.aiLabel}>AI Analysis</p>
              <p className={styles.aiDamageType}>{selected.damageType || selected.category}</p>
              <p className={styles.aiExplanation}>{selected.aiExplanation}</p>

              <div className={styles.divider} />

              <label className="label" htmlFor="sev-override">Override AI Severity</label>
              <select
                id="sev-override"
                className="select"
                value={editSev ?? selected.severityLevel}
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
                {['pending', 'rejected', 'false_report'].includes(selected.status) && (
                  <>
                    <button
                      className={styles.btnApprove}
                      onClick={() => updateStatus(selected._id, 'verified')}
                    >
                      <CheckCircle size={13} /> Verify Report
                    </button>
                    {selected.status === 'pending' && (
                      <button
                        className={styles.btnReject}
                        onClick={() => updateStatus(selected._id, 'rejected')}
                      >
                        <XCircle size={13} /> Reject
                      </button>
                    )}
                  </>
                )}
                {selected.status === 'verified' && (
                  <button
                    className={styles.btnResolve}
                    onClick={() => startRepair(selected)}
                    disabled={startingRepair}
                  >
                    <Wrench size={13} /> {startingRepair ? 'Starting...' : 'Start Repair'}
                  </button>
                )}
                {selected.status === 'in_repair' && (
                  <button
                    className={styles.btnResolve}
                    onClick={async () => {
                      try {
                        const cases = await fetchRepairCases()
                        const myCase = cases.find(c => c.reportId === selected.reportId || c.reportMongoId === selected._id)
                        if (myCase) {
                          navigate(`/admin/repair/${myCase.repairId}`)
                        } else {
                          alert('No repair case found for this report')
                        }
                      } catch (err) {
                        console.error(err)
                      }
                    }}
                  >
                    <Wrench size={13} /> Manage Repair
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
              <li>After verification, click "Start Repair" to create a repair case.</li>
              <li>Upload evidence at <strong>/admin/repairs</strong> for AI validation.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
