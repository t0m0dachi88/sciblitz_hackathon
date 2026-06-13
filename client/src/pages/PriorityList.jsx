import { useState } from 'react'
import { ArrowUp, ArrowDown, ChevronUp } from 'lucide-react'
import { MOCK_REPORTS } from '../data/mockReports'
import styles from './PriorityList.module.css'

const SORT_OPTIONS = [
  { key: 'priorityScore', label: 'Priority Score' },
  { key: 'createdAt',     label: 'Most Recent'   },
  { key: 'reportCount',   label: 'Most Reported' },
]

function fmtTime(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function PriorityBar({ score }) {
  const pct = Math.min(score, 100)
  const color = pct >= 80 ? '#ef4444' : pct >= 60 ? '#f97316' : pct >= 35 ? '#eab308' : '#3b82f6'
  return (
    <div className={styles.barWrap}>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.barScore} style={{ color }}>{score}</span>
    </div>
  )
}

export default function PriorityList() {
  const [sortKey, setSortKey]   = useState('priorityScore')
  const [sortDir, setSortDir]   = useState('desc')
  const [filterSev, setFilterSev] = useState('All')

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...MOCK_REPORTS]
    .filter(r => filterSev === 'All' || r.severity === filterSev)
    .sort((a, b) => {
      let va = a[sortKey], vb = b[sortKey]
      if (sortKey === 'createdAt') { va = new Date(va); vb = new Date(vb) }
      return sortDir === 'desc' ? (vb > va ? 1 : -1) : (va > vb ? 1 : -1)
    })

  const SortIcon = ({ colKey }) => {
    if (sortKey !== colKey) return <ChevronUp size={11} className={styles.sortIconInactive} />
    return sortDir === 'desc'
      ? <ArrowDown size={11} className={styles.sortIconActive} />
      : <ArrowUp   size={11} className={styles.sortIconActive} />
  }

  return (
    <div className={styles.page}>
      {/* Toolbar */}
      <div className={`card ${styles.toolbar}`}>
        <div className={styles.sortGroup}>
          <span className={styles.toolLabel}>Sort by</span>
          {SORT_OPTIONS.map(o => (
            <button
              key={o.key}
              className={`${styles.sortBtn} ${sortKey === o.key ? styles.sortActive : ''}`}
              onClick={() => toggleSort(o.key)}
            >
              {o.label}
              {sortKey === o.key && (sortDir === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}
            </button>
          ))}
        </div>
        <div className={styles.toolDivider} />
        <div className={styles.sortGroup}>
          <span className={styles.toolLabel}>Filter</span>
          {['All', 'Critical', 'High', 'Medium', 'Low'].map(s => (
            <button
              key={s}
              className={`${styles.filterBtn} ${filterSev === s ? styles.filterActive : ''}`}
              onClick={() => setFilterSev(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className={styles.toolSpacer} />
        <span className={styles.countText}>{sorted.length} issues</span>
      </div>

      {/* Table */}
      <div className="card">
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thRank}>#</th>
              <th>Report ID</th>
              <th>Damage Type</th>
              <th>Thana</th>
              <th>Severity</th>
              <th
                className={styles.thSort}
                onClick={() => toggleSort('priorityScore')}
              >
                Priority Score <SortIcon colKey="priorityScore" />
              </th>
              <th
                className={styles.thSort}
                onClick={() => toggleSort('reportCount')}
              >
                Reports <SortIcon colKey="reportCount" />
              </th>
              <th>Status</th>
              <th
                className={styles.thSort}
                onClick={() => toggleSort('createdAt')}
              >
                Submitted <SortIcon colKey="createdAt" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.id} className={`${styles.row} ${r.severity === 'Critical' ? styles.rowCritical : ''}`}>
                <td className={styles.rankCell}>{i + 1}</td>
                <td className="mono">{r.id}</td>
                <td className={styles.typeCell}>
                  <span className={styles.typeName}>{r.category}</span>
                  <span className={styles.typeSub}>{r.damageType}</span>
                </td>
                <td>{r.thana}</td>
                <td><span className={`badge badge-${r.severity.toLowerCase()}`}>{r.severity}</span></td>
                <td><PriorityBar score={r.priorityScore} /></td>
                <td className={styles.reportCell}>{r.reportCount}</td>
                <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                <td className={`${styles.timeCell} mono`}>{fmtTime(r.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
