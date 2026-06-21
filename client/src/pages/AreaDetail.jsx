import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, AlertTriangle, FileText, Loader, Clock } from 'lucide-react'
import { fetchAreaProfile, generateAreaReport } from '../api/reports'
import styles from './AreaDetail.module.css'

const RISK_COLOR = { High: '#ef4444', Medium: '#eab308', Low: '#3b82f6' }

const CATEGORY_LABELS = {
  theft: 'Theft', burglary: 'Burglary', fire_incident: 'Fire Incident',
  road_accident: 'Road Accident', drug_activity: 'Drug Activity',
  public_safety_hazard: 'Public Safety Hazard', vandalism: 'Vandalism', other: 'Other',
}

function fmtDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function AreaDetail() {
  const { thana } = useParams()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aiReport, setAiReport] = useState(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchAreaProfile(thana)
      .then(data => {
        setProfile(data)
        if (data.aiReport) setAiReport(data.aiReport)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [thana])

  async function handleGenerate() {
    setGenerating(true)
    try {
      const report = await generateAreaReport(thana)
      setAiReport(report)
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading area profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className={styles.page}>
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <AlertTriangle size={20} style={{ color: 'var(--text-muted)', marginBottom: 8 }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Area not found.</p>
          <Link to="/areas" style={{ color: 'var(--accent)', fontSize: 12, marginTop: 8, display: 'inline-block' }}>Back to Area Intelligence</Link>
        </div>
      </div>
    )
  }

  const catEntries = Object.entries(profile.categoryStats || {})
    .filter(([, v]) => v.count > 0)
    .sort(([, a], [, b]) => b.score - a.score)

  return (
    <div className={styles.page}>
      <Link to="/areas" className={styles.backLink}>
        <ArrowLeft size={13} /> Back to Area Intelligence
      </Link>

      <div className={styles.grid}>
        {/* Main content */}
        <div className={styles.mainCol}>
          {/* Header */}
          <div className={`card ${styles.headerCard}`}>
            <div className={styles.headerTop}>
              <div>
                <h1 className={styles.thanaName}>{profile.thana}</h1>
                <p className={styles.thanaSub}>Dhaka City — Area Risk Profile</p>
              </div>
              <div className={styles.scoreBox} style={{ borderColor: `${RISK_COLOR[profile.riskLevel]}40` }}>
                <span className={styles.scoreLabel}>Risk Score</span>
                <span className={styles.scoreValue} style={{ color: RISK_COLOR[profile.riskLevel] }}>{profile.riskScore}</span>
                <span className={`badge`} style={{
                  background: `${RISK_COLOR[profile.riskLevel]}18`,
                  color: RISK_COLOR[profile.riskLevel],
                  border: `1px solid ${RISK_COLOR[profile.riskLevel]}40`,
                  fontSize: 11,
                }}>
                  {profile.riskLevel}
                </span>
              </div>
            </div>

            <div className={styles.headerMeta}>
              <div className={styles.headerStat}>
                <span className={styles.headerStatVal}>{profile.incidentCount}</span>
                <span className={styles.headerStatLabel}>Total Incidents</span>
              </div>
              <div className={styles.headerStat}>
                <span className={styles.headerStatVal}>{catEntries.length}</span>
                <span className={styles.headerStatLabel}>Active Categories</span>
              </div>
              <div className={styles.headerStat}>
                <span className={styles.headerStatVal}>{profile.infraIssues?.length || 0}</span>
                <span className={styles.headerStatLabel}>Infrastructure Issues</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className={`card ${styles.sectionCard}`}>
            <p className={styles.sectionTitle}>Category Risk Breakdown</p>
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
                      <span className={styles.catScore} style={{ color: barColor }}>{data.score}</span>
                      <span className={styles.catCount}>{data.count} incidents</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No incident data available.</p>
            )}
          </div>

          {/* Infrastructure Concerns */}
          {profile.infraIssues?.length > 0 && (
            <div className={`card ${styles.sectionCard}`}>
              <p className={styles.sectionTitle}>Infrastructure Concerns</p>
              <div className={styles.infraList}>
                {profile.infraIssues.map((inf, i) => (
                  <div key={i} className={styles.infraItem}>
                    <div className={styles.infraTop}>
                      <span className={styles.infraType}>{inf.damageType || inf.category}</span>
                      <span className={`badge badge-${(inf.severityLevel || 'low').toLowerCase()}`}>{inf.severityLevel}</span>
                    </div>
                    {inf.description && <p className={styles.infraDesc}>{inf.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Incidents */}
          {profile.recentIncidents?.length > 0 && (
            <div className={`card ${styles.sectionCard}`}>
              <p className={styles.sectionTitle}>Recent Incidents</p>
              <div className={styles.incidentList}>
                {profile.recentIncidents.map((inc, i) => (
                  <div key={inc._id || i} className={styles.incidentItem}>
                    <div className={styles.incidentTop}>
                      <span className={`badge`} style={{
                        background: `${RISK_COLOR[inc.severity === 'Critical' || inc.severity === 'High' ? 'High' : inc.severity === 'Medium' ? 'Medium' : 'Low']}18`,
                        color: RISK_COLOR[inc.severity === 'Critical' || inc.severity === 'High' ? 'High' : inc.severity === 'Medium' ? 'Medium' : 'Low'],
                        border: `1px solid ${RISK_COLOR[inc.severity === 'Critical' || inc.severity === 'High' ? 'High' : inc.severity === 'Medium' ? 'Medium' : 'Low']}40`,
                        fontSize: 10,
                      }}>
                        {inc.severity}
                      </span>
                      <span className={styles.incidentType}>{CATEGORY_LABELS[inc.type] || inc.type}</span>
                      <span className={styles.incidentTime}>{fmtDate(inc.reportedAt)}</span>
                    </div>
                    {inc.description && <p className={styles.incidentDesc}>{inc.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className={styles.sideCol}>
          {/* AI Intelligence Report */}
          <div className={`card ${styles.aiCard}`}>
            <div className={styles.aiHeader}>
              <FileText size={13} />
              <span>AI Intelligence Report</span>
            </div>

            {aiReport ? (
              <div className={styles.aiReport}>
                <p className={styles.aiSectionTitle}>Executive Summary</p>
                <p className={styles.aiText}>{aiReport.summary}</p>

                {aiReport.keyConcerns?.length > 0 && (
                  <>
                    <p className={styles.aiSectionTitle}>Key Concerns</p>
                    <ul className={styles.aiList}>
                      {aiReport.keyConcerns.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </>
                )}

                {aiReport.notableTrends?.length > 0 && (
                  <>
                    <p className={styles.aiSectionTitle}>Notable Trends</p>
                    <ul className={styles.aiList}>
                      {aiReport.notableTrends.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </>
                )}

                <p className={styles.aiSectionTitle}>Risk Explanation</p>
                <p className={styles.aiText}>{aiReport.riskExplanation || 'No explanation provided.'}</p>

                {aiReport.recommendedActions?.length > 0 && (
                  <>
                    <p className={styles.aiSectionTitle}>Recommended Actions</p>
                    <ul className={styles.aiList}>
                      {aiReport.recommendedActions.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  </>
                )}

                {aiReport.generatedAt && (
                  <p className={styles.aiGenerated}>
                    <Clock size={10} /> Generated {fmtDateTime(aiReport.generatedAt)}
                  </p>
                )}

                <button className={styles.regenerateBtn} onClick={handleGenerate} disabled={generating}>
                  {generating ? <><Loader size={12} /> Generating...</> : 'Regenerate Report'}
                </button>
              </div>
            ) : (
              <div className={styles.aiEmpty}>
                <p className={styles.aiEmptyText}>No intelligence report generated yet.</p>
                <button className={styles.generateBtn} onClick={handleGenerate} disabled={generating}>
                  {generating ? <><Loader size={13} /> Generating...</> : 'Generate AI Report'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
