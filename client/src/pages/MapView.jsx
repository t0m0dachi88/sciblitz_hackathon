import { useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { MOCK_REPORTS } from '../data/mockReports'
import styles from './MapView.module.css'

const DHAKA_CENTER = [23.7808, 90.3927]
const DHAKA_ZOOM = 12

const SEVERITY_COLOR = {
  Critical: '#ef4444',
  High:     '#f97316',
  Medium:   '#eab308',
  Low:      '#3b82f6',
}

const SEVERITY_RADIUS = {
  Critical: 11,
  High:     9,
  Medium:   7,
  Low:      6,
}

const FILTERS = ['All', 'Critical', 'High', 'Medium', 'Low']

function fmtTime(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export default function MapView() {
  const [severityFilter, setSeverityFilter] = useState('All')
  const [statusFilter,   setStatusFilter]   = useState('All')

  const filtered = MOCK_REPORTS.filter(r => {
    const okSev = severityFilter === 'All' || r.severity === severityFilter
    const okSta = statusFilter   === 'All' || r.status   === statusFilter
    return okSev && okSta
  })

  const counts = {
    Critical: MOCK_REPORTS.filter(r => r.severity === 'Critical').length,
    High:     MOCK_REPORTS.filter(r => r.severity === 'High').length,
    Medium:   MOCK_REPORTS.filter(r => r.severity === 'Medium').length,
    Low:      MOCK_REPORTS.filter(r => r.severity === 'Low').length,
  }

  return (
    <div className={styles.page}>
      {/* Controls bar */}
      <div className={`card ${styles.controls}`}>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Severity</span>
          {FILTERS.map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${severityFilter === f ? styles.filterActive : ''}`}
              onClick={() => setSeverityFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <div className={styles.controlDivider} />
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Status</span>
          {['All', 'pending', 'verified', 'resolved'].map(s => (
            <button
              key={s}
              className={`${styles.filterBtn} ${statusFilter === s ? styles.filterActive : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className={styles.controlSpacer} />
        <span className={styles.countText}>{filtered.length} incidents shown</span>
      </div>

      {/* Map + Legend row */}
      <div className={styles.mapRow}>
        {/* Map */}
        <div className={styles.mapWrap}>
          <MapContainer
            center={DHAKA_CENTER}
            zoom={DHAKA_ZOOM}
            className={styles.map}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {filtered.map(r => (
              <CircleMarker
                key={r.id}
                center={[r.lat, r.lng]}
                radius={SEVERITY_RADIUS[r.severity]}
                pathOptions={{
                  fillColor: SEVERITY_COLOR[r.severity],
                  fillOpacity: 0.85,
                  color: SEVERITY_COLOR[r.severity],
                  weight: 1.5,
                  opacity: 1,
                }}
              >
                <Popup className={styles.popup}>
                  <div className={styles.popupInner}>
                    <div className={styles.popupHeader}>
                      <span className={styles.popupId}>{r.id}</span>
                      <span className={`badge badge-${r.severity.toLowerCase()}`}>{r.severity}</span>
                    </div>
                    <div className={styles.popupRow}>
                      <span className={styles.popupKey}>Type</span>
                      <span className={styles.popupVal}>{r.category}</span>
                    </div>
                    <div className={styles.popupRow}>
                      <span className={styles.popupKey}>Thana</span>
                      <span className={styles.popupVal}>{r.thana}</span>
                    </div>
                    <div className={styles.popupRow}>
                      <span className={styles.popupKey}>Status</span>
                      <span className={`badge badge-${r.status}`}>{r.status}</span>
                    </div>
                    <div className={styles.popupRow}>
                      <span className={styles.popupKey}>Reports</span>
                      <span className={styles.popupVal}>{r.reportCount} citizens</span>
                    </div>
                    <p className={styles.popupDesc}>{r.explanation}</p>
                    <div className={styles.popupTime}>{fmtTime(r.createdAt)}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Legend + summary */}
        <div className={styles.sidebar}>
          <div className={`card ${styles.legend}`}>
            <p className={styles.legendTitle}>Severity Legend</p>
            {Object.entries(SEVERITY_COLOR).map(([level, color]) => (
              <div key={level} className={styles.legendRow}>
                <span className={styles.legendDot} style={{ background: color }} />
                <span className={styles.legendLabel}>{level}</span>
                <span className={styles.legendCount}>{counts[level]}</span>
              </div>
            ))}
          </div>

          <div className={`card ${styles.summaryCard}`}>
            <p className={styles.legendTitle}>Incident Summary</p>
            <div className={styles.summaryList}>
              {['pending', 'verified', 'resolved'].map(s => {
                const cnt = MOCK_REPORTS.filter(r => r.status === s).length
                return (
                  <div key={s} className={styles.summaryRow}>
                    <span className={`badge badge-${s}`}>{s}</span>
                    <span className={styles.summaryCount}>{cnt} reports</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className={`card ${styles.thanaCard}`}>
            <p className={styles.legendTitle}>Thana Coverage</p>
            <div className={styles.thanaList}>
              {Array.from(new Set(MOCK_REPORTS.map(r => r.thana))).sort().map(t => {
                const cnt = MOCK_REPORTS.filter(r => r.thana === t).length
                const hasCritical = MOCK_REPORTS.some(r => r.thana === t && r.severity === 'Critical')
                return (
                  <div key={t} className={styles.thanaRow}>
                    <span
                      className={styles.thanaName}
                      style={{ color: hasCritical ? '#ef4444' : 'var(--text-secondary)' }}
                    >
                      {t}
                    </span>
                    <span className={styles.thanaCount}>{cnt}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
