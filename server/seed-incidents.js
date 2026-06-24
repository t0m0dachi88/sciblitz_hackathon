import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Incident from './models/Incident.js';
import { computeAreaRisk } from './services/areaRiskService.js';
import AreaIntelligence from './models/AreaIntelligence.js';

dotenv.config();

const THANAS = ['Dhanmondi','Gulshan','Mirpur','Uttara','Mohammadpur','Motijheel','Rampura','Khilgaon','Pallabi','Cantonment','Tejgaon','Lalbagh'];

const INCIDENT_TYPES = ['theft','burglary','fire_incident','road_accident','drug_activity','public_safety_hazard','vandalism','other'];
const SEVERITIES = ['Low','Medium','High','Critical'];
const SOURCES = ['simulated_police','simulated_fire','simulated_accident'];

const DESCRIPTIONS = {
  theft: [
    'Mobile phone snatched from pedestrian near market',
    'Wallet stolen from crowded bus stop',
    'Bicycle stolen from residential compound',
    'Pickpocketing incident at local bazaar',
    'Bag snatched from rickshaw passenger',
    'Shoplifting reported at retail store',
    'Theft from parked vehicle overnight',
    'Cash stolen from shop counter during rush hour',
  ],
  burglary: [
    'Residential flat broken into during daytime',
    'Shop shutter forced open overnight',
    'Electronic goods stolen from apartment',
    'House burglary while occupants were away',
    'Store broken into, cash register stolen',
    'Office equipment stolen from ground floor',
  ],
  fire_incident: [
    'Electrical short circuit caused minor fire in kitchen',
    'Gas cylinder leak led to house fire',
    'Fire broke out in garment factory storage room',
    'Market stall fire quickly contained by locals',
    'Transformer fire near residential building',
    'Waste pile set on fire in vacant lot',
  ],
  road_accident: [
    'Motorbike collided with rickshaw at intersection',
    'Pedestrian hit by speeding car on main road',
    'Three-vehicle pile-up at traffic signal',
    'Bus and CNG collision near bus stop',
    'Truck hit roadside vendor stall',
    'Car lost control and hit road divider',
    'Minor collision between two bikes in narrow lane',
    'School van involved in side-swipe accident',
  ],
  drug_activity: [
    'Suspected drug deal observed in alley',
    'Drug paraphernalia found in public park',
    'Raided stash house in residential area',
    'Individual found in possession of illegal substances',
    'Drug peddling reported near school area',
  ],
  public_safety_hazard: [
    'Open manhole on busy road',
    'Unsecured construction site with falling debris risk',
    'Stray dog pack aggressive towards pedestrians',
    'Broken streetlight creating dark zone at night',
    'Illegal dumping of construction waste on road',
    'Exposed electrical wiring on public pole',
  ],
  vandalism: [
    'Vehicle windows smashed overnight',
    'Graffiti sprayed on public building wall',
    'Bus stop shelter glass shattered',
    'Road sign damaged and knocked down',
    'Park bench destroyed in community park',
    'Street light post bent and damaged',
  ],
  other: [
    'Suspicious abandoned bag reported',
    'Noise complaint from residential area',
    'Water main burst flooding street',
    'Illegal billboard collapse risk',
    'Blocked drainage causing local flooding',
  ],
};

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateIncidents() {
  const incidents = [];

  // Define distinct risk profiles for each thana
  const profiles = {
    Mirpur:       { theft: 0.25, burglary: 0.1, fire_incident: 0.1, road_accident: 0.35, drug_activity: 0.05, public_safety_hazard: 0.05, vandalism: 0.05, other: 0.05, count: 28, highSev: 0.4 },
    Gulshan:      { theft: 0.2,  burglary: 0.15, fire_incident: 0.05, road_accident: 0.15, drug_activity: 0.15, public_safety_hazard: 0.1, vandalism: 0.1, other: 0.1, count: 20, highSev: 0.25 },
    Dhanmondi:    { theft: 0.2,  burglary: 0.1, fire_incident: 0.1, road_accident: 0.2, drug_activity: 0.1, public_safety_hazard: 0.1, vandalism: 0.1, other: 0.1, count: 22, highSev: 0.3 },
    Uttara:       { theft: 0.2,  burglary: 0.1, fire_incident: 0.05, road_accident: 0.25, drug_activity: 0.1, public_safety_hazard: 0.1, vandalism: 0.1, other: 0.1, count: 20, highSev: 0.3 },
    Mohammadpur:  { theft: 0.2,  burglary: 0.1, fire_incident: 0.1, road_accident: 0.2, drug_activity: 0.15, public_safety_hazard: 0.05, vandalism: 0.1, other: 0.1, count: 18, highSev: 0.35 },
    Motijheel:    { theft: 0.3,  burglary: 0.1, fire_incident: 0.05, road_accident: 0.2, drug_activity: 0.05, public_safety_hazard: 0.1, vandalism: 0.1, other: 0.1, count: 18, highSev: 0.3 },
    Lalbagh:      { theft: 0.15, burglary: 0.1, fire_incident: 0.1, road_accident: 0.15, drug_activity: 0.25, public_safety_hazard: 0.1, vandalism: 0.1, other: 0.05, count: 18, highSev: 0.4 },
    Khilgaon:     { theft: 0.15, burglary: 0.1, fire_incident: 0.1, road_accident: 0.2, drug_activity: 0.15, public_safety_hazard: 0.1, vandalism: 0.1, other: 0.1, count: 16, highSev: 0.3 },
    Rampura:      { theft: 0.15, burglary: 0.05, fire_incident: 0.1, road_accident: 0.2, drug_activity: 0.15, public_safety_hazard: 0.15, vandalism: 0.1, other: 0.1, count: 14, highSev: 0.25 },
    Tejgaon:      { theft: 0.2,  burglary: 0.1, fire_incident: 0.15, road_accident: 0.15, drug_activity: 0.05, public_safety_hazard: 0.1, vandalism: 0.15, other: 0.1, count: 16, highSev: 0.3 },
    Pallabi:      { theft: 0.15, burglary: 0.1, fire_incident: 0.1, road_accident: 0.25, drug_activity: 0.1, public_safety_hazard: 0.1, vandalism: 0.1, other: 0.1, count: 14, highSev: 0.25 },
    Cantonment:   { theft: 0.1,  burglary: 0.05, fire_incident: 0.1, road_accident: 0.25, drug_activity: 0.05, public_safety_hazard: 0.15, vandalism: 0.05, other: 0.25, count: 12, highSev: 0.2 },
  };

  const now = Date.now();

  for (const thana of THANAS) {
    const profile = profiles[thana];
    const total = profile.count;

    for (let i = 0; i < total; i++) {
      // Weighted random type based on profile
      let r = Math.random();
      let type = 'other';
      for (const [t, weight] of Object.entries(profile)) {
        if (INCIDENT_TYPES.includes(t)) {
          r -= weight;
          if (r <= 0) { type = t; break; }
        }
      }

      const severityRoll = Math.random();
      const severity = severityRoll < profile.highSev / 2 ? 'Critical'
        : severityRoll < profile.highSev ? 'High'
        : severityRoll < profile.highSev + 0.3 ? 'Medium'
        : 'Low';

      const source = type === 'fire_incident' ? 'simulated_fire'
        : type === 'road_accident' ? 'simulated_accident'
        : 'simulated_police';

      // Spread incidents over last 60 days
      const daysAgo = Math.floor(Math.random() * 60);
      const hoursAgo = Math.floor(Math.random() * 24);
      const reportedAt = new Date(now - daysAgo * 86400000 - hoursAgo * 3600000);

      incidents.push({
        type,
        thana,
        severity,
        description: randomItem(DESCRIPTIONS[type] || DESCRIPTIONS.other),
        source,
        reportedAt,
      });
    }
  }

  return incidents;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ncdn_cip');
    console.log('MongoDB connected');

    await Incident.deleteMany({});
    await AreaIntelligence.deleteMany({});
    console.log('Cleared existing incidents and area intelligence');

    const incidents = generateIncidents();
    await Incident.insertMany(incidents);
    console.log(`Seeded ${incidents.length} incident records`);

    // Compute and store area risk profiles
    const thanaProfiles = await computeAreaRisk();
    const docs = thanaProfiles.map(p => ({
      thana: p.thana,
      riskScore: p.riskScore,
      riskLevel: p.riskLevel,
      categoryStats: p.categoryStats,
      incidentCount: p.incidentCount,
      infraIssues: p.infraIssues,
      updatedAt: new Date(),
    }));
    await AreaIntelligence.insertMany(docs);
    console.log('Computed and stored area risk profiles for', docs.length, 'thanas');

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
