import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  imageUrl: { type: String, required: true },
  thana: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  damageType: { type: String },
  severityLevel: { type: String },
  aiExplanation: { type: String },
  status: { type: String, enum: ['pending', 'verified', 'resolved', 'rejected'], default: 'pending' },
  adminNote: { type: String },
  lat: { type: Number },
  lng: { type: Number },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true
});

const Report = mongoose.model('Report', reportSchema);

export default Report;
