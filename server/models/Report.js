import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reportId: { type: String, unique: true, sparse: true },
  infrastructureId: { type: String, sparse: true },
  imageUrl: { type: String, required: true },
  thana: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  damageType: { type: String },
  severityLevel: { type: String },
  aiExplanation: { type: String },
  status: {
    type: String,
    enum: ['pending', 'verified', 'in_repair', 'repaired', 'resolved', 'rejected', 'false_report'],
    default: 'pending',
  },
  adminNote: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  priorityScore: { type: Number, default: 0 },
  priorityTier: { type: String, default: 'Low' },
}, {
  timestamps: true
});

const Report = mongoose.model('Report', reportSchema);

export default Report;
