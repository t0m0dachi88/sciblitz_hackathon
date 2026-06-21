import { GoogleGenAI } from '@google/genai';
import AreaIntelligence from '../models/AreaIntelligence.js';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are an urban intelligence analyst for Dhaka city. Given aggregated incident data for a specific thana (neighborhood), generate a concise intelligence report.

INSTRUCTIONS:
- Analyze the data, do not invent facts.
- Do not calculate risk scores — the risk score is already provided.
- Write in professional, neutral, serious tone.
- Output STRICT JSON only, no markdown formatting.
- Each field must be a string or array of strings as specified.`;

function buildPrompt(thana, stats) {
  return `Generate an intelligence report for ${thana} in Dhaka, Bangladesh.

RISK SCORE: ${stats.riskScore}/100
RISK LEVEL: ${stats.riskLevel}
TOTAL INCIDENTS: ${stats.incidentCount}

INCIDENT BREAKDOWN BY CATEGORY:
${Object.entries(stats.categoryStats)
  .filter(([, v]) => v.count > 0)
  .sort(([, a], [, b]) => b.count - a.count)
  .map(([type, v]) => `  ${type.replace(/_/g, ' ')}: ${v.count} incidents (risk score: ${v.score})`)
  .join('\n')}

INCIDENT TYPE WITH HIGHEST COUNT: ${Object.entries(stats.categoryStats).sort(([, a], [, b]) => b.count - a.count)[0]?.[0]?.replace(/_/g, ' ') || 'None'}

OUTPUT FORMAT (strict JSON only):
{
  "summary": "2-3 sentence executive summary of the area's situation",
  "keyConcerns": ["2-4 specific top concerns"],
  "notableTrends": ["1-2 observed trends based on the data"],
  "riskExplanation": "1-2 sentence explanation of why this area has its current risk level",
  "recommendedActions": ["2-3 actionable recommendations for authorities"]
}`;
}

export async function generateIntelligenceReport(thana, stats) {
  try {
    const prompt = buildPrompt(thana, stats);

    const result = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + prompt }] }],
    });

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = text.replace(/```(json)?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const report = {
      summary: parsed.summary || 'No summary generated.',
      keyConcerns: Array.isArray(parsed.keyConcerns) ? parsed.keyConcerns : [],
      notableTrends: Array.isArray(parsed.notableTrends) ? parsed.notableTrends : [],
      riskExplanation: parsed.riskExplanation || '',
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
      generatedAt: new Date().toISOString(),
    };

    // Cache in DB
    await AreaIntelligence.updateOne(
      { thana },
      { $set: { aiReport: report, updatedAt: new Date() } }
    );

    return report;
  } catch (error) {
    console.error('Error generating intelligence report:', error.message);
    return {
      summary: 'AI report generation failed. Please try again.',
      keyConcerns: [],
      notableTrends: [],
      riskExplanation: '',
      recommendedActions: [],
      generatedAt: new Date().toISOString(),
      error: error.message,
    };
  }
}
