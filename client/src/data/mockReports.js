// Synthetic Dhaka infrastructure incident data for UI development
// 12 Thanas covered: Dhanmondi, Gulshan, Mirpur, Uttara, Mohammadpur,
// Motijheel, Rampura, Khilgaon, Pallabi, Cantonment, Tejgaon, Lalbagh

export const THANAS = [
  'Dhanmondi',
  'Gulshan',
  'Mirpur',
  'Uttara',
  'Mohammadpur',
  'Motijheel',
  'Rampura',
  'Khilgaon',
  'Pallabi',
  'Cantonment',
  'Tejgaon',
  'Lalbagh',
]

// Approximate GPS center coordinates per thana
export const THANA_COORDS = {
  Dhanmondi:    [23.7461, 90.3742],
  Gulshan:      [23.7925, 90.4078],
  Mirpur:       [23.8223, 90.3654],
  Uttara:       [23.8759, 90.3795],
  Mohammadpur:  [23.7613, 90.3587],
  Motijheel:    [23.7337, 90.4196],
  Rampura:      [23.7649, 90.4310],
  Khilgaon:     [23.7524, 90.4284],
  Pallabi:      [23.8271, 90.3587],
  Cantonment:   [23.8009, 90.3982],
  Tejgaon:      [23.7728, 90.3938],
  Lalbagh:      [23.7219, 90.3860],
}

export const CATEGORIES = [
  'Road Damage',
  'Bridge Damage',
  'Flooding',
  'Electrical Hazard',
  'Structural Damage',
  'Other',
]

// Priority score formula:
// severity(40%) + infra_type(20%) + report_count(15%) + population_density(25%)
export function calcPriority(severity, category, reportCount) {
  const severityWeight = { Critical: 100, High: 75, Medium: 40, Low: 15 }
  const categoryWeight = { 'Bridge Damage': 100, 'Road Damage': 80, 'Flooding': 70, 'Electrical Hazard': 65, 'Structural Damage': 85, Other: 30 }
  const s = (severityWeight[severity] ?? 40) * 0.40
  const c = (categoryWeight[category] ?? 30) * 0.20
  const r = Math.min(reportCount * 5, 100) * 0.15
  const p = 60 * 0.25 // fixed population density placeholder
  return Math.round(s + c + r + p)
}

export const MOCK_REPORTS = [
  { id: 'RPT-001', thana: 'Mirpur',       category: 'Road Damage',       severity: 'Critical', status: 'pending',  reportCount: 14, damageType: 'Large pothole cluster, sub-base exposed',       explanation: 'Multiple large potholes with exposed sub-base causing vehicle damage and pedestrian hazard.', createdAt: '2026-06-13T14:02:00Z', lat: 23.8198, lng: 90.3671 },
  { id: 'RPT-002', thana: 'Lalbagh',      category: 'Flooding',          severity: 'Critical', status: 'pending',  reportCount: 22, damageType: 'Severe waterlogging, road submerged',            explanation: 'Road completely submerged with 60cm water depth blocking all vehicular movement.',             createdAt: '2026-06-13T13:45:00Z', lat: 23.7202, lng: 90.3855 },
  { id: 'RPT-003', thana: 'Dhanmondi',    category: 'Bridge Damage',     severity: 'Critical', status: 'verified', reportCount: 9,  damageType: 'Bridge railing collapse, structural crack',      explanation: 'Pedestrian bridge railing has collapsed on east side with visible cracks in the deck slab.',   createdAt: '2026-06-13T11:10:00Z', lat: 23.7448, lng: 90.3755 },
  { id: 'RPT-004', thana: 'Khilgaon',     category: 'Electrical Hazard', severity: 'High',     status: 'pending',  reportCount: 7,  damageType: 'Downed power line on roadway',                  explanation: 'Electric pole collapsed after storm, live wire on road creating immediate electrocution risk.',createdAt: '2026-06-13T10:33:00Z', lat: 23.7511, lng: 90.4297 },
  { id: 'RPT-005', thana: 'Motijheel',    category: 'Road Damage',       severity: 'High',     status: 'pending',  reportCount: 11, damageType: 'Road surface collapse, sinkhole forming',       explanation: 'Significant road surface collapse indicating underground pipe failure or erosion.',             createdAt: '2026-06-13T09:55:00Z', lat: 23.7344, lng: 90.4188 },
  { id: 'RPT-006', thana: 'Gulshan',      category: 'Structural Damage', severity: 'High',     status: 'verified', reportCount: 5,  damageType: 'Retaining wall crack, partial collapse risk',   explanation: 'Retaining wall along canal showing 15cm wide cracks with soil displacement.',                  createdAt: '2026-06-13T08:20:00Z', lat: 23.7938, lng: 90.4065 },
  { id: 'RPT-007', thana: 'Pallabi',      category: 'Flooding',          severity: 'High',     status: 'pending',  reportCount: 18, damageType: 'Drainage system overflow, street flood',        explanation: 'Storm drainage blocked causing 40cm water accumulation across 200m of main road.',             createdAt: '2026-06-13T07:42:00Z', lat: 23.8259, lng: 90.3601 },
  { id: 'RPT-008', thana: 'Tejgaon',      category: 'Road Damage',       severity: 'Medium',   status: 'pending',  reportCount: 6,  damageType: 'Surface cracking, rutting on main arterial',    explanation: 'Longitudinal cracks and deep rutting on heavily trafficked industrial zone road.',             createdAt: '2026-06-13T06:30:00Z', lat: 23.7741, lng: 90.3950 },
  { id: 'RPT-009', thana: 'Rampura',      category: 'Electrical Hazard', severity: 'Medium',   status: 'resolved', reportCount: 4,  damageType: 'Transformer leakage, exposed wiring on pole',  explanation: 'Transformer oil leaking with exposed wiring visible at 3m height posing fire risk.',           createdAt: '2026-06-12T22:15:00Z', lat: 23.7662, lng: 90.4322 },
  { id: 'RPT-010', thana: 'Uttara',       category: 'Road Damage',       severity: 'Medium',   status: 'verified', reportCount: 8,  damageType: 'Asphalt delamination, surface failure',         explanation: 'Asphalt surface layer separating from base course over 50m stretch near sector 7.',           createdAt: '2026-06-12T18:40:00Z', lat: 23.8748, lng: 90.3808 },
  { id: 'RPT-011', thana: 'Mohammadpur',  category: 'Structural Damage', severity: 'Medium',   status: 'pending',  reportCount: 3,  damageType: 'Footbridge beam corrosion, unsafe crossing',   explanation: 'Pedestrian footbridge main beams show heavy corrosion with partial section loss.',              createdAt: '2026-06-12T16:00:00Z', lat: 23.7601, lng: 90.3572 },
  { id: 'RPT-012', thana: 'Cantonment',   category: 'Road Damage',       severity: 'Low',      status: 'pending',  reportCount: 2,  damageType: 'Minor pothole, lane marking erosion',           explanation: 'Small pothole formation (20cm diameter) and worn lane markings on secondary road.',            createdAt: '2026-06-12T14:10:00Z', lat: 23.8017, lng: 90.3995 },
  { id: 'RPT-013', thana: 'Mirpur',       category: 'Flooding',          severity: 'High',     status: 'pending',  reportCount: 13, damageType: 'Low-lying road flood, culvert blocked',         explanation: 'Culvert completely blocked by debris causing flooding of 300m road segment.',                  createdAt: '2026-06-12T12:55:00Z', lat: 23.8241, lng: 90.3620 },
  { id: 'RPT-014', thana: 'Dhanmondi',    category: 'Electrical Hazard', severity: 'Low',      status: 'resolved', reportCount: 1,  damageType: 'Street light failure, junction dark',          explanation: 'Three consecutive street lights non-functional at major pedestrian junction.',                 createdAt: '2026-06-12T09:00:00Z', lat: 23.7475, lng: 90.3730 },
  { id: 'RPT-015', thana: 'Lalbagh',      category: 'Structural Damage', severity: 'High',     status: 'verified', reportCount: 6,  damageType: 'Boundary wall collapse, road obstruction',     explanation: 'Old boundary wall collapsed blocking one lane of road with debris pile.',                      createdAt: '2026-06-11T20:30:00Z', lat: 23.7235, lng: 90.3872 },
  { id: 'RPT-016', thana: 'Gulshan',      category: 'Road Damage',       severity: 'Low',      status: 'pending',  reportCount: 2,  damageType: 'Pavement edge crumbling, shoulder erosion',    explanation: 'Road shoulder crumbling with 10cm edge drop posing risk to cyclists.',                        createdAt: '2026-06-11T15:20:00Z', lat: 23.7912, lng: 90.4090 },
  { id: 'RPT-017', thana: 'Khilgaon',     category: 'Flooding',          severity: 'Medium',   status: 'pending',  reportCount: 9,  damageType: 'Stormwater backup, residential area flood',    explanation: 'Stormwater drain backing up flooding residential lane to 25cm depth.',                        createdAt: '2026-06-11T13:00:00Z', lat: 23.7538, lng: 90.4270 },
  { id: 'RPT-018', thana: 'Mohammadpur',  category: 'Road Damage',       severity: 'Critical', status: 'pending',  reportCount: 16, damageType: 'Full road collapse, utility trench failure',   explanation: 'Road completely collapsed over failed utility trench, 4m wide gap blocking entire road.',      createdAt: '2026-06-11T08:45:00Z', lat: 23.7628, lng: 90.3560 },
  { id: 'RPT-019', thana: 'Tejgaon',      category: 'Bridge Damage',     severity: 'High',     status: 'pending',  reportCount: 4,  damageType: 'Expansion joint failure, deck cracking',       explanation: 'Bridge expansion joint completely failed causing 3cm gap in deck surface at midspan.',         createdAt: '2026-06-10T17:30:00Z', lat: 23.7715, lng: 90.3962 },
  { id: 'RPT-020', thana: 'Pallabi',      category: 'Road Damage',       severity: 'Medium',   status: 'verified', reportCount: 7,  damageType: 'Pothole cluster, surface deterioration',       explanation: 'Cluster of 8 potholes in 100m stretch causing traffic slowdown and vehicle damage.',          createdAt: '2026-06-10T14:00:00Z', lat: 23.8285, lng: 90.3571 },
]

// Compute priority scores
MOCK_REPORTS.forEach(r => {
  r.priorityScore = calcPriority(r.severity, r.category, r.reportCount)
})

// Aggregate thana stats for Area Intelligence
export function getThanaStats() {
  return THANAS.map(thana => {
    const reports = MOCK_REPORTS.filter(r => r.thana === thana)
    const critical = reports.filter(r => r.severity === 'Critical').length
    const high     = reports.filter(r => r.severity === 'High').length
    const total    = reports.length
    const maxScore = Math.max(...reports.map(r => r.priorityScore ?? 0), 0)
    const infraScore = total === 0 ? 100 : Math.max(0, 100 - (critical * 25 + high * 10 + (total - critical - high) * 3))
    const riskLevel = infraScore < 40 ? 'Critical' : infraScore < 65 ? 'High' : infraScore < 80 ? 'Medium' : 'Low'
    const categories = {}
    reports.forEach(r => { categories[r.category] = (categories[r.category] ?? 0) + 1 })
    const topIssue = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A'
    const coords = THANA_COORDS[thana]
    return { thana, total, critical, high, infraScore, riskLevel, topIssue, maxPriority: maxScore, coords }
  }).sort((a, b) => a.infraScore - b.infraScore)
}

export function getSeverityRisk(level) {
  if (level === 'Critical') return 'critical'
  if (level === 'High')     return 'high'
  if (level === 'Medium')   return 'medium'
  return 'low'
}

export const STATS = {
  total:    MOCK_REPORTS.length,
  critical: MOCK_REPORTS.filter(r => r.severity === 'Critical').length,
  pending:  MOCK_REPORTS.filter(r => r.status === 'pending').length,
  verified: MOCK_REPORTS.filter(r => r.status === 'verified').length,
}
