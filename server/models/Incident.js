import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['theft', 'burglary', 'fire_incident', 'road_accident', 'drug_activity', 'public_safety_hazard', 'vandalism', 'other'],
    required: true,
  },
  thana: { type: String, required: true },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  description: { type: String },
  source: {
    type: String,
    enum: ['simulated_police', 'simulated_fire', 'simulated_accident', 'citizen_report', 'admin'],
    default: 'simulated_police',
  },
  reportedAt: { type: Date, default: Date.now },
  lat: { type: Number },
  lng: { type: Number },
}, { timestamps: true });

const Incident = mongoose.model('Incident', incidentSchema);
export default Incident;
