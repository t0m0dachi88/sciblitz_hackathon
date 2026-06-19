import { useState, useRef } from 'react'
import { Upload, X, AlertTriangle, CheckCircle, Loader } from 'lucide-react'
import { analyzeImage, confirmReport } from '../api/reports'
import styles from './SubmitReport.module.css'

const THANAS = [
  'Dhanmondi', 'Gulshan', 'Mirpur', 'Uttara',
  'Mohammadpur', 'Motijheel', 'Rampura', 'Khilgaon',
  'Pallabi', 'Cantonment', 'Tejgaon', 'Lalbagh',
]

const CATEGORIES = [
  'Road Damage', 'Bridge Damage', 'Flooding',
  'Electrical Hazard', 'Structural Damage', 'Other',
]

const SEVERITY_META = {
  Critical: { className: 'badge-critical', icon: AlertTriangle },
  High:     { className: 'badge-high',     icon: AlertTriangle },
  Medium:   { className: 'badge-medium',   icon: AlertTriangle },
  Low:      { className: 'badge-low',      icon: CheckCircle  },
}

// --- Mock AI result for Phase 1 UI demo ---
const MOCK_AI_RESULT = {
  damage_type: 'Road Damage — Large pothole with surface cracking',
  severity_level: 'High',
  explanation:
    'The image shows significant road surface deterioration with multiple large potholes and visible sub-base exposure, posing risk to vehicles and pedestrians.',
}

export default function SubmitReport() {
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [thana, setThana] = useState('')
  const [category, setCategory] = useState('')
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState('idle') // idle | loading | result | error | saving | success
  const [errorMessage, setErrorMessage] = useState(null)
  const [aiResult, setAiResult] = useState(null)
  const fileInputRef = useRef()

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setStatus('idle')
    setAiResult(null)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  function clearImage() {
    setImageFile(null)
    setImagePreview(null)
    setStatus('idle')
    setErrorMessage(null)
    setAiResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!imageFile) return

    setStatus('loading')
    setErrorMessage(null)
    setAiResult(null)
    
    try {
      const data = await analyzeImage(imageFile, address.trim())
      setAiResult(data)
      setStatus('result')
    } catch (error) {
      console.error(error)
      setErrorMessage(error.message)
      setStatus('error')
    }
  }

  async function handleConfirm() {
    setStatus('saving')
    try {
      const payload = {
        thana,
        category,
        description,
        imageUrl: aiResult.imageUrl,
        damage_type: aiResult.damage_type,
        severity_level: aiResult.severity_level,
        explanation: aiResult.explanation,
        lat: aiResult.lat,
        lng: aiResult.lng,
      }

      await confirmReport(payload)
      setStatus('success')
    } catch (error) {
      console.error(error)
      setStatus('error')
    }
  }

  const severityMeta = aiResult ? SEVERITY_META[aiResult.severity_level] : null
  const SeverityIcon = severityMeta?.icon

  return (
    <div className={styles.page}>
      <div className={styles.grid}>
        {/* LEFT: Form */}
        <form className={`card ${styles.formCard}`} onSubmit={handleSubmit}>
          <p className={styles.sectionLabel}>Step 1 — Upload Image</p>

          {/* Drop zone */}
          {!imagePreview ? (
            <div
              className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <Upload size={20} className={styles.dropIcon} strokeWidth={1.5} />
              <p className={styles.dropText}>Drag and drop an image, or click to select</p>
              <p className={styles.dropSub}>Supported: JPG, PNG, WEBP — Max 10 MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className={styles.hiddenInput}
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>
          ) : (
            <div className={styles.previewWrap}>
              <img src={imagePreview} alt="Preview" className={styles.preview} />
              <button
                type="button"
                className={styles.clearBtn}
                onClick={clearImage}
                aria-label="Remove image"
              >
                <X size={13} />
              </button>
              <div className={styles.previewMeta}>
                <span className="mono">{imageFile.name}</span>
                <span className={styles.previewSize}>
                  {(imageFile.size / 1024).toFixed(0)} KB
                </span>
              </div>
            </div>
          )}

          <hr className="divider" />

          <p className={styles.sectionLabel}>Step 2 — Report Details</p>

          <div className={styles.fieldGroup}>
            <div className={styles.field}>
              <label className="label" htmlFor="thana">Thana / Area</label>
              <select
                id="thana"
                className="select"
                value={thana}
                onChange={(e) => setThana(e.target.value)}
              >
                <option value="">Select thana...</option>
                {THANAS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className={styles.field}>
              <label className="label" htmlFor="category">Incident Category</label>
              <select
                id="category"
                className="select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className={styles.field} style={{ marginTop: 16 }}>
            <label className="label" htmlFor="address">Address / Location</label>
            <input
              id="address"
              className="input"
              placeholder="e.g. Mirpur 10, near Shankar bus stop, Dhaka"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className={styles.field} style={{ marginTop: 16 }}>
            <label className="label" htmlFor="description">Description</label>
            <textarea
              id="description"
              className="textarea"
              placeholder="Describe the infrastructure issue, including observed conditions and any immediate risks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <hr className="divider" />

          <div className={styles.formActions}>
            <p className={styles.actionNote}>
              AI will analyze the uploaded image and estimate damage type and severity.
            </p>
            <button
              type="submit"
              className="btn-primary"
              disabled={!imageFile || status === 'loading'}
            >
              {status === 'loading' ? (
                <><Loader size={13} className={styles.spin} /> Analyzing...</>
              ) : (
                <><Upload size={13} /> Submit for AI Analysis</>
              )}
            </button>
          </div>
        </form>

        {/* RIGHT: AI Result Panel */}
        <div className={styles.resultColumn}>
          <div className={`card ${styles.resultCard}`}>
            <p className={styles.panelTitle}>AI Analysis Result</p>

            {status === 'idle' && (
              <div className={styles.resultEmpty}>
                <div className={styles.emptyIcon}>
                  <AlertTriangle size={18} strokeWidth={1.5} />
                </div>
                <p className={styles.emptyText}>No analysis yet.</p>
                <p className={styles.emptySub}>
                  Upload an image and submit to receive AI damage classification.
                </p>
              </div>
            )}

            {status === 'loading' && (
              <div className={styles.resultEmpty}>
                <Loader size={18} className={`${styles.spin} ${styles.loadingIcon}`} strokeWidth={1.5} />
                <p className={styles.emptyText}>Analyzing image...</p>
                <p className={styles.emptySub}>Calling Gemini Vision API</p>
              </div>
            )}

            {status === 'error' && (
              <div className={styles.resultEmpty}>
                <div className={styles.emptyIcon}>
                  <AlertTriangle size={18} strokeWidth={1.5} color="#ef4444" />
                </div>
                <p className={styles.emptyText}>Analysis Failed</p>
                <p className={styles.emptySub}>{errorMessage || 'There was an error communicating with the AI service.'}</p>
              </div>
            )}

            {(status === 'result' || status === 'saving' || status === 'success') && aiResult && (
              <div className={styles.resultContent}>
                {status === 'success' ? (
                  <div className={styles.resultEmpty} style={{ padding: '32px 0' }}>
                    <CheckCircle size={32} color="#22c55e" strokeWidth={1.5} style={{ marginBottom: 16 }} />
                    <p className={styles.emptyText}>Report Submitted Successfully</p>
                    <p className={styles.emptySub}>Thank you for reporting. It has been saved to the database.</p>
                    <button className="btn-primary" style={{ marginTop: 24 }} onClick={clearImage}>
                      Submit Another Report
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>Damage Type</span>
                      <span className={styles.resultValue}>{aiResult.damage_type}</span>
                    </div>
                    <div className={styles.resultRow}>
                      <span className={styles.resultLabel}>Severity Level</span>
                      <span className={`badge badge-${aiResult.severity_level.toLowerCase()}`}>
                        {SeverityIcon && <SeverityIcon size={10} />}
                        {aiResult.severity_level}
                      </span>
                    </div>
                    {aiResult.lat && aiResult.lng && (
                      <div className={styles.resultRow}>
                        <span className={styles.resultLabel}>Estimated Location</span>
                        <span className={styles.resultValue}>{aiResult.lat.toFixed(4)}, {aiResult.lng.toFixed(4)}</span>
                      </div>
                    )}
                    <div className={styles.resultRow} style={{ flexDirection: 'column', gap: 6 }}>
                      <span className={styles.resultLabel}>AI Explanation</span>
                      <p className={styles.explanation}>{aiResult.explanation}</p>
                    </div>

                    <div className={styles.aiNote}>
                      Live Gemini Vision API Result. Confirm to save report to database.
                    </div>

                    <div className={styles.confirmActions}>
                      <button 
                        className="btn-primary" 
                        type="button" 
                        onClick={handleConfirm}
                        disabled={status === 'saving'}
                      >
                        {status === 'saving' ? <><Loader size={13} className={styles.spin}/> Saving...</> : <><CheckCircle size={13} /> Confirm &amp; Save</>}
                      </button>
                      <button className="btn-ghost" type="button" onClick={clearImage} disabled={status === 'saving'}>
                        Discard
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Guidelines card */}
          <div className={`card ${styles.guideCard}`}>
            <p className={styles.panelTitle} style={{ marginBottom: 12 }}>Reporting Guidelines</p>
            <ul className={styles.guideList}>
              <li>Capture the full extent of the damage clearly in the image.</li>
              <li>Ensure adequate lighting — avoid dark or blurry photos.</li>
              <li>Select the correct thana for accurate geographic mapping.</li>
              <li>Include any observed immediate hazard in the description.</li>
              <li>Do not submit duplicate reports for the same incident.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
