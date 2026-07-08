import { computeAreaRisk, getAreaProfile } from '../services/areaRiskService.js';
import { generateIntelligenceReport } from '../services/areaIntelligenceService.js';
import Incident from '../models/Incident.js';
import AreaIntelligence from '../models/AreaIntelligence.js';
import Report from '../models/Report.js';

export async function getAreaProfiles(req, res) {
  try {
    let profiles = await AreaIntelligence.find({}).lean();
    if (profiles.length === 0) {
      profiles = await computeAreaRisk();
    }
    return res.status(200).json(profiles);
  } catch (error) {
    console.error('Error fetching area profiles:', error);
    return res.status(500).json({ error: 'Failed to fetch area profiles' });
  }
}

export async function getAreaProfileHandler(req, res) {
  try {
    const { thana } = req.params;
    let profile = await AreaIntelligence.findOne({ thana }).lean();

    if (!profile) {
      const computed = await getAreaProfile(thana);
      if (!computed) return res.status(404).json({ error: 'Thana not found' });
      profile = computed;
    }

    // Attach recent incidents
    const recentIncidents = await Incident.find({ thana })
      .sort({ reportedAt: -1 })
      .limit(10)
      .lean();

    // Attach unresolved infrastructure reports
    const infraReports = await Report.find({ thana, status: { $in: ['pending', 'verified'] } })
      .select('category severityLevel damageType description createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return res.status(200).json({ ...profile, recentIncidents, infraReports });
  } catch (error) {
    console.error('Error fetching area profile:', error);
    return res.status(500).json({ error: 'Failed to fetch area profile' });
  }
}

export async function getLeaderboard(req, res) {
  try {
    let profiles = await AreaIntelligence.find({}).sort({ riskScore: -1 }).lean();
    if (profiles.length === 0) {
      profiles = await computeAreaRisk();
    }
    const board = profiles.map((p, i) => ({
      rank: i + 1,
      thana: p.thana,
      riskScore: p.riskScore,
      riskLevel: p.riskLevel,
      incidentCount: p.incidentCount,
      topCategory: Object.entries(p.categoryStats || {})
        .sort(([, a], [, b]) => b.count - a.count)[0]?.[0] || null,
    }));
    return res.status(200).json(board);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}

export async function getCategoryLeaderboard(req, res) {
  try {
    const { category } = req.params;
    let profiles = await AreaIntelligence.find({}).lean();
    if (profiles.length === 0) {
      profiles = await computeAreaRisk();
    }

    const board = profiles
      .map(p => ({
        thana: p.thana,
        score: p.categoryStats?.[category]?.score || 0,
        count: p.categoryStats?.[category]?.count || 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ rank: i + 1, ...p }));

    return res.status(200).json(board);
  } catch (error) {
    console.error('Error fetching category leaderboard:', error);
    return res.status(500).json({ error: 'Failed to fetch category leaderboard' });
  }
}

export async function generateAIReport(req, res) {
  try {
    const { thana } = req.params;

    let stats = await AreaIntelligence.findOne({ thana }).lean();
    if (!stats) {
      const computed = await getAreaProfile(thana);
      if (!computed) return res.status(404).json({ error: 'Thana not found' });
      stats = computed;
    }

    const report = await generateIntelligenceReport(thana, stats);
    return res.status(200).json(report);
  } catch (error) {
    console.error('Error generating AI report:', error);
    return res.status(500).json({ error: 'Failed to generate AI report' });
  }
}

export async function getIncidents(req, res) {
  try {
    const { type, thana, severity, limit } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (thana) filter.thana = thana;
    if (severity) filter.severity = severity;

    const incidents = await Incident.find(filter)
      .sort({ reportedAt: -1 })
      .limit(parseInt(limit) || 50)
      .lean();

    return res.status(200).json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return res.status(500).json({ error: 'Failed to fetch incidents' });
  }
}

export async function getTimeline(req, res) {
  try {
    const { thana } = req.params;
    const { months } = req.query;
    const monthCount = parseInt(months) || 6;

    const since = new Date();
    since.setMonth(since.getMonth() - monthCount);

    const incidents = await Incident.find({ thana, reportedAt: { $gte: since } }).lean();

    const monthMap = {};
    for (let i = 0; i < monthCount; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (monthCount - 1 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = { month: key, total: 0, theft: 0, burglary: 0, fire_incident: 0, road_accident: 0, drug_activity: 0, public_safety_hazard: 0, vandalism: 0, other: 0 };
    }

    for (const inc of incidents) {
      const d = new Date(inc.reportedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap[key]) {
        monthMap[key].total++;
        if (monthMap[key][inc.type] !== undefined) monthMap[key][inc.type]++;
      }
    }

    return res.status(200).json(Object.values(monthMap));
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return res.status(500).json({ error: 'Failed to fetch timeline' });
  }
}
