import { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import styles from './Reports.module.css'

const MOCK_REPORTS = [
  { id: 'RPT-001', type: 'Road Damage',        thana: 'Dhanmondi', severity: 'critical', status: 'pending',  time: '2026-06-13 21:03', description: 'Large pothole on Mirpur Road near Shankar bus stop.' },
  { id: 'RPT-002', type: 'Flooding',            thana: 'Mirpur',    severity: 'high',     status: 'pending',  time: '2026-06-13 20:51', description: 'Waterlogging at Mirpur-10 intersection, knee-deep.' },
  { id: 'RPT-003', type: 'Electrical Hazard',   thana: 'Gulshan',   severity: 'medium',   status: 'pending',  time: '2026-06-13 19:45', description: 'Exposed live wire hanging from broken pole, Gulshan-2.' },
  { id: 'RPT-004', type: 'Structural Damage',   thana: 'Lalbagh',   severity: 'critical', status: 'pending',  time: '2026-06-13 18:20', description: 'Bridge railing collapsed, pedestrian risk.' },
  { id: 'RPT-005', type: 'Road Damage',         thana: 'Uttara',    severity: 'low',      status: 'pending',  time: '2026-06-13 17:10', description: 'Minor surface cracking near Uttara Sector 7.' },
]

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

export default function Reports() {
  const [search, setSearch] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('all')

  const filtered = MOCK_REPORTS
    .filter((r) => {
      const q = search.toLowerCase()
      return (
        r.type.toLowerCase().includes(q) ||
        r.thana.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      )
    })
    .filter((r) => filterSeverity === 'all' || r.severity === filterSeverity)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])

  return (
    <div className={styles.page}>
      {/* Filter bar */}
      <div className={`card ${styles.filterBar}`}>
        <div className={styles.searchWrap}>
          <Search size={13} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by ID, type, or thana..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          <SlidersHorizontal size={13} className={styles.filterIcon} />
          <span className={styles.filterLabel}>Severity:</span>
          {['all', 'critical', 'high', 'medium', 'low'].map((s) => (
            <button
              key={s}
              className={`${styles.filterBtn} ${filterSeverity === s ? styles.filterActive : ''}`}
              onClick={() => setFilterSeverity(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className={styles.countText}>
        Showing {filtered.length} of {MOCK_REPORTS.length} reports
        {filterSeverity !== 'all' && ` — filtered by: ${filterSeverity}`}
      </p>

      {/* Table */}
      <div className="card">
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Damage Type</th>
                <th>Thana</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Description</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className={styles.row}>
                  <td className="mono">{r.id}</td>
                  <td className={styles.typeCell}>{r.type}</td>
                  <td>{r.thana}</td>
                  <td>
                    <span className={`badge badge-${r.severity}`}>{r.severity}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </td>
                  <td className={styles.descCell}>{r.description}</td>
                  <td className={`${styles.timeCell} mono`}>{r.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className={styles.emptyState}>
            No reports match the current filter.
          </div>
        )}

        <p className={styles.mockNote}>
          Sample data shown for layout purposes. Live data will be loaded from Supabase in Phase 4.
        </p>
      </div>
    </div>
  )
}
