import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle, Clock, MapPin, Map, ListOrdered, BarChart2, ArrowRight } from 'lucide-react'
import { MOCK_REPORTS, STATS } from '../data/mockReports'
import styles from './Dashboard.module.css'

const STAT_CARDS = [
  { label: 'Total Reports',   value: STATS.total,    sub: 'All submitted incidents',      icon: MapPin,        color: 'blue'   },
  { label: 'Pending Review',  value: STATS.pending,  sub: 'Awaiting verification',        icon: Clock,         color: 'yellow' },
  { label: 'Critical Issues', value: STATS.critical, sub: 'Immediate action required',    icon: AlertTriangle, color: 'red'    },
  { label: 'Verified',        value: STATS.verified, sub: 'Confirmed by authority',       icon: CheckCircle,   color: 'green'  },
]

const QUICK_NAV = [
  { to: '/map',      icon: Map,         label: 'Map View',         sub: 'View all incidents on Dhaka map' },
  { to: '/priority', icon: ListOrdered, label: 'Priority List',    sub: 'Ranked queue for action' },
  { to: '/areas',    icon: BarChart2,   label: 'Area Intelligence', sub: 'Thana risk leaderboard' },
]

const RECENT = [...MOCK_REPORTS]
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  .slice(0, 8)

function fmtTime(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' +
         d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function Dashboard() {
  return (
    <div className={styles.page}>
      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        {STAT_CARDS.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className={`card ${styles.statCard}`}>
            <div className={styles.statHeader}>
              <span className={styles.statLabel}>{label}</span>
              <div className={`${styles.statIcon} ${styles[`icon_${color}`]}`}>
                <Icon size={13} strokeWidth={1.75} />
              </div>
            </div>
            <div className={styles.statValue}>{value}</div>
            <div className={styles.statSub}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Nav Cards */}
      <div className={styles.quickNav}>
        {QUICK_NAV.map(({ to, icon: Icon, label, sub }) => (
          <Link key={to} to={to} className={`card ${styles.quickCard}`}>
            <div className={styles.quickIcon}><Icon size={14} strokeWidth={1.75} /></div>
            <div className={styles.quickText}>
              <span className={styles.quickLabel}>{label}</span>
              <span className={styles.quickSub}>{sub}</span>
            </div>
            <ArrowRight size={13} className={styles.quickArrow} />
          </Link>
        ))}
      </div>

      {/* Bottom row */}
      <div className={styles.bottomRow}>
        {/* Recent reports table */}
        <div className={`card ${styles.recentPanel}`}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Recent Reports</span>
            <Link to="/priority" className={styles.viewAll}>View all</Link>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Thana</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {RECENT.map(r => (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td>
                  <td>{r.category}</td>
                  <td>{r.thana}</td>
                  <td><span className={`badge badge-${r.severity.toLowerCase()}`}>{r.severity}</span></td>
                  <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  <td className={styles.timeCell}>{fmtTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* System info */}
        <div className={styles.sideCol}>
          <div className={`card ${styles.infoCard}`}>
            <p className={styles.panelTitle}>System Info</p>
            <div className={styles.infoList}>
              {[
                ['Coverage',    'Dhaka City'],
                ['Thanas',      '12 active'],
                ['AI Engine',   'Gemini Vision'],
                ['AI Status',   'Phase 3'],
                ['Database',    'Supabase (Phase 4)'],
                ['Build',       'MVP v1.0'],
              ].map(([k, v]) => (
                <div key={k} className={styles.infoRow}>
                  <span className={styles.infoKey}>{k}</span>
                  <span className={styles.infoVal}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`card ${styles.severityBreakdown}`}>
            <p className={styles.panelTitle} style={{ marginBottom: 14 }}>Severity Breakdown</p>
            {[
              { label: 'Critical', count: STATS.critical, cls: 'badge-critical', pct: (STATS.critical / STATS.total * 100).toFixed(0) },
              { label: 'High',     count: MOCK_REPORTS.filter(r => r.severity === 'High').length,   cls: 'badge-high',   pct: (MOCK_REPORTS.filter(r => r.severity === 'High').length / STATS.total * 100).toFixed(0) },
              { label: 'Medium',   count: MOCK_REPORTS.filter(r => r.severity === 'Medium').length, cls: 'badge-medium', pct: (MOCK_REPORTS.filter(r => r.severity === 'Medium').length / STATS.total * 100).toFixed(0) },
              { label: 'Low',      count: MOCK_REPORTS.filter(r => r.severity === 'Low').length,    cls: 'badge-low',    pct: (MOCK_REPORTS.filter(r => r.severity === 'Low').length / STATS.total * 100).toFixed(0) },
            ].map(({ label, count, cls, pct }) => (
              <div key={label} className={styles.sevRow}>
                <span className={`badge ${cls}`}>{label}</span>
                <div className={styles.sevBar}>
                  <div className={`${styles.sevFill} ${styles[`fill_${label.toLowerCase()}`]}`} style={{ width: `${pct}%` }} />
                </div>
                <span className={styles.sevCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
