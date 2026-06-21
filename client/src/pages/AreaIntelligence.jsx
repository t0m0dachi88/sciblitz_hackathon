import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { fetchAreaProfiles } from '../api/reports'
import { THANA_COORDS } from '../data/mockReports'
import styles from './AreaIntelligence.module.css'

const DHAKA_CENTER = [23.7808, 90.3927]
const DHAKA_ZOOM = 11

const RISK_COLOR = { High: '#ef4444', Medium: '#eab308', Low: '#3b82f6' }
const RISK_RADIUS = { High: 14, Medium: 11, Low: 8 }

const CATEGORY_LABELS = {
  theft: 'Theft', burglary: 'Burglary', fire_incident: 'Fire Incident',
  road_accident: 'Road Accident', drug_activity: 'Drug Activity',
  public_safety_hazard: 'Public Safety Hazard', vandalism: 'Vandalism', other: 'Other',
}

function RiskBar({ score }) {
  const color = score >= 60 ? '#ef4444' : score >= 30 ? '#eab308' : '#3b82f6'
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
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchAreaProfiles()
      .then(data => {
        setProfiles(data)
        if (data.length > 0) setSelected(data[0])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...profiles].sort((a, b) => b.riskScore - a.riskScore)
  const selectedProfile = profiles.find(p => p.thana === selected?.thana)
  const catEntries = selectedProfile
    ? Object.entries(selectedProfile.categoryStats || {})
        .filter(([, v]) => v.count > 0)
        .sort(([, a], [, b]) => b.score - a.score)
    : []

  const getCoords = (thana) => THANA_COORDS[thana] || DHAKA_CENTER

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {/* Leaderboard */}
        <div className={`card ${styles.leaderCard}`}>
          <div className={styles.leaderHeader}>
            <span className={styles.panelTitle}>Thana Risk Leaderboard</span>
            <span className={styles.panelSub}>Ranked by incident risk score</span>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thRank}>Rank</th>
                  <th>Thana</th>
                  <th>Score</th>
                  <th>Level</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((t, i) => (
                  <tr
                    key={t.thana}
                    className={`${styles.row} ${selected?.thana === t.thana ? styles.rowSelected : ''}`}
                    onClick={() => setSelected(t)}
                    onDoubleClick={() => navigate(`/areas/${encodeURIComponent(t.thana)}`)}
                  >
                    <td className={styles.rankCell}>
                      <span className={`${styles.rankBadge} ${i < 3 ? styles.rankTop : ''}`}>{i + 1}</span>
                    </td>
                    <td className={styles.thanaCell}>{t.thana}</td>
                    <td><RiskBar score={t.riskScore} /></td>
                    <td>
                      <span className="badge" style={{
                        background: `${RISK_COLOR[t.riskLevel]}18`,
                        color: RISK_COLOR[t.riskLevel],
                        border: `1px solid ${RISK_COLOR[t.riskLevel]}40`,
                      }}>
                        {t.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Map */}
        <div className={`card ${styles.mapCard}`}>
          <div className={styles.leaderHeader}>
            <span className={styles.panelTitle}>Risk Heatmap</span>
            <span className={styles.panelSub}>Dhaka thanas colored by risk level</span>
          </div>
          <div className={styles.mapWrap}>
            <MapContainer center={DHAKA_CENTER} zoom={DHAKA_ZOOM} className={styles.map} scrollWheelZoom={true}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {sorted.map(t => {
                const coords = getCoords(t.thana)
                const color = RISK_COLOR[t.riskLevel]
                return (
                  <CircleMarker
                    key={t.thana}
                    center={coords}
                    radius={RISK_RADIUS[t.riskLevel] || 8}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: selected?.thana === t.thana ? 0.95 : 0.7,
                      color: '#ffffff',
                      weight: selected?.thana === t.thana ? 2.5 : 1.2,
                      opacity: 0.9,
                    }}
                    eventHandlers={{ click: () => setSelected(t) }}
                  >
                    <Popup>
                      <div style={{ padding: 4, minWidth: 160 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <strong style={{ fontSize: 13 }}>{t.thana}</strong>
                          <span className="badge" style={{
                            background: `${color}22`, color, border: `1px solid ${color}44`,
                            fontSize: 10, padding: '2px 6px',
                          }}>{t.riskLevel}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
                          Risk Score: <strong style={{ color }}>{t.riskScore}</strong>
                        </div>
                        <div style={{ fontSize: 11, color: '#888' }}>
                          Incidents: {t.incidentCount}
                        </div>
                        <button
                          style={{
                            marginTop: 8, width: '100%', padding: '5px 0',
                            background: 'transparent', border: '1px solid #333',
                            borderRadius: 3, color: '#3b82f6', fontSize: 11,
                            cursor: 'pointer',
                          }}
                          onClick={() => navigate(`/areas/${encodeURIComponent(t.thana)}`)}
                        >
                          View Full Report
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>
          {/* Legend */}
          <div className={styles.legendRow}>
            {Object.entries(RISK_COLOR).map(([level, color]) => (
              <div key={level} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: color }} />
                <span>{level} Risk</span>
              </div>
            ))}
          </div>
        </div>

        {/* Thana Detail Panel */}
        <div className={styles.detailCol}>
          {selectedProfile ? (
            <div className={`card ${styles.detailCard}`}>
              <div className={styles.detailHeader}>
                <div>
                  <p className={styles.detailThana}>{selectedProfile.thana}</p>
                  <p className={styles.detailSub}>Click name for full analysis</p>
                </div>
                <button className="btn-primary" style={{ fontSize: 11, padding: '6px 12px' }}
                  onClick={() => navigate(`/areas/${encodeURIComponent(selectedProfile.thana)}`)}>
                  View Full Report
                </button>
              </div>

              <div className={styles.metaGrid}>
                <div className={styles.metaBox}>
                  <span className={styles.metaLabel}>Risk Score</span>
                  <span className={styles.metaValue} style={{ color: RISK_COLOR[selectedProfile.riskLevel] }}>
                    {selectedProfile.riskScore}
                  </span>
                </div>
                <div className={styles.metaBox}>
                  <span className={styles.metaLabel}>Incidents</span>
                  <span className={styles.metaValue}>{selectedProfile.incidentCount}</span>
                </div>
              </div>

              <div className={styles.sectionDivider} />
              <p className={styles.sectionLabel}>Category Risk Breakdown</p>
              {catEntries.length > 0 ? (
                <div className={styles.catList}>
                  {catEntries.map(([cat, data]) => {
                    const pct = Math.min(data.score, 100)
                    const barColor = pct >= 60 ? '#ef4444' : pct >= 30 ? '#eab308' : '#3b82f6'
                    return (
                      <div key={cat} className={styles.catRow}>
                        <span className={styles.catName}>{CATEGORY_LABELS[cat] || cat}</span>
                        <div className={styles.catTrack}>
                          <div className={styles.catFill} style={{ width: `${pct}%`, background: barColor }} />
                        </div>
                        <span className={styles.catCount}>{data.count}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className={styles.noneText}>No incident data.</p>
              )}

              {selectedProfile.infraIssues?.length > 0 && (
                <>
                  <div className={styles.sectionDivider} />
                  <p className={styles.sectionLabel}>Infrastructure Concerns</p>
                  {selectedProfile.infraIssues.slice(0, 3).map((inf, i) => (
                    <div key={i} className={styles.catRow}>
                      <span className={styles.catName}>{inf.damageType || inf.category}</span>
                      <span className={`badge badge-${(inf.severityLevel || 'low').toLowerCase()}`} style={{ fontSize: 10 }}>
                        {inf.severityLevel}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className={`card ${styles.detailCard}`} style={{ padding: 40, textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Select a thana</p>
            </div>
          )}

          <div className={`card ${styles.scaleCard}`}>
            <p className={styles.sectionLabel} style={{ marginBottom: 10 }}>Risk Score Guide</p>
            {[
              { range: '60–100', label: 'High',  color: '#ef4444', desc: 'Elevated incident levels' },
              { range: '30–59',  label: 'Medium', color: '#eab308', desc: 'Moderate incident levels' },
              { range: '0–29',   label: 'Low',   color: '#3b82f6', desc: 'Lower incident levels' },
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
