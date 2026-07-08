import { generateIntelligenceReport as generateReport } from './hfService.js';
import AreaIntelligence from '../models/AreaIntelligence.js';

export async function generateIntelligenceReport(thana, stats) {
  try {
    const report = await generateReport(thana, stats);

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
