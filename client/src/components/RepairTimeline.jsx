import { CheckCircle, Clock, Upload, ShieldCheck, FileText, Camera, AlertTriangle } from 'lucide-react'
import styles from './RepairTimeline.module.css'

const STEPS = [
  { key: 'citizen_reported',   label: 'Citizen Reported',   icon: FileText },
  { key: 'ai_analysis',        label: 'AI Damage Analysis', icon: AlertTriangle },
  { key: 'admin_verified',     label: 'Admin Verified',     icon: ShieldCheck },
  { key: 'repair_started',     label: 'Repair Started',     icon: Clock },
  { key: 'evidence_uploaded',  label: 'Evidence Uploaded',  icon: Upload },
  { key: 'ai_validation',      label: 'AI Validation',      icon: ShieldCheck },
  { key: 'verified_repaired',  label: 'Verified Repaired',  icon: CheckCircle },
]

export default function RepairTimeline({ status, createdAt, startedAt, completedAt }) {
  const statusOrder = {
    pending: 1,
    verified: 2,
    in_repair: 3,
    evidence_submitted: 4,
    needs_manual_review: 5,
    ai_verified: 5,
    verified_repaired: 7,
    repaired: 7,
  }

  const currentStep = statusOrder[status] || 0

  function getStepState(stepIndex) {
    const idx = stepIndex + 1
    if (idx < currentStep) return 'completed'
    if (idx === currentStep) return 'current'
    return 'upcoming'
  }

  function fmtDate(iso) {
    if (!iso) return null
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className={styles.timeline}>
      {STEPS.map((step, i) => {
        const state = getStepState(i)
        const Icon = step.icon
        return (
          <div key={step.key} className={`${styles.step} ${styles[state]}`}>
            <div className={styles.dot}>
              <Icon size={12} strokeWidth={2} />
            </div>
            <div className={styles.content}>
              <span className={styles.label}>{step.label}</span>
              {state === 'completed' && i === 0 && createdAt && (
                <span className={styles.date}>{fmtDate(createdAt)}</span>
              )}
              {state === 'completed' && i === 3 && startedAt && (
                <span className={styles.date}>{fmtDate(startedAt)}</span>
              )}
              {state === 'completed' && i === 6 && completedAt && (
                <span className={styles.date}>{fmtDate(completedAt)}</span>
              )}
            </div>
            {i < STEPS.length - 1 && <div className={styles.line} />}
          </div>
        )
      })}
    </div>
  )
}
