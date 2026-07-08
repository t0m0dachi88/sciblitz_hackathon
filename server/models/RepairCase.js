import mongoose from 'mongoose';

const repairCaseSchema = new mongoose.Schema({
  repairId: { type: String, unique: true, required: true },
  infrastructureId: { type: String, required: true },
  reportId: { type: String, required: true },
  reportMongoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Report' },
  assignedAuthority: { type: String, default: 'Unassigned' },
  repairStatus: {
    type: String,
    enum: ['in_progress', 'evidence_submitted', 'ai_verified', 'needs_manual_review', 'verified_repaired'],
    default: 'in_progress',
  },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
}, {
  timestamps: true,
});

const RepairCase = mongoose.model('RepairCase', repairCaseSchema);

export default RepairCase;
