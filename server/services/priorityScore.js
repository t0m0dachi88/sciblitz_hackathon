const SEVERITY_MAP = { Critical: 40, High: 30, Medium: 20, Low: 10 };

const LOCATION_TIERS = {
  tier1: ['Motijheel', 'Gulshan', 'Dhanmondi'],
  tier2: ['Mirpur', 'Uttara', 'Tejgaon', 'Lalbagh'],
};

const INFRA_MAP = {
  'Bridge': 15, 'Critical Structure': 15,
  'Road Damage': 12, 'Road': 12,
  'Electrical Hazard': 10,
  'Flooding': 8, 'Drainage': 8,
};

export function computePriorityScore(report, duplicateCount) {
  const S = SEVERITY_MAP[report.severityLevel] || 10;

  const C = duplicateCount >= 6 ? 20 : duplicateCount >= 4 ? 15 : duplicateCount >= 2 ? 10 : 0;

  const L = LOCATION_TIERS.tier1.includes(report.thana) ? 15
    : LOCATION_TIERS.tier2.includes(report.thana) ? 10 : 5;

  const I = INFRA_MAP[report.category] || 5;

  const hoursAge = (Date.now() - new Date(report.createdAt).getTime()) / 3600000;
  const T = hoursAge < 6 ? 10 : hoursAge < 24 ? 8 : hoursAge < 72 ? 5 : hoursAge < 168 ? 2 : 0;

  const score = Math.min(100, Math.max(0, S + C + L + I + T));
  const tier = score >= 80 ? 'Critical' : score >= 60 ? 'High' : score >= 40 ? 'Medium' : 'Low';

  return { score, tier };
}
