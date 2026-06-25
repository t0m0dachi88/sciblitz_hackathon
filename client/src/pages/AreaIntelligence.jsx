import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
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

const PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280']

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

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className={styles.pieTooltip}>
      <span className={styles.pieTooltipName}>{data.label}</span>
      <span className={styles.pieTooltipVal}>{data.count} incidents</span>
    </div>
  )
}

function CategoryDetailPanel({ category, data, thana, onClose }) {
  const totalIncidents = data.reduce((sum, d) => sum + d.count, 0)
  const selected = data.find(d => d.key === category)
  if (!selected) return null

  const contribution = totalIncidents > 0 ? ((selected.count / totalIncidents) * 100).toFixed(1) : 0
  const riskPct = Math.min(selected.score, 100)
  const riskColor = riskPct >= 60 ? '#ef4444' : riskPct >= 30 ? '#eab308' : '#3b82f6'

  return (
    <div className={`card ${styles.detailPanel}`}>
      <div className={styles.detailPanelHeader}>
        <div>
          <p className={styles.detailPanelTitle}>{CATEGORY_LABELS[category] || category}</p>
          <p className={styles.detailPanelSub}>{thana} — Category Analysis</p>
        </div>
        <button className={styles.closeBtn} onClick={onClose}>&times;</button>
      </div>

      <div className={styles.detailStats}>
        <div className={styles.detailStat}>
          <span className={styles.detailStatVal}>{selected.count}</span>
          <span className={styles.detailStatLabel}>Total Incidents</span>
        </div>
        <div className={styles.detailStat}>
          <span className={styles.detailStatVal} style={{ color: riskColor }}>{contribution}%</span>
          <span className={styles.detailStatLabel}>Contribution</span>
        </div>
        <div className={styles.detailStat}>
          <span className={styles.detailStatVal} style={{ color: riskColor }}>{selected.score}</span>
          <span className={styles.detailStatLabel}>Risk Score</span>
        </div>
      </div>

      <div className={styles.detailDivider} />

      <p className={styles.detailSectionTitle}>Risk Assessment</p>
      <div className={styles.detailRiskBar}>
        <div className={styles.detailRiskTrack}>
          <div className={styles.detailRiskFill} style={{ width: `${riskPct}%`, background: riskColor }} />
        </div>
        <span className={styles.detailRiskLabel} style={{ color: riskColor }}>{riskPct >= 60 ? 'High' : riskPct >= 30 ? 'Medium' : 'Low'} Risk</span>
      </div>

      <p className={styles.detailSectionTitle}>AI Insight</p>
      <p className={styles.detailText}>
        {CATEGORY_LABELS[category] || category} accounts for {contribution}% of all incidents in {thana}.
        {selected.count > 3
          ? ` This is a significant contributor to the area's overall risk profile and requires attention.`
          : ` While not the dominant risk factor, it contributes to the cumulative risk.`}
      </p>

      <p className={styles.detailSectionTitle}>Recommendation</p>
      <p className={styles.detailText}>
        {riskPct >= 60
          ? `Prioritize ${CATEGORY_LABELS[category]?.toLowerCase() || category} mitigation efforts. Consider increasing monitoring and preventive measures in this area.`
          : riskPct >= 30
          ? `Monitor ${CATEGORY_LABELS[category]?.toLowerCase() || category} patterns. Review preventive measures periodically.`
          : `Continue routine monitoring. No immediate action required.`}
      </p>
    </div>
  )
}

export default function AreaIntelligence() {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)

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

  const pieData = catEntries.map(([key, data]) => ({
    key,
    label: CATEGORY_LABELS[key] || key,
    count: data.count,
    score: data.score,
  }))

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
                    onClick={() => { setSelected(t); setSelectedCategory(null) }}
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
                    eventHandlers={{ click: () => { setSelected(t); setSelectedCategory(null) } }}
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
              <p className={styles.sectionLabel}>Category Risk Distribution</p>

              {pieData.length > 0 ? (
                <div className={styles.pieSection}>
                  <div className={styles.pieWrap}>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="label"
                          onClick={(_, index) => {
                            const item = pieData[index]
                            setSelectedCategory(item.key === selectedCategory ? null : item.key)
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          {pieData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={PIE_COLORS[i % PIE_COLORS.length]}
                              opacity={selectedCategory && pieData[i].key !== selectedCategory ? 0.3 : 1}
                              stroke="none"
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={styles.pieLegend}>
                    {pieData.map((d, i) => (
                      <button
                        key={d.key}
                        className={`${styles.pieLegendItem} ${selectedCategory === d.key ? styles.pieLegendActive : ''}`}
                        onClick={() => setSelectedCategory(d.key === selectedCategory ? null : d.key)}
                      >
                        <span className={styles.pieLegendDot} style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className={styles.pieLegendLabel}>{d.label}</span>
                        <span className={styles.pieLegendCount}>{d.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className={styles.noneText}>No incident data.</p>
              )}
            </div>
          ) : (
            <div className={`card ${styles.detailCard}`} style={{ padding: 40, textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Select a thana</p>
            </div>
          )}

          {/* Category Detail Panel */}
          {selectedCategory && pieData.length > 0 && (
            <CategoryDetailPanel
              category={selectedCategory}
              data={pieData}
              thana={selectedProfile?.thana}
              onClose={() => setSelectedCategory(null)}
            />
          )}

          <div className={`card ${styles.scaleCard}`}>
            <p className={styles.sectionLabel} style={{ marginBottom: 10 }}>Risk Score Guide</p>
            {[
              { range: '60-100', label: 'High',  color: '#ef4444', desc: 'Elevated incident levels' },
              { range: '30-59',  label: 'Medium', color: '#eab308', desc: 'Moderate incident levels' },
              { range: '0-29',   label: 'Low',   color: '#3b82f6', desc: 'Lower incident levels' },
            ].map(({ range, label, color, desc }) => (
              <div key={range} className={styles.scaleRow}>
                <span className={styles.scaleDot} style={{ background: color }} />
                <div className={styles.scaleText}>
                  <span className={styles.scaleRange} style={{ color }}>{range} -- {label}</span>
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
