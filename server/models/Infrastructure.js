import mongoose from 'mongoose';

const infrastructureSchema = new mongoose.Schema({
  infrastructureId: { type: String, unique: true, required: true },
  type: { type: String, required: true },
  location: { type: String, required: true },
  thana: { type: String, required: true },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
  currentStatus: {
    type: String,
    enum: ['reported', 'verified', 'in_repair', 'repaired', 'false_report'],
    default: 'reported',
  },
  priorityScore: { type: Number, default: 0 },
  priorityTier: { type: String, default: 'Low' },
}, {
  timestamps: true,
});

const Infrastructure = mongoose.model('Infrastructure', infrastructureSchema);

export default Infrastructure;
