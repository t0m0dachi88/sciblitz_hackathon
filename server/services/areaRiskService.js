import Incident from '../models/Incident.js';
import Report from '../models/Report.js';

const THANAS = ['Dhanmondi','Gulshan','Mirpur','Uttara','Mohammadpur','Motijheel','Rampura','Khilgaon','Pallabi','Cantonment','Tejgaon','Lalbagh'];

const SEVERITY_POINTS = { Critical: 25, High: 15, Medium: 8, Low: 3 };
const INCIDENT_TYPES = ['theft','burglary','fire_incident','road_accident','drug_activity','public_safety_hazard','vandalism','other'];
const RECENCY_DAYS = 90;

export async function computeAreaRisk() {
  const results = [];

  for (const thana of THANAS) {
    const incidents = await Incident.find({ thana });
    const total = incidents.length;

    // Per-category scoring
    const categoryStats = {};

    for (const type of INCIDENT_TYPES) {
      const typed = incidents.filter(i => i.type === type);
      const count = typed.length;
      if (count === 0) {
        categoryStats[type] = { count: 0, score: 0, latest: null };
        continue;
      }

      // Points from each incident based on severity
      let totalPoints = 0;
      let latestTs = 0;
      for (const inc of typed) {
        totalPoints += SEVERITY_POINTS[inc.severity] || 3;
        if (inc.reportedAt.getTime() > latestTs) latestTs = inc.reportedAt.getTime();
      }

      // Recency: if the latest incident was yesterday, score is almost full
      const daysSinceLatest = (Date.now() - latestTs) / 86400000;
      const recencyFactor = Math.max(0.1, 1 - daysSinceLatest / RECENCY_DAYS);

      // Score = points * recency, capped at 100
      const rawScore = totalPoints * recencyFactor;
      const normalizedScore = Math.min(100, Math.round(rawScore));

      categoryStats[type] = { count, score: normalizedScore, latest: new Date(latestTs).toISOString() };
    }

    // Overall score: average of top 3 category scores + small density bonus
    const topScores = Object.values(categoryStats)
      .map(c => c.score)
      .sort((a, b) => b - a)
      .slice(0, 3);

    const avgTop = topScores.length > 0
      ? topScores.reduce((s, v) => s + v, 0) / topScores.length
      : 0;

    // Density bonus: more total incidents = slight bump (max +8)
    const densityBonus = Math.min(8, Math.round(total / 4));

    const riskScore = Math.min(100, Math.max(0, Math.round(avgTop + densityBonus)));
    const riskLevel = riskScore >= 60 ? 'High' : riskScore >= 30 ? 'Medium' : 'Low';

    // Gather linked infrastructure reports
    const infraReports = await Report.find({ thana, status: { $in: ['verified', 'pending'] } })
      .select('category severityLevel damageType description createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const infraIssues = infraReports.map(r => ({
      category: r.category,
      severityLevel: r.severityLevel,
      damageType: r.damageType,
      description: r.description,
      createdAt: r.createdAt,
    }));

    results.push({
      thana,
      riskScore,
      riskLevel,
      categoryStats,
      incidentCount: total,
      infraIssues,
    });
  }

  return results.sort((a, b) => b.riskScore - a.riskScore);
}

export async function getAreaProfile(thana) {
  const all = await computeAreaRisk();
  return all.find(p => p.thana === thana) || null;
}
