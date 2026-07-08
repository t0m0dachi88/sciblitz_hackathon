import mongoose from 'mongoose';

const repairEvidenceSchema = new mongoose.Schema({
  evidenceId: { type: String, unique: true, required: true },
  repairId: { type: String, required: true },
  completionCertificate: { type: String },
  siteInspectionReport: { type: String },
  afterRepairImage: { type: String },
  repairNotes: { type: String },
  aiVerificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'needs_manual_review'],
    default: 'pending',
  },
  aiConfidence: { type: Number, default: 0 },
  aiSummary: { type: String },
  aiConcerns: [{ type: String }],
  verifiedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

const RepairEvidence = mongoose.model('RepairEvidence', repairEvidenceSchema);

export default RepairEvidence;
