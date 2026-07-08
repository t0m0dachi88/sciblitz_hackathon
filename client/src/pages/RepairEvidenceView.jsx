import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { ShieldCheck, CheckCircle, FileText, Camera, Clock } from 'lucide-react'
import { fetchRepairEvidencePublic } from '../api/reports'
import RepairTimeline from '../components/RepairTimeline'
import styles from './RepairEvidenceView.module.css'

export default function RepairEvidenceView() {
  const { repairId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRepairEvidencePublic(repairId)
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [repairId])

  if (loading) return <div className={styles.loading}>Loading repair evidence...</div>
  if (error) return <div className={styles.error}>{error}</div>
  if (!data) return <div className={styles.error}>No data found.</div>

  const { repairCase, evidence, report } = data

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.badge}>
          <ShieldCheck size={14} />
          <span>Verified Repair — Public Transparency Record</span>
        </div>
        <h2 className={styles.title}>Repair Evidence</h2>
        <p className={styles.subtitle}>
          This repair has been verified by AI evidence validation and is publicly available for transparency.
        </p>
      </div>

      <div className={styles.grid}>
        <div className={styles.leftCol}>
          {/* IDs */}
          <div className={`card ${styles.sectionCard}`}>
            <h3 className={styles.sectionTitle}>Identifiers</h3>
            <div className={styles.idGrid}>
              <div className={styles.idItem}>
                <span className={styles.idLabel}>Repair ID</span>
                <span className="mono">{repairCase.repairId}</span>
              </div>
              <div className={styles.idItem}>
                <span className={styles.idLabel}>Infrastructure ID</span>
                <span className="mono">{repairCase.infrastructureId}</span>
              </div>
              <div className={styles.idItem}>
                <span className={styles.idLabel}>Report ID</span>
                <span className="mono">{repairCase.reportId}</span>
              </div>
              <div className={styles.idItem}>
                <span className={styles.idLabel}>Status</span>
                <span className="badge badge-resolved">Verified Repaired</span>
              </div>
            </div>
          </div>

          {/* Original Report */}
          {report && (
            <div className={`card ${styles.sectionCard}`}>
              <h3 className={styles.sectionTitle}>
                <FileText size={14} /> Original Report
              </h3>
              <div className={styles.reportInfo}>
                <span>{report.thana} — {report.category}</span>
                <span className={styles.damageType}>{report.damageType}</span>
              </div>
              <p className={styles.desc}>{report.description}</p>
              {report.imageUrl && (
                <div className={styles.imageWrap}>
                  <img src={report.imageUrl} alt="Original damage" className={styles.image} />
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className={`card ${styles.sectionCard}`}>
            <h3 className={styles.sectionTitle}>
              <Clock size={14} /> Repair Timeline
            </h3>
            <RepairTimeline
              status={repairCase.repairStatus}
              createdAt={repairCase.createdAt}
              startedAt={repairCase.startedAt}
              completedAt={repairCase.completedAt}
            />
          </div>
        </div>

        <div className={styles.rightCol}>
          {/* After-Repair Image */}
          {evidence?.afterRepairImage && (
            <div className={`card ${styles.sectionCard}`}>
              <h3 className={styles.sectionTitle}>
                <Camera size={14} /> After-Repair Image
              </h3>
              <div className={styles.imageWrap}>
                <img src={evidence.afterRepairImage} alt="After repair" className={styles.image} />
              </div>
            </div>
          )}

          {/* AI Validation */}
          {evidence && (
            <div className={`card ${styles.sectionCard}`}>
              <h3 className={styles.sectionTitle}>
                <ShieldCheck size={14} /> AI Evidence Validation
              </h3>

              <div className={styles.confidenceBar}>
                <div className={styles.confLabel}>
                  <span>Confidence Score</span>
                  <span className={styles.confValue}>{evidence.aiConfidence}%</span>
                </div>
                <div className={styles.confTrack}>
                  <div
                    className={styles.confFill}
                    style={{
                      width: `${evidence.aiConfidence}%`,
                      background: evidence.aiConfidence >= 70 ? '#22c55e' : '#f59e0b',
                    }}
                  />
                </div>
              </div>

              <div className={styles.summaryBox}>
                <p className={styles.summaryLabel}>AI Summary</p>
                <p className={styles.summaryText}>{evidence.aiSummary}</p>
              </div>

              {evidence.aiConcerns?.length > 0 && (
                <div className={styles.concernsBox}>
                  <p className={styles.summaryLabel}>Concerns Identified</p>
                  <ul className={styles.concernList}>
                    {evidence.aiConcerns.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}

              {evidence.repairNotes && (
                <div className={styles.notesBox}>
                  <p className={styles.summaryLabel}>Repair Notes</p>
                  <p className={styles.notesText}>{evidence.repairNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
