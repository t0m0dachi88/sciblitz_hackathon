import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    const parts = [];

    const systemPrompt = `You are a government infrastructure repair evidence validator. Your job is to determine if the uploaded evidence is internally consistent and supports the claim that a repair has been completed.

You must answer these questions:
1. Do the documents describe the same infrastructure?
2. Does the repair description match the uploaded after-repair image?
3. Is the original damage no longer visible in the after-repair image?
4. Does the inspection report support the claimed repair?

Do NOT authenticate government documents or verify signatures. Only check internal consistency.

Return a JSON object with:
- "verificationStatus": "verified" or "needs_manual_review"
- "confidence": number 0-100
- "summary": 2-3 sentence explanation
- "concerns": array of strings (any issues found)`;

    const userPrompt = `INFRASTRUCTURE DAMAGE TYPE: ${damageType || 'Unknown'}
ORIGINAL DESCRIPTION: ${description || 'No description provided'}
REPAIR NOTES: ${repairNotes || 'No additional notes'}

Analyze the attached evidence files and determine if the repair claim is supported by the uploaded documents and images.`;

    parts.push({ text: systemPrompt + '\n\n' + userPrompt });

    if (originalImagePath && fs.existsSync(originalImagePath)) {
      const imgBytes = fs.readFileSync(originalImagePath);
      parts.push({
        inlineData: {
          data: imgBytes.toString('base64'),
          mimeType: 'image/jpeg',
        },
      });
    }

    if (afterRepairImagePath && fs.existsSync(afterRepairImagePath)) {
      const imgBytes = fs.readFileSync(afterRepairImagePath);
      parts.push({
        inlineData: {
          data: imgBytes.toString('base64'),
          mimeType: 'image/jpeg',
        },
      });
    }

    if (completionCertificatePath && fs.existsSync(completionCertificatePath)) {
      const pdfBytes = fs.readFileSync(completionCertificatePath);
      parts.push({
        inlineData: {
          data: pdfBytes.toString('base64'),
          mimeType: 'application/pdf',
        },
      });
    }

    if (siteInspectionReportPath && fs.existsSync(siteInspectionReportPath)) {
      const pdfBytes = fs.readFileSync(siteInspectionReportPath);
      parts.push({
        inlineData: {
          data: pdfBytes.toString('base64'),
          mimeType: 'application/pdf',
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts }],
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = text.replace(/```(json)?/g, '').trim();
    const result = JSON.parse(cleaned);

    return {
      verificationStatus: result.verificationStatus || 'needs_manual_review',
      confidence: Math.min(100, Math.max(0, result.confidence || 0)),
      summary: result.summary || 'Evidence analysis completed.',
      concerns: Array.isArray(result.concerns) ? result.concerns : [],
    };
  } catch (error) {
    console.error('Gemini Evidence Validation Error:', error);
    return {
      verificationStatus: 'needs_manual_review',
      confidence: 0,
      summary: 'AI validation failed. Manual review required.',
      concerns: ['AI validation encountered an error: ' + error.message],
    };
  }
}
