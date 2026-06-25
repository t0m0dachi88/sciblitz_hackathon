import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { fetchReports } from '../api/reports'
import { THANA_COORDS } from '../data/mockReports'
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

function MapController({ selectedThana }) {
  const map = useMap()
  useEffect(() => {
    if (selectedThana && THANA_COORDS[selectedThana]) {
      map.flyTo(THANA_COORDS[selectedThana], 14, { duration: 0.8 })
    }
  }, [selectedThana, map])
  return null
}

function fmtTime(iso) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function getCoords(r) {
  if (r.lat && r.lng) return [r.lat, r.lng]
  const c = THANA_COORDS[r.thana]
  if (c) return c
  return [23.7808, 90.3927]
}

const ALL_THANAS = Object.keys(THANA_COORDS).sort()

export default function MapView() {
  const navigate = useNavigate()
  const [allReports, setAllReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [severityFilter, setSeverityFilter] = useState('All')
  const [statusFilter,   setStatusFilter]   = useState('All')
  const [selectedThana, setSelectedThana] = useState(null)

  useEffect(() => {
    fetchReports()
      .then(setAllReports)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = allReports.filter(r => {
    const okSev = severityFilter === 'All' || (r.severityLevel || r.severity) === severityFilter
    const okSta = statusFilter   === 'All' || r.status   === statusFilter
    return okSev && okSta
  })

  const sev = (r) => r.severityLevel || r.severity || 'Low'

  const counts = {
    Critical: allReports.filter(r => sev(r) === 'Critical').length,
    High:     allReports.filter(r => sev(r) === 'High').length,
    Medium:   allReports.filter(r => sev(r) === 'Medium').length,
    Low:      allReports.filter(r => sev(r) === 'Low').length,
  }

  const thanaCounts = {}
  allReports.forEach(r => {
    thanaCounts[r.thana] = (thanaCounts[r.thana] || 0) + 1
  })

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

      {/* Map + Sidebar row */}
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
            <MapController selectedThana={selectedThana} />
            {filtered.map(r => {
              const level = sev(r)
              const coords = getCoords(r)
              return (
              <CircleMarker
                key={r._id}
                center={coords}
                radius={SEVERITY_RADIUS[level] || 6}
                pathOptions={{
                  fillColor: SEVERITY_COLOR[level],
                  fillOpacity: 0.85,
                  color: SEVERITY_COLOR[level],
                  weight: 1.5,
                  opacity: 1,
                }}
              >
                <Popup className={styles.popup}>
                  <div className={styles.popupInner}>
                    <div className={styles.popupHeader}>
                      <span className={styles.popupId}>{r._id.slice(-6).toUpperCase()}</span>
                      <span className={`badge badge-${level.toLowerCase()}`}>{level}</span>
                    </div>
                    <div className={styles.popupRow}>
                      <span className={styles.popupKey}>Type</span>
                      <span className={styles.popupVal}>{r.damageType || r.category}</span>
                    </div>
                    <div className={styles.popupRow}>
                      <span className={styles.popupKey}>Thana</span>
                      <span className={styles.popupVal}>{r.thana}</span>
                    </div>
                    <div className={styles.popupRow}>
                      <span className={styles.popupKey}>Status</span>
                      <span className={`badge badge-${r.status}`}>{r.status}</span>
                    </div>
                    <p className={styles.popupDesc}>{r.aiExplanation}</p>
                    <div className={styles.popupTime}>{fmtTime(r.createdAt)}</div>
                    <button className={styles.popupBtn} onClick={() => navigate(`/report/${r._id}`)}>View Details</button>
                  </div>
                </Popup>
              </CircleMarker>
            )})}
          </MapContainer>
        </div>

        {/* Sidebar */}
        <div className={styles.sidebar}>
          {/* Thana Selector */}
          <div className={`card ${styles.thanaSelector}`}>
            <p className={styles.legendTitle}>Jump to Thana</p>
            <div className={styles.thanaList}>
              {ALL_THANAS.map(t => {
                const cnt = thanaCounts[t] || 0
                const isActive = selectedThana === t
                return (
                  <button
                    key={t}
                    className={`${styles.thanaJump} ${isActive ? styles.thanaJumpActive : ''}`}
                    onClick={() => setSelectedThana(isActive ? null : t)}
                  >
                    <span className={styles.thanaName}>{t}</span>
                    <span className={styles.thanaCount}>{cnt}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Legend */}
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
              {['pending', 'verified', 'resolved', 'rejected'].map(s => {
                const cnt = allReports.filter(r => r.status === s).length
                return (
                  <div key={s} className={styles.summaryRow}>
                    <span className={`badge badge-${s}`}>{s}</span>
                    <span className={styles.summaryCount}>{cnt} reports</span>
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
