import mongoose from 'mongoose';

const areaIntelligenceSchema = new mongoose.Schema({
  thana: { type: String, required: true, unique: true },
  riskScore: { type: Number, default: 0 },
  riskLevel: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Low' },
  categoryStats: { type: Object, default: {} },
  incidentCount: { type: Number, default: 0 },
  aiReport: { type: Object, default: null },
  infraIssues: { type: Array, default: [] },
}, { timestamps: true });

const AreaIntelligence = mongoose.model('AreaIntelligence', areaIntelligenceSchema);
export default AreaIntelligence;
