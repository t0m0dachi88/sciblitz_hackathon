import fs from 'fs';

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';
function getGroqKey() { return process.env.GROQ_API_KEY; }

const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';
const TEXT_MODEL = 'llama-3.3-70b-versatile';

async function groqRequest(body) {
  const data = JSON.stringify(body);
  const response = await fetch(GROQ_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getGroqKey()}`,
      'Content-Type': 'application/json',
    },
    body: data,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${response.status} ${err}`);
  }

  const result = await response.json();
  return result.choices?.[0]?.message?.content || '';
}

function parseJSON(text) {
  const cleaned = text.replace(/```(json)?/g, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON found in response');
  return JSON.parse(match[0]);
}

function imageToBase64(imagePath) {
  const bytes = fs.readFileSync(imagePath);
  return bytes.toString('base64');
}

function getMimeType(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  const types = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp', pdf: 'application/pdf' };
  return types[ext] || 'image/jpeg';
}

export async function analyzeImage(imagePath, address = '') {
  try {
    const base64 = imageToBase64(imagePath);
    const mimeType = getMimeType(imagePath);

    const prompt = `Analyze this infrastructure damage image. Return a JSON object with these fields:
- "damage_type" (string): type of damage observed
- "severity_level" (string): "Low", "Medium", "High", or "Critical"
- "explanation" (string): short 1-sentence reason for the severity rating
${address ? `- "lat" (number|null): estimated latitude for "${address}" in Dhaka, Bangladesh` : ''}
${address ? `- "lng" (number|null): estimated longitude for "${address}" in Dhaka, Bangladesh` : ''}`;

    const text = await groqRequest({
      model: VISION_MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      }],
      max_tokens: 512,
      temperature: 0.1,
    });

    const result = parseJSON(text);
    return {
      damage_type: result.damage_type || 'Other',
      severity_level: result.severity_level || 'Medium',
      explanation: result.explanation || 'Infrastructure damage detected.',
      lat: result.lat || null,
      lng: result.lng || null,
    };
  } catch (error) {
    console.error('AI analysis failed, using defaults:', error.message);
    return {
      damage_type: 'Other',
      severity_level: 'Medium',
      explanation: 'AI analysis unavailable. Manual review recommended.',
      lat: null,
      lng: null,
    };
  }
}

export async function validateRepairEvidence({
  originalImagePath,
  afterRepairImagePath,
  completionCertificatePath,
  siteInspectionReportPath,
  repairNotes,
  damageType,
  description,
}) {
  try {
    const content = [
      { type: 'text', text: `You are a government infrastructure repair evidence validator. Determine if the uploaded evidence is internally consistent and supports the claim that a repair has been completed.

INFRASTRUCTURE DAMAGE TYPE: ${damageType || 'Unknown'}
ORIGINAL DESCRIPTION: ${description || 'No description provided'}
REPAIR NOTES: ${repairNotes || 'No additional notes'}

Answer these questions:
1. Do the documents describe the same infrastructure?
2. Does the repair description match the uploaded after-repair image?
3. Is the original damage no longer visible in the after-repair image?
4. Does the inspection report support the claimed repair?

Do NOT authenticate documents or verify signatures. Only check internal consistency.

Return a JSON object with:
- "verificationStatus": "verified" or "needs_manual_review"
- "confidence": number 0-100
- "summary": 2-3 sentence explanation
- "concerns": array of strings (any issues found)` },
    ];

    if (afterRepairImagePath && fs.existsSync(afterRepairImagePath)) {
      const base64 = imageToBase64(afterRepairImagePath);
      content.push({ type: 'image_url', image_url: { url: `data:${getMimeType(afterRepairImagePath)};base64,${base64}` } });
    }
    if (originalImagePath && fs.existsSync(originalImagePath)) {
      const base64 = imageToBase64(originalImagePath);
      content.push({ type: 'image_url', image_url: { url: `data:${getMimeType(originalImagePath)};base64,${base64}` } });
    }

    const text = await groqRequest({
      model: VISION_MODEL,
      messages: [{ role: 'user', content }],
      max_tokens: 1024,
      temperature: 0.1,
    });

    const parsed = parseJSON(text);
    return {
      verificationStatus: parsed.verificationStatus || 'needs_manual_review',
      confidence: Math.min(100, Math.max(0, parsed.confidence || 0)),
      summary: parsed.summary || 'Evidence analysis completed.',
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
    };
  } catch (error) {
    console.error('AI evidence validation failed, using defaults:', error.message);
    return {
      verificationStatus: 'needs_manual_review',
      confidence: 0,
      summary: 'AI validation unavailable. Manual review required.',
      concerns: ['AI service unavailable — manual review needed'],
    };
  }
}

export async function generateIntelligenceReport(thana, stats) {
  try {
    const prompt = `Generate an intelligence report for ${thana} in Dhaka, Bangladesh.

RISK SCORE: ${stats.riskScore}/100
RISK LEVEL: ${stats.riskLevel}
TOTAL INCIDENTS: ${stats.incidentCount}

INCIDENT BREAKDOWN BY CATEGORY:
${Object.entries(stats.categoryStats)
  .filter(([, v]) => v.count > 0)
  .sort(([, a], [, b]) => b.count - a.count)
  .map(([type, v]) => `  ${type.replace(/_/g, ' ')}: ${v.count} incidents (risk score: ${v.score})`)
  .join('\n')}

OUTPUT FORMAT (strict JSON only):
{
  "summary": "2-3 sentence executive summary",
  "keyConcerns": ["2-4 specific top concerns"],
  "notableTrends": ["1-2 observed trends"],
  "riskExplanation": "1-2 sentence explanation of risk level",
  "recommendedActions": ["2-3 actionable recommendations"]
}`;

    const text = await groqRequest({
      model: TEXT_MODEL,
      messages: [
        { role: 'system', content: 'You are an urban infrastructure analyst. Respond with valid JSON only, no markdown.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.3,
    });

    const parsed = parseJSON(text);
    return {
      summary: parsed.summary || 'No summary generated.',
      keyConcerns: Array.isArray(parsed.keyConcerns) ? parsed.keyConcerns : [],
      notableTrends: Array.isArray(parsed.notableTrends) ? parsed.notableTrends : [],
      riskExplanation: parsed.riskExplanation || '',
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('AI report generation failed, using defaults:', error.message);
    return {
      summary: `${thana} has a risk score of ${stats.riskScore}/100 (${stats.riskLevel}). ${stats.incidentCount} incidents recorded.`,
      keyConcerns: Object.entries(stats.categoryStats)
        .filter(([, v]) => v.count > 0)
        .sort(([, a], [, b]) => b.score - a.score)
        .slice(0, 3)
        .map(([type]) => `High ${type.replace(/_/g, ' ')} activity`),
      notableTrends: [`${stats.incidentCount} total incidents in the area`],
      riskExplanation: `Risk level is ${stats.riskLevel} based on ${stats.incidentCount} incidents.`,
      recommendedActions: ['Increase patrol frequency', 'Conduct infrastructure inspection'],
      generatedAt: new Date().toISOString(),
      fallback: true,
    };
  }
}
