import { AlertTriangle, CheckCircle, Clock, MapPin } from 'lucide-react'
import styles from './Dashboard.module.css'

const STAT_CARDS = [
  { label: 'Total Reports', value: '0', sub: 'All time', icon: MapPin, color: 'blue' },
  { label: 'Pending Review', value: '0', sub: 'Awaiting verification', icon: Clock, color: 'yellow' },
  { label: 'Critical Issues', value: '0', sub: 'Immediate action required', icon: AlertTriangle, color: 'red' },
  { label: 'Verified Reports', value: '0', sub: 'Confirmed by authority', icon: CheckCircle, color: 'green' },
]

const RECENT_MOCK = [
  { id: 'RPT-001', type: 'Road Damage', thana: 'Dhanmondi', severity: 'critical', status: 'pending', time: '2 min ago' },
  { id: 'RPT-002', type: 'Flooding',    thana: 'Mirpur',    severity: 'high',     status: 'pending', time: '14 min ago' },
  { id: 'RPT-003', type: 'Electrical',  thana: 'Gulshan',   severity: 'medium',   status: 'pending', time: '1 hr ago' },
]

export default function Dashboard() {
  return (
    <div className={styles.page}>
      {/* Stat Cards */}
      <div className={styles.statsGrid}>
        {STAT_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`card ${styles.statCard}`}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>{card.label}</span>
                <div className={`${styles.statIcon} ${styles[`icon_${card.color}`]}`}>
                  <Icon size={14} strokeWidth={1.75} />
                </div>
              </div>
              <div className={styles.statValue}>{card.value}</div>
              <div className={styles.statSub}>{card.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Content row */}
      <div className={styles.contentRow}>
        {/* Recent reports */}
        <div className={`card ${styles.recentPanel}`}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Recent Reports</span>
            <span className={styles.panelCount}>No live data yet</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Type</th>
                  <th>Thana</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_MOCK.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.id}</td>
                    <td>{r.type}</td>
                    <td>{r.thana}</td>
                    <td>
                      <span className={`badge badge-${r.severity}`}>
                        {r.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${r.status}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className={styles.timeCell}>{r.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={styles.mockNote}>
            Sample data shown for layout purposes. Connect to Supabase in Phase 4.
          </p>
        </div>

        {/* System info panel */}
        <div className={`card ${styles.infoPanel}`}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>System Info</span>
          </div>
          <div className={styles.infoList}>
            <InfoRow label="Coverage Area" value="Dhaka City" />
            <InfoRow label="Active Thanas" value="12" />
            <InfoRow label="AI Model" value="Gemini Vision" />
            <InfoRow label="AI Status" value="Not configured" />
            <InfoRow label="Database" value="Supabase (Phase 4)" />
            <InfoRow label="Build" value="MVP v1.0 — Phase 1" />
          </div>

          <div className={styles.divider} />

          <div className={styles.panelTitle} style={{ marginBottom: 12 }}>Coverage Thanas</div>
          <div className={styles.thanaGrid}>
            {[
              'Dhanmondi', 'Gulshan', 'Mirpur', 'Uttara',
              'Mohammadpur', 'Motijheel', 'Rampura', 'Khilgaon',
              'Pallabi', 'Cantonment', 'Tejgaon', 'Lalbagh',
            ].map((t) => (
              <div key={t} className={styles.thanaTag}>{t}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value}</span>
    </div>
  )
}
