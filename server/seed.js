import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Report from './models/Report.js';
import { computePriorityScore } from './services/priorityScore.js';

dotenv.config();

const DUMMY_IMAGE = '/uploads/placeholder.jpg';

const THANAS = ['Dhanmondi','Gulshan','Mirpur','Uttara','Mohammadpur','Motijheel','Rampura','Khilgaon','Pallabi','Cantonment','Tejgaon','Lalbagh'];

const REPORTS_DATA = [
  // Critical — pending
  { thana: 'Mirpur',      category: 'Road Damage',       severityLevel: 'Critical', damageType: 'Large pothole cluster, sub-base exposed',                    description: 'Multiple large potholes with exposed sub-base causing vehicle damage and pedestrian hazard.',                                          hoursAgo: 2,  status: 'pending' },
  { thana: 'Lalbagh',     category: 'Flooding',          severityLevel: 'Critical', damageType: 'Severe waterlogging, road submerged',                           description: 'Road completely submerged with 60cm water depth blocking all vehicular movement.',                                                      hoursAgo: 3,  status: 'pending' },
  { thana: 'Dhanmondi',   category: 'Bridge',            severityLevel: 'Critical', damageType: 'Bridge railing collapse, structural crack',                     description: 'Pedestrian bridge railing collapsed on east side with visible cracks in the deck slab.',                                              hoursAgo: 5,  status: 'verified' },
  { thana: 'Mohammadpur', category: 'Road Damage',       severityLevel: 'Critical', damageType: 'Full road collapse, utility trench failure',                    description: 'Road completely collapsed over failed utility trench, 4m wide gap blocking entire road.',                                              hoursAgo: 8,  status: 'pending' },
  // High — mixed
  { thana: 'Khilgaon',    category: 'Electrical Hazard', severityLevel: 'High',     damageType: 'Downed power line on roadway',                                  description: 'Electric pole collapsed after storm, live wire on road creating immediate electrocution risk.',                                        hoursAgo: 6,  status: 'pending' },
  { thana: 'Motijheel',   category: 'Road Damage',       severityLevel: 'High',     damageType: 'Road surface collapse, sinkhole forming',                        description: 'Significant road surface collapse indicating underground pipe failure or erosion.',                                                    hoursAgo: 10, status: 'pending' },
  { thana: 'Gulshan',     category: 'Bridge',            severityLevel: 'High',     damageType: 'Retaining wall crack, partial collapse risk',                    description: 'Retaining wall along canal showing 15cm wide cracks with soil displacement.',                                                         hoursAgo: 12, status: 'verified' },
  { thana: 'Pallabi',     category: 'Flooding',          severityLevel: 'High',     damageType: 'Drainage system overflow, street flood',                          description: 'Storm drainage blocked causing 40cm water accumulation across 200m of main road.',                                                    hoursAgo: 15, status: 'rejected',   adminNote: 'Area already scheduled for drainage maintenance. Will be addressed next week.' },
  { thana: 'Mirpur',      category: 'Flooding',          severityLevel: 'High',     damageType: 'Low-lying road flood, culvert blocked',                          description: 'Culvert completely blocked by debris causing flooding of 300m road segment.',                                                        hoursAgo: 20, status: 'resolved' },
  { thana: 'Tejgaon',     category: 'Bridge',            severityLevel: 'High',     damageType: 'Expansion joint failure, deck cracking',                         description: 'Bridge expansion joint completely failed causing 3cm gap in deck surface at midspan.',                                                hoursAgo: 48, status: 'resolved' },
  { thana: 'Lalbagh',     category: 'Bridge',            severityLevel: 'High',     damageType: 'Boundary wall collapse, road obstruction',                        description: 'Old boundary wall collapsed blocking one lane of road with debris pile.',                                                              hoursAgo: 30, status: 'verified' },
  // Medium — mixed
  { thana: 'Tejgaon',     category: 'Road Damage',       severityLevel: 'Medium',   damageType: 'Surface cracking, rutting on main arterial',                      description: 'Longitudinal cracks and deep rutting on heavily trafficked industrial zone road.',                                                    hoursAgo: 18, status: 'pending' },
  { thana: 'Rampura',     category: 'Electrical Hazard', severityLevel: 'Medium',   damageType: 'Transformer leakage, exposed wiring on pole',                    description: 'Transformer oil leaking with exposed wiring visible at 3m height posing fire risk.',                                                  hoursAgo: 40, status: 'resolved' },
  { thana: 'Uttara',      category: 'Road Damage',       severityLevel: 'Medium',   damageType: 'Asphalt delamination, surface failure',                          description: 'Asphalt surface layer separating from base course over 50m stretch near sector 7.',                                                    hoursAgo: 36, status: 'verified' },
  { thana: 'Mohammadpur', category: 'Bridge',            severityLevel: 'Medium',   damageType: 'Footbridge beam corrosion, unsafe crossing',                     description: 'Pedestrian footbridge main beams show heavy corrosion with partial section loss.',                                                     hoursAgo: 26, status: 'rejected',   adminNote: 'Inspection scheduled for next month. Not an immediate safety risk.' },
  { thana: 'Khilgaon',    category: 'Flooding',          severityLevel: 'Medium',   damageType: 'Stormwater backup, residential area flood',                      description: 'Stormwater drain backing up flooding residential lane to 25cm depth.',                                                                hoursAgo: 50, status: 'pending' },
  { thana: 'Pallabi',     category: 'Road Damage',       severityLevel: 'Medium',   damageType: 'Pothole cluster, surface deterioration',                         description: 'Cluster of 8 potholes in 100m stretch causing traffic slowdown and vehicle damage.',                                                  hoursAgo: 60, status: 'verified' },
  { thana: 'Motijheel',   category: 'Road Damage',       severityLevel: 'Medium',   damageType: 'Road shoulder erosion, pavement edge failure',                   description: 'Road shoulder erosion with 15cm edge drop along 30m stretch near commercial area.',                                                   hoursAgo: 70, status: 'pending' },
  // Low — mixed
  { thana: 'Cantonment',  category: 'Road Damage',       severityLevel: 'Low',      damageType: 'Minor pothole, lane marking erosion',                            description: 'Small pothole formation (20cm diameter) and worn lane markings on secondary road.',                                                    hoursAgo: 45, status: 'pending' },
  { thana: 'Dhanmondi',   category: 'Electrical Hazard', severityLevel: 'Low',      damageType: 'Street light failure, junction dark',                            description: 'Three consecutive street lights non-functional at major pedestrian junction.',                                                        hoursAgo: 80, status: 'resolved' },
  { thana: 'Gulshan',     category: 'Road Damage',       severityLevel: 'Low',      damageType: 'Pavement edge crumbling, shoulder erosion',                       description: 'Road shoulder crumbling with 10cm edge drop posing risk to cyclists.',                                                                hoursAgo: 55, status: 'pending' },
  // Extra reports to increase duplicate counts for same thana+category
  { thana: 'Mirpur',      category: 'Road Damage',       severityLevel: 'High',     damageType: 'Deep pothole on Mirpur Road near bus stop',                       description: 'Deep pothole approximately 30cm wide and 15cm deep on main road near local bus stop.',                                                hoursAgo: 4,  status: 'pending' },
  { thana: 'Mirpur',      category: 'Road Damage',       severityLevel: 'Medium',   damageType: 'Road surface cracking, secondary road',                           description: 'Multiple cracks along 50m stretch of residential road in Mirpur-12.',                                                                hoursAgo: 14, status: 'pending' },
  { thana: 'Motijheel',   category: 'Road Damage',       severityLevel: 'High',     damageType: 'Manhole cover missing, open drain on road',                       description: 'Manhole cover stolen leaving open 1m deep drain on busy commercial road.',                                                            hoursAgo: 7,  status: 'pending' },
  { thana: 'Motijheel',   category: 'Road Damage',       severityLevel: 'Medium',   damageType: 'Speed breaker damage, road unevenness',                           description: 'Speed breaker completely worn down leaving uneven surface and exposed bolts on road.',                                                 hoursAgo: 22, status: 'verified' },
  { thana: 'Dhanmondi',   category: 'Flooding',          severityLevel: 'Medium',   damageType: 'Waterlogging at road intersection',                               description: 'Water accumulation at road intersection after rain, up to 20cm deep.',                                                                hoursAgo: 16, status: 'pending' },
  { thana: 'Gulshan',     category: 'Flooding',          severityLevel: 'High',     damageType: 'Storm drain overflow, road flooded',                              description: 'Storm drain overflow causing 30cm flooding of main road in Gulshan-2.',                                                               hoursAgo: 9,  status: 'pending' },
  { thana: 'Uttara',      category: 'Bridge',            severityLevel: 'High',     damageType: 'Footbridge railing loose, safety hazard',                        description: 'Footbridge railing bolts rusted and loose, railing unstable for pedestrians.',                                                         hoursAgo: 25, status: 'pending' },
  { thana: 'Lalbagh',     category: 'Flooding',          severityLevel: 'Critical', damageType: 'Severe waterlogging, residential area flooded',                  description: 'Waterlogging in residential area with 50cm water depth, homes at risk of flooding.',                                                   hoursAgo: 1,  status: 'pending' },
  { thana: 'Khilgaon',    category: 'Road Damage',       severityLevel: 'Critical', damageType: 'Major road crack, lane separation hazard',                       description: 'Major crack across full road width with 5cm lane separation creating serious accident risk.',                                          hoursAgo: 3,  status: 'verified' },
  { thana: 'Rampura',     category: 'Flooding',          severityLevel: 'Medium',   damageType: 'Drainage blockage, street waterlogging',                          description: 'Blocked drainage system causing waterlogging on main market road.',                                                                    hoursAgo: 11, status: 'pending' },
  { thana: 'Cantonment',  category: 'Electrical Hazard', severityLevel: 'High',     damageType: 'Transformer sparking, fire risk',                                description: 'Transformer sparking intermittently near residential area, risk of fire.',                                                            hoursAgo: 5,  status: 'pending' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/urbaneye');
    console.log('MongoDB connected');

    // Create citizen user
    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync('citizen123', salt);
    let citizen = await User.findOne({ email: 'citizen@test.com' });
    if (!citizen) {
      citizen = await User.create({ name: 'Test Citizen', email: 'citizen@test.com', password: hashed, role: 'citizen' });
      console.log('Citizen user created: citizen@test.com / citizen123');
    } else {
      console.log('Citizen user already exists');
    }

    // Create admin if not exists
    const adminHash = bcrypt.hashSync('admin123', salt);
    let admin = await User.findOne({ email: 'admin@ncdn.gov' });
    if (!admin) {
      admin = await User.create({ name: 'Admin', email: 'admin@ncdn.gov', password: adminHash, role: 'admin' });
      console.log('Admin user created: admin@ncdn.gov / admin123');
    } else {
      console.log('Admin user already exists');
    }

    // Clear existing reports
    await Report.deleteMany({});
    console.log('Cleared existing reports');

    // Insert reports
    const now = Date.now();
    const reports = REPORTS_DATA.map((r, i) => {
      const createdAt = new Date(now - r.hoursAgo * 3600000);
      const reportObj = {
        imageUrl: DUMMY_IMAGE,
        thana: r.thana,
        category: r.category,
        severityLevel: r.severityLevel,
        damageType: r.damageType,
        description: r.description,
        aiExplanation: r.damageType,
        status: r.status,
        adminNote: r.adminNote || undefined,
        lat: null,
        lng: null,
        userId: r.status === 'verified' || r.status === 'resolved' || i < 8 ? citizen._id : null,
        createdAt,
        updatedAt: createdAt,
      };
      const duplicateCount = REPORTS_DATA.filter(x => x.thana === r.thana && x.category === r.category).length;
      const { score, tier } = computePriorityScore(reportObj, duplicateCount);
      reportObj.priorityScore = score;
      reportObj.priorityTier = tier;
      return reportObj;
    });

    await Report.insertMany(reports);
    console.log(`Seeded ${reports.length} reports`);

    await mongoose.disconnect();
    console.log('Done. Run the app and log in with:');
    console.log('  Citizen: citizen@test.com / citizen123');
    console.log('  Admin:   admin@ncdn.gov   / admin123');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
