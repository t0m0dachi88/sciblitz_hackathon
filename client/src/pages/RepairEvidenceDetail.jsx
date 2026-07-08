import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Upload, ShieldCheck, CheckCircle, AlertTriangle, FileText, Camera } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { fetchRepairCaseById, submitRepairEvidence, approveRepairManually } from '../api/reports'
import RepairTimeline from '../components/RepairTimeline'
import styles from './RepairEvidenceDetail.module.css'

export default function RepairEvidenceDetail() {
  const { repairId } = useParams()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [repairNotes, setRepairNotes] = useState('')

  // File states
  const [afterImage, setAfterImage] = useState(null)
  const [completionCert, setCompletionCert] = useState(null)
  const [inspectionReport, setInspectionReport] = useState(null)
  const [afterPreview, setAfterPreview] = useState(null)

  useEffect(() => {
    fetchRepairCaseById(repairId)
      .then(data => setCaseData(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [repairId])

  function handleAfterImageChange(e) {
    const file = e.target.files?.[0]
    if (file) {
      setAfterImage(file)
      setAfterPreview(URL.createObjectURL(file))
    }
  }

  async function handleSubmitEvidence() {
    if (!afterImage) {
      alert('After-repair image is required')
      return
    }

    setSubmitting(true)
    try {
      // Upload files via analyze endpoint or direct URL
      // For now, we'll send URLs (files should be uploaded separately)
      const afterImageUrl = afterPreview || ''
      const completionCertUrl = completionCert?.name || ''
      const inspectionReportUrl = inspectionReport?.name || ''

      const response = await submitRepairEvidence({
        repairId,
        afterRepairImageUrl: afterImageUrl,
        completionCertificateUrl: completionCertUrl,
        siteInspectionReportUrl: inspectionReportUrl,
        repairNotes,
      })

      setResult(response)
    } catch (err) {
      console.error('Evidence submission failed:', err)
      alert('Failed to submit evidence: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleManualApprove() {
    try {
      await approveRepairManually(repairId)
      setResult({ verified: true, message: 'Repair manually approved' })
      const updated = await fetchRepairCaseById(repairId)
      setCaseData(updated)
    } catch (err) {
      console.error('Manual approval failed:', err)
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading repair case...</div>
  }

  if (!caseData) {
    return <div className={styles.loading}>Repair case not found.</div>
  }

  const report = caseData.report
  const evidence = caseData.evidence
  const repairCase = caseData

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate('/admin/repairs')}>
        <ArrowLeft size={14} /> Back to Repairs
      </button>

      <div className={styles.grid}>
        {/* Left: Case Details */}
        <div className={styles.leftCol}>
          <div className={`card ${styles.sectionCard}`}>
            <h3 className={styles.sectionTitle}>Repair Case Details</h3>
            <div className={styles.metaGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Repair ID</span>
                <span className="mono">{repairCase.repairId}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Infrastructure ID</span>
                <span className="mono">{repairCase.infrastructureId}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Report ID</span>
                <span className="mono">{repairCase.reportId}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Status</span>
                <span className={`badge badge-${repairCase.repairStatus === 'verified_repaired' ? 'resolved' : repairCase.repairStatus === 'needs_manual_review' ? 'rejected' : 'pending'}`}>
                  {repairCase.repairStatus?.replace(/_/g, ' ')}
                </span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Assigned Authority</span>
                <span>{repairCase.assignedAuthority}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Started</span>
                <span className="mono">{new Date(repairCase.startedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {report && (
            <div className={`card ${styles.sectionCard}`}>
              <h3 className={styles.sectionTitle}>Original Report</h3>
              <div className={styles.metaGrid}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Category</span>
                  <span>{report.category}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Thana</span>
                  <span>{report.thana}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Damage Type</span>
                  <span>{report.damageType}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Severity</span>
                  <span className={`badge badge-${(report.severityLevel || 'low').toLowerCase()}`}>{report.severityLevel}</span>
                </div>
              </div>
              <p className={styles.desc}>{report.description}</p>
              {report.imageUrl && (
                <div className={styles.imageWrap}>
                  <img src={report.imageUrl} alt="Original damage" className={styles.reportImage} />
                </div>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className={`card ${styles.sectionCard}`}>
            <h3 className={styles.sectionTitle}>Repair Timeline</h3>
            <RepairTimeline
              status={repairCase.repairStatus}
              createdAt={repairCase.createdAt}
              startedAt={repairCase.startedAt}
              completedAt={repairCase.completedAt}
            />
          </div>
        </div>

        {/* Right: Evidence Submission */}
        <div className={styles.rightCol}>
          {result ? (
            <div className={`card ${styles.resultCard}`}>
              <div className={result.verified ? styles.resultSuccess : styles.resultReview}>
                {result.verified ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                <h3>{result.verified ? 'Repair Verified' : 'Needs Manual Review'}</h3>
                <p>{result.message || result.aiResult?.summary}</p>
                {result.aiResult && (
                  <div className={styles.aiResult}>
                    <div className={styles.aiRow}>
                      <span>Confidence:</span>
                      <strong>{result.aiResult.confidence}%</strong>
                    </div>
                    {result.aiResult.concerns?.length > 0 && (
                      <div className={styles.concerns}>
                        <span>Concerns:</span>
                        <ul>
                          {result.aiResult.concerns.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                <div className={styles.resultActions}>
                  <button className={styles.btnBack} onClick={() => navigate('/admin/repairs')}>
                    Back to Repairs
                  </button>
                  {!result.verified && (
                    <button className={styles.btnApprove} onClick={handleManualApprove}>
                      <ShieldCheck size={13} /> Manually Approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={`card ${styles.sectionCard}`}>
              <h3 className={styles.sectionTitle}>
                <Upload size={14} /> Submit Repair Evidence
              </h3>

              <div className={styles.formGroup}>
                <label className={styles.label}>After-Repair Image *</label>
                <div className={styles.uploadArea} onClick={() => document.getElementById('after-image').click()}>
                  {afterPreview ? (
                    <img src={afterPreview} alt="After repair" className={styles.uploadPreview} />
                  ) : (
                    <>
                      <Camera size={20} className={styles.uploadIcon} />
                      <span>Click to upload after-repair image</span>
                    </>
                  )}
                </div>
                <input id="after-image" type="file" accept="image/*" hidden onChange={handleAfterImageChange} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Work Completion Certificate (PDF)</label>
                <div className={styles.fileInput} onClick={() => document.getElementById('completion-cert').click()}>
                  <FileText size={14} />
                  <span>{completionCert?.name || 'Click to upload PDF'}</span>
                </div>
                <input id="completion-cert" type="file" accept=".pdf" hidden onChange={e => setCompletionCert(e.target.files?.[0])} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Site Inspection Report (PDF)</label>
                <div className={styles.fileInput} onClick={() => document.getElementById('inspection-report').click()}>
                  <FileText size={14} />
                  <span>{inspectionReport?.name || 'Click to upload PDF'}</span>
                </div>
                <input id="inspection-report" type="file" accept=".pdf" hidden onChange={e => setInspectionReport(e.target.files?.[0])} />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Repair Notes</label>
                <textarea
                  className={styles.textarea}
                  value={repairNotes}
                  onChange={e => setRepairNotes(e.target.value)}
                  placeholder="Optional notes about the repair work..."
                  rows={3}
                />
              </div>

              <button
                className={styles.submitBtn}
                onClick={handleSubmitEvidence}
                disabled={submitting || !afterImage}
              >
                {submitting ? 'Submitting...' : 'Submit Evidence for AI Validation'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
