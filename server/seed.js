import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Report from './models/Report.js';
import { computePriorityScore } from './services/priorityScore.js';

dotenv.config();

const DUMMY_IMAGE = '/uploads/placeholder.jpg';

const THANAS = [
  'Ramna','Shahbagh','Dhanmondi','New Market','Hazaribagh','Kalabagan',
  'Lalbagh','Kotwali','Bangshal','Chakbazar','Kamrangirchar',
  'Motijheel','Paltan','Sabujbagh','Khilgaon','Rampura','Mugdha','Shahjahanpur',
  'Wari','Sutrapur','Demra','Shyampur','Jatrabari','Kadamtali','Gendaria',
  'Tejgaon','Tejgaon Industrial Area','Mohammadpur','Adabor','Sher-e-Bangla Nagar','Hatirjheel',
  'Mirpur Model','Pallabi','Kafrul','Shah Ali','Rupnagar','Bhashantek','Darus Salam',
  'Gulshan','Badda','Khilkhet','Cantonment','Vatara','Banani',
  'Uttara East','Uttara West','Airport','Turag','Dakshinkhan','Uttarkhan',
];

const CATEGORIES = ['Road Damage','Bridge Damage','Flooding','Electrical Hazard','Structural Damage','Other'];
const SEVERITIES = ['Critical','High','Medium','Low'];

const DAMAGE_TYPES = {
  'Road Damage': [
    'Large pothole cluster, sub-base exposed', 'Road surface collapse, sinkhole forming',
    'Asphalt delamination, surface failure', 'Deep pothole on main arterial road',
    'Surface cracking and rutting', 'Manhole cover missing, open drain on road',
    'Speed breaker damage, road unevenness', 'Major road crack, lane separation hazard',
  ],
  'Bridge Damage': [
    'Bridge railing collapse, structural crack', 'Retaining wall crack, partial collapse risk',
    'Expansion joint failure, deck cracking', 'Footbridge beam corrosion, unsafe crossing',
    'Boundary wall collapse, road obstruction', 'Support column erosion, load bearing reduced',
  ],
  'Flooding': [
    'Severe waterlogging, road submerged', 'Drainage system overflow, street flood',
    'Storm drain overflow, road flooded', 'Waterlogging at road intersection',
    'Culvert blocked, low-lying area flood', 'Stormwater backup, residential area flood',
  ],
  'Electrical Hazard': [
    'Downed power line on roadway', 'Transformer leakage, exposed wiring on pole',
    'Street light failure, junction dark', 'Transformer sparking, fire risk',
    'Illegal wire tap on utility pole', 'Electrical box cover missing, live wires',
  ],
  'Structural Damage': [
    'Boundary wall collapse risk', 'Building facade cracks, falling hazard',
    'Rooftop water tank structural failure', 'Staircase railing detached',
    'Foundation settlement, wall cracking', 'Parapet wall unstable, fall risk',
  ],
  'Other': [
    'Open manhole on busy road', 'Unsecured construction site',
    'Blocked drainage causing local flooding', 'Abandoned vehicle blocking road',
    'Illegal waste dumping on sidewalk',
  ],
};

const DESCRIPTIONS = [
  'Infrastructure damage reported by local resident. Area shows signs of deterioration requiring immediate attention.',
  'Multiple complaints received about this location. Damage appears to be worsening over time.',
  'Emergency repair needed. Current condition poses safety risk to pedestrians and vehicles.',
  'Scheduled maintenance overdue. Structural assessment recommended before monsoon season.',
  'Community report with photographic evidence. Damage consistent with infrastructure aging.',
  'High-traffic area with significant wear. Repair needed to prevent further deterioration.',
  'Damage likely caused by recent heavy rainfall. Temporary barriers recommended.',
  'Report verified by local ward councilor. Urgent attention needed for public safety.',
];

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function randomLatLng(thana) {
  const coords = {
    Ramna: [23.7423, 90.4042], Shahbagh: [23.7380, 90.3957], Dhanmondi: [23.7461, 90.3742],
    'New Market': [23.7330, 90.3842], Hazaribagh: [23.7346, 90.3644], Kalabagan: [23.7478, 90.3811],
    Lalbagh: [23.7208, 90.3879], Kotwali: [23.7081, 90.4036], Bangshal: [23.7171, 90.4048],
    Chakbazar: [23.7185, 90.3941], Kamrangirchar: [23.7161, 90.3662],
    Motijheel: [23.7330, 90.4174], Paltan: [23.7369, 90.4111], Sabujbagh: [23.7367, 90.4354],
    Khilgaon: [23.7497, 90.4289], Rampura: [23.7612, 90.4214], Mugdha: [23.7294, 90.4348],
    Shahjahanpur: [23.7441, 90.4184],
    Wari: [23.7167, 90.4167], Sutrapur: [23.7111, 90.4186], Demra: [23.7181, 90.5057],
    Shyampur: [23.6934, 90.4320], Jatrabari: [23.7104, 90.4349], Kadamtali: [23.6923, 90.4497],
    Gendaria: [23.7029, 90.4253],
    Tejgaon: [23.7594, 90.3919], 'Tejgaon Industrial Area': [23.7634, 90.4042],
    Mohammadpur: [23.7658, 90.3581], Adabor: [23.7692, 90.3524],
    'Sher-e-Bangla Nagar': [23.7621, 90.3785], Hatirjheel: [23.7618, 90.4007],
    'Mirpur Model': [23.8056, 90.3625], Pallabi: [23.8239, 90.3644], Kafrul: [23.7964, 90.3853],
    'Shah Ali': [23.8033, 90.3456], Rupnagar: [23.8189, 90.3508], Bhashantek: [23.8041, 90.3934],
    'Darus Salam': [23.7885, 90.3475],
    Gulshan: [23.7925, 90.4162], Badda: [23.7844, 90.4258], Khilkhet: [23.8303, 90.4244],
    Cantonment: [23.8222, 90.4083], Vatara: [23.7978, 90.4339], Banani: [23.7939, 90.4033],
    'Uttara East': [23.8702, 90.4011], 'Uttara West': [23.8741, 90.3847],
    Airport: [23.8514, 90.4084], Turag: [23.8906, 90.3812], Dakshinkhan: [23.8678, 90.4319],
    Uttarkhan: [23.8783, 90.4419],
  };
  const c = coords[thana] || [23.75, 90.40];
  return [c[0] + (Math.random() - 0.5) * 0.01, c[1] + (Math.random() - 0.5) * 0.01];
}

function generateReports() {
  const reports = [];
  const statuses = ['pending','pending','pending','verified','verified','resolved','rejected'];
  const statusWeights = { pending: 0.5, verified: 0.2, resolved: 0.15, rejected: 0.15 };

  for (const thana of THANAS) {
    const count = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const category = randomItem(CATEGORIES);
      const severityLevel = randomItem(SEVERITIES);
      const damageType = randomItem(DAMAGE_TYPES[category] || DAMAGE_TYPES['Other']);
      const [lat, lng] = randomLatLng(thana);
      const hoursAgo = Math.floor(Math.random() * 168);

      let status = 'pending';
      const roll = Math.random();
      if (roll < 0.3) status = 'verified';
      else if (roll < 0.5) status = 'resolved';
      else if (roll < 0.6) status = 'rejected';

      reports.push({
        thana, category, severityLevel, damageType,
        description: randomItem(DESCRIPTIONS),
        status, lat, lng, hoursAgo,
      });
    }
  }
  return reports;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ncdn_cip');
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

    // Clear existing reports and infrastructure
    await Report.deleteMany({});
    await mongoose.connection.db.dropCollection('infrastructures').catch(() => {});
    console.log('Cleared existing reports and infrastructure');

    const REPORTS_DATA = generateReports();

    // Insert reports
    const now = Date.now();
    const reports = REPORTS_DATA.map((r) => {
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
        lat: r.lat,
        lng: r.lng,
        userId: r.status === 'verified' || r.status === 'resolved' ? citizen._id : null,
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
    console.log(`Seeded ${reports.length} reports across ${THANAS.length} thanas`);

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
