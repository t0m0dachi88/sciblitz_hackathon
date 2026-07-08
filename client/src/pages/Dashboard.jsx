import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { AlertTriangle, CheckCircle, Clock, MapPin, Map, ListOrdered, BarChart2, ArrowRight } from 'lucide-react'
import { fetchStats, fetchReports } from '../api/reports'
import { THANA_COORDS } from '../data/mockReports'
import styles from './Dashboard.module.css'

const DHAKA_CENTER = [23.7808, 90.3927]
const DHAKA_ZOOM = 12

const QUICK_NAV = [
  { to: '/map',      icon: Map,         label: 'Map View',         sub: 'View all incidents on Dhaka map' },
  { to: '/priority', icon: ListOrdered, label: 'Priority List',    sub: 'Ranked queue for action' },
  { to: '/areas',    icon: BarChart2,   label: 'Area Intelligence', sub: 'Thana risk leaderboard' },
]

const SEVERITY_COLOR = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#3b82f6' }

function fmtTime(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' +
         d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function getCoords(r) {
  if (r.lat && r.lng) return [r.lat, r.lng]
  return THANA_COORDS[r.thana] || DHAKA_CENTER
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [allReports, setAllReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchStats(), fetchReports()])
      .then(([statsData, reportsData]) => {
        setStats(statsData)
        setAllReports(reportsData)
        setRecent(reportsData.slice(0, 8))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const STAT_CARDS = stats ? [
    { label: 'Total Reports',   value: stats.total,    sub: 'All submitted incidents',      icon: MapPin,        color: 'blue'   },
    { label: 'Pending Review',  value: stats.pending,  sub: 'Awaiting verification',        icon: Clock,         color: 'yellow' },
    { label: 'Critical Issues', value: stats.critical, sub: 'Immediate action required',    icon: AlertTriangle, color: 'red'    },
    { label: 'Verified',        value: stats.verified, sub: 'Confirmed by authority',       icon: CheckCircle,   color: 'green'  },
  ] : []

  const sev = (r) => r.severityLevel || r.severity || 'Low'

  return (
    <div className={styles.page}>
      {/* Primary: Infrastructure Map */}
      <div className={`card ${styles.mapCard}`}>
        <div className={styles.mapHeader}>
          <div>
            <span className={styles.panelTitle}>Infrastructure Map</span>
            <span className={styles.panelSub}>Geographic overview of all incidents across Dhaka</span>
          </div>
          <Link to="/map" className={styles.viewAllLink}>Open Full Map <ArrowRight size={12} /></Link>
        </div>
        <div className={styles.mapWrap}>
          <MapContainer center={DHAKA_CENTER} zoom={DHAKA_ZOOM} className={styles.map} scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {allReports.map(r => {
              const level = sev(r)
              const coords = getCoords(r)
              return (
                <CircleMarker
                  key={r._id}
                  center={coords}
                  radius={8}
                  pathOptions={{
                    fillColor: SEVERITY_COLOR[level] || '#3b82f6',
                    fillOpacity: 0.85,
                    color: SEVERITY_COLOR[level] || '#3b82f6',
                    weight: 1.5,
                    opacity: 1,
                  }}
                >
                  <Popup>
                    <div style={{ padding: 4, minWidth: 180 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <strong style={{ fontSize: 12 }}>{r.category}</strong>
                        <span className="badge" style={{ fontSize: 10, padding: '2px 6px' }}>{level}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#888' }}>{r.thana}</div>
                      <Link to={`/report/${r._id}`} style={{ display: 'block', marginTop: 6, fontSize: 11, color: '#3b82f6', textDecoration: 'none' }}>
                        View Details
                      </Link>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        </div>
      </div>

      {/* Stats */}
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

      {/* Quick Nav */}
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
              {recent.map(r => (
                <tr key={r._id}>
                  <td className="mono">{r._id.slice(-6).toUpperCase()}</td>
                  <td>{r.category}</td>
                  <td>{r.thana}</td>
                  <td><span className={`badge badge-${(r.severityLevel || 'low').toLowerCase()}`}>{r.severityLevel}</span></td>
                  <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  <td className={styles.timeCell}>{fmtTime(r.createdAt)}</td>
                </tr>
              ))}
              {recent.length === 0 && !loading && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No reports yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

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
            {stats ? [
              { label: 'Critical', count: stats.critical, cls: 'badge-critical', pct: stats.total > 0 ? (stats.critical / stats.total * 100).toFixed(0) : 0 },
              { label: 'High',     count: stats.high,     cls: 'badge-high',     pct: stats.total > 0 ? (stats.high / stats.total * 100).toFixed(0) : 0 },
              { label: 'Medium',   count: stats.medium,   cls: 'badge-medium',   pct: stats.total > 0 ? (stats.medium / stats.total * 100).toFixed(0) : 0 },
              { label: 'Low',      count: stats.low,      cls: 'badge-low',      pct: stats.total > 0 ? (stats.low / stats.total * 100).toFixed(0) : 0 },
            ].map(({ label, count, cls, pct }) => (
              <div key={label} className={styles.sevRow}>
                <span className={`badge ${cls}`}>{label}</span>
                <div className={styles.sevBar}>
                  <div className={`${styles.sevFill} ${styles[`fill_${label.toLowerCase()}`]}`} style={{ width: `${pct}%` }} />
                </div>
                <span className={styles.sevCount}>{count}</span>
              </div>
            )) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
