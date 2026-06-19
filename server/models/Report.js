import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  thana: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  damageType: { type: String },
  severityLevel: { type: String },
  aiExplanation: { type: String },
  status: { type: String, enum: ['pending', 'verified', 'resolved'], default: 'pending' },
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

const Report = mongoose.model('Report', reportSchema);

export default Report;
