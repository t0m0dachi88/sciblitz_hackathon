import { useState } from 'react'
import { getThanaStats, MOCK_REPORTS } from '../data/mockReports'
import styles from './AreaIntelligence.module.css'

const thanaStats = getThanaStats()

const RISK_COLOR = { Critical: '#ef4444', High: '#f97316', Medium: '#eab308', Low: '#3b82f6' }

function InfraScore({ score }) {
  const color = score < 40 ? '#ef4444' : score < 65 ? '#f97316' : score < 80 ? '#eab308' : '#22c55e'
  return (
    <div className={styles.scoreWrap}>
      <div className={styles.scoreTrack}>
        <div className={styles.scoreFill} style={{ width: `${score}%`, background: color }} />
      </div>
      <span className={styles.scoreNum} style={{ color }}>{score}</span>
    </div>
  )
}

export default function AreaIntelligence() {
  const [selected, setSelected] = useState(thanaStats[0])

  const selectedReports = MOCK_REPORTS.filter(r => r.thana === selected.thana)
  const categoryCounts = {}
  selectedReports.forEach(r => {
    categoryCounts[r.category] = (categoryCounts[r.category] ?? 0) + 1
  })
  const sortedCats = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {/* Leaderboard */}
        <div className={`card ${styles.leaderCard}`}>
          <div className={styles.leaderHeader}>
            <span className={styles.panelTitle}>Thana Risk Leaderboard</span>
            <span className={styles.panelSub}>Ranked by infrastructure condition score (lower = worse)</span>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thRank}>Rank</th>
                <th>Thana</th>
                <th>Incidents</th>
                <th>Critical</th>
                <th>Infra Score</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {thanaStats.map((t, i) => (
                <tr
                  key={t.thana}
                  className={`${styles.row} ${selected.thana === t.thana ? styles.rowSelected : ''}`}
                  onClick={() => setSelected(t)}
                >
                  <td className={styles.rankCell}>
                    <span className={`${styles.rankBadge} ${i < 3 ? styles.rankTop : ''}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className={styles.thanaCell}>{t.thana}</td>
                  <td className={styles.monoCell}>{t.total}</td>
                  <td>
                    {t.critical > 0
                      ? <span className="badge badge-critical">{t.critical}</span>
                      : <span className={styles.noneText}>—</span>}
                  </td>
                  <td><InfraScore score={t.infraScore} /></td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: `${RISK_COLOR[t.riskLevel]}18`,
                        color: RISK_COLOR[t.riskLevel],
                        border: `1px solid ${RISK_COLOR[t.riskLevel]}40`,
                      }}
                    >
                      {t.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Thana Detail Panel */}
        <div className={styles.detailCol}>
          <div className={`card ${styles.detailCard}`}>
            <div className={styles.detailHeader}>
              <div>
                <p className={styles.detailThana}>{selected.thana}</p>
                <p className={styles.detailSub}>Thana Detail Profile</p>
              </div>
              <span
                className="badge"
                style={{
                  background: `${RISK_COLOR[selected.riskLevel]}18`,
                  color: RISK_COLOR[selected.riskLevel],
                  border: `1px solid ${RISK_COLOR[selected.riskLevel]}40`,
                  fontSize: 12,
                  padding: '4px 10px',
                }}
              >
                {selected.riskLevel} Risk
              </span>
            </div>

            <div className={styles.metaGrid}>
              <div className={styles.metaBox}>
                <span className={styles.metaLabel}>Total Incidents</span>
                <span className={styles.metaValue}>{selected.total}</span>
              </div>
              <div className={styles.metaBox}>
                <span className={styles.metaLabel}>Critical</span>
                <span className={styles.metaValue} style={{ color: '#ef4444' }}>{selected.critical}</span>
              </div>
              <div className={styles.metaBox}>
                <span className={styles.metaLabel}>High Priority</span>
                <span className={styles.metaValue} style={{ color: '#f97316' }}>{selected.high}</span>
              </div>
              <div className={styles.metaBox}>
                <span className={styles.metaLabel}>Top Priority Score</span>
                <span className={styles.metaValue}>{selected.maxPriority}</span>
              </div>
            </div>

            <div className={styles.infraSection}>
              <div className={styles.infraLabelRow}>
                <span className={styles.sectionLabel}>Infrastructure Condition Score</span>
                <span className={styles.infraNum} style={{
                  color: selected.infraScore < 40 ? '#ef4444' : selected.infraScore < 65 ? '#f97316' : selected.infraScore < 80 ? '#eab308' : '#22c55e'
                }}>
                  {selected.infraScore} / 100
                </span>
              </div>
              <div className={styles.infraTrack}>
                <div
                  className={styles.infraFill}
                  style={{
                    width: `${selected.infraScore}%`,
                    background: selected.infraScore < 40 ? '#ef4444' : selected.infraScore < 65 ? '#f97316' : selected.infraScore < 80 ? '#eab308' : '#22c55e',
                  }}
                />
              </div>
              <div className={styles.infraScale}>
                <span>0 — Critical</span>
                <span>50 — Moderate</span>
                <span>100 — Good</span>
              </div>
            </div>

            <div className={styles.sectionDivider} />

            <p className={styles.sectionLabel}>Incident Category Breakdown</p>
            {sortedCats.length > 0 ? (
              <div className={styles.catList}>
                {sortedCats.map(([cat, count]) => {
                  const pct = Math.round((count / selected.total) * 100)
                  return (
                    <div key={cat} className={styles.catRow}>
                      <span className={styles.catName}>{cat}</span>
                      <div className={styles.catTrack}>
                        <div className={styles.catFill} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={styles.catCount}>{count}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className={styles.noneText}>No incidents reported in this thana.</p>
            )}

            <div className={styles.sectionDivider} />
            <p className={styles.sectionLabel}>Most Common Issue</p>
            <p className={styles.topIssue}>{selected.topIssue}</p>
          </div>

          {/* Risk scale guide */}
          <div className={`card ${styles.scaleCard}`}>
            <p className={styles.sectionLabel} style={{ marginBottom: 10 }}>Infrastructure Score Guide</p>
            {[
              { range: '0 – 39',  label: 'Critical',  color: '#ef4444', desc: 'Immediate authority action required' },
              { range: '40 – 64', label: 'High Risk',  color: '#f97316', desc: 'Urgent repairs needed' },
              { range: '65 – 79', label: 'Medium Risk', color: '#eab308', desc: 'Monitoring and maintenance required' },
              { range: '80 – 100',label: 'Low Risk',   color: '#22c55e', desc: 'Acceptable condition' },
            ].map(({ range, label, color, desc }) => (
              <div key={range} className={styles.scaleRow}>
                <span className={styles.scaleDot} style={{ background: color }} />
                <div className={styles.scaleText}>
                  <span className={styles.scaleRange} style={{ color }}>{range} — {label}</span>
                  <span className={styles.scaleDesc}>{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
