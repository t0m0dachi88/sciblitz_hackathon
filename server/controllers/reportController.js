import { analyzeImageWithGemini } from '../services/geminiService.js';
import { computePriorityScore } from '../services/priorityScore.js';
import { generateReportId, generateInfrastructureId } from '../utils/idGenerator.js';
import Report from '../models/Report.js';
import Infrastructure from '../models/Infrastructure.js';
import imagekit from '../config/imagekit.js';
import fs from 'fs';

const THANA_COORDS = {
  // Ramna Division
  Ramna:            [23.7423, 90.4042],
  Shahbagh:         [23.7380, 90.3957],
  Dhanmondi:        [23.7461, 90.3742],
  'New Market':     [23.7330, 90.3842],
  Hazaribagh:       [23.7346, 90.3644],
  Kalabagan:        [23.7478, 90.3811],
  // Lalbagh Division
  Lalbagh:          [23.7208, 90.3879],
  Kotwali:          [23.7081, 90.4036],
  Bangshal:         [23.7171, 90.4048],
  Chakbazar:        [23.7185, 90.3941],
  Kamrangirchar:    [23.7161, 90.3662],
  // Motijheel Division
  Motijheel:        [23.7330, 90.4174],
  Paltan:           [23.7369, 90.4111],
  Sabujbagh:        [23.7367, 90.4354],
  Khilgaon:         [23.7497, 90.4289],
  Rampura:          [23.7612, 90.4214],
  Mugdha:           [23.7294, 90.4348],
  Shahjahanpur:     [23.7441, 90.4184],
  // Wari Division
  Wari:             [23.7167, 90.4167],
  Sutrapur:         [23.7111, 90.4186],
  Demra:            [23.7181, 90.5057],
  Shyampur:         [23.6934, 90.4320],
  Jatrabari:        [23.7104, 90.4349],
  Kadamtali:        [23.6923, 90.4497],
  Gendaria:         [23.7029, 90.4253],
  // Tejgaon Division
  Tejgaon:          [23.7594, 90.3919],
  'Tejgaon Industrial Area': [23.7634, 90.4042],
  Mohammadpur:      [23.7658, 90.3581],
  Adabor:           [23.7692, 90.3524],
  'Sher-e-Bangla Nagar': [23.7621, 90.3785],
  Hatirjheel:       [23.7618, 90.4007],
  // Mirpur Division
  'Mirpur Model':   [23.8056, 90.3625],
  Pallabi:          [23.8239, 90.3644],
  Kafrul:           [23.7964, 90.3853],
  'Shah Ali':       [23.8033, 90.3456],
  Rupnagar:         [23.8189, 90.3508],
  Bhashantek:       [23.8041, 90.3934],
  'Darus Salam':    [23.7885, 90.3475],
  // Gulshan Division
  Gulshan:          [23.7925, 90.4162],
  Badda:            [23.7844, 90.4258],
  Khilkhet:         [23.8303, 90.4244],
  Cantonment:       [23.8222, 90.4083],
  Vatara:           [23.7978, 90.4339],
  Banani:           [23.7939, 90.4033],
  // Uttara Division
  'Uttara East':    [23.8702, 90.4011],
  'Uttara West':    [23.8741, 90.3847],
  Airport:          [23.8514, 90.4084],
  Turag:            [23.8906, 90.3812],
  Dakshinkhan:      [23.8678, 90.4319],
  Uttarkhan:        [23.8783, 90.4419],
};

export const analyzeReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { path: imagePath, mimetype, filename } = req.file;
    const address = req.body.address || '';

    const aiResult = await analyzeImageWithGemini(imagePath, mimetype, address);

    let imageUrl;
    try {
      const ikResponse = await imagekit.files.upload({
        file: fs.createReadStream(imagePath),
        fileName: filename,
      });
      fs.unlinkSync(imagePath);
      imageUrl = ikResponse.url;
    } catch (ikErr) {
      console.warn('ImageKit upload failed, using local file:', ikErr.message);
      imageUrl = `/uploads/${filename}`;
    }

    return res.status(200).json({ ...aiResult, imageUrl });
  } catch (error) {
    console.error('Error in analyzeReport:', error);
    // Cleanup on error too
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ error: 'Failed to analyze report', details: error.message });
  }
};

export const saveReport = async (req, res) => {
  try {
    const { thana, category, description, imageUrl, damage_type, severity_level, explanation, lat, lng } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing image URL' });
    }

    const [reportId, infrastructureId] = await Promise.all([
      generateReportId(),
      generateInfrastructureId(),
    ]);

    const thanaCoords = THANA_COORDS[thana] || [];
    const newReport = new Report({
      reportId,
      infrastructureId,
      thana,
      category,
      description,
      imageUrl,
      damageType: damage_type,
      severityLevel: severity_level,
      aiExplanation: explanation,
      lat: lat ?? thanaCoords[0] ?? null,
      lng: lng ?? thanaCoords[1] ?? null,
      userId: req.user?.id || null,
    });

    await newReport.save();

    await Infrastructure.create({
      infrastructureId,
      type: category,
      location: thana,
      thana,
      coordinates: { lat: newReport.lat, lng: newReport.lng },
      currentStatus: 'reported',
      priorityScore: newReport.priorityScore,
      priorityTier: newReport.priorityTier,
    });

    const duplicateCount = await Report.countDocuments({ thana, category });
    const { score, tier } = computePriorityScore(newReport, duplicateCount + 1);
    await Report.findByIdAndUpdate(newReport._id, { priorityScore: score, priorityTier: tier });
    newReport.priorityScore = score;
    newReport.priorityTier = tier;

    return res.status(201).json({ message: 'Report saved successfully', report: newReport });
  } catch (error) {
    console.error('Error saving report:', error);
    return res.status(500).json({ error: 'Failed to save report', details: error.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const { status, thana, severity, all, page, limit } = req.query;

    // Public: only show verified/resolved. Admin with ?all=true sees everything.
    const filter = {};
    if (all === 'true') {
      if (status) filter.status = status;
    } else {
      filter.status = { $in: ['verified', 'resolved'] };
      if (status) filter.status = status;
    }
    if (thana) filter.thana = thana;
    if (severity) filter.severityLevel = severity;

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const total = await Report.countDocuments(filter);
      const reports = await Report.find(filter)
        .sort({ priorityScore: -1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);
      return res.status(200).json({ reports, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    }

    const reports = await Report.find(filter).sort({ priorityScore: -1, createdAt: -1 });
    return res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return res.status(500).json({ error: 'Failed to fetch reports', details: error.message });
  }
};

export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    return res.status(200).json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    return res.status(500).json({ error: 'Failed to fetch report', details: error.message });
  }
};

export const getMyReports = async (req, res) => {
  try {
    const { page, limit } = req.query;

    if (page && limit) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const filter = { userId: req.user.id };
      const total = await Report.countDocuments(filter);
      const reports = await Report.find(filter)
        .sort({ priorityScore: -1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);
      return res.status(200).json({ reports, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    }

    const reports = await Report.find({ userId: req.user.id }).sort({ priorityScore: -1, createdAt: -1 });
    return res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching my reports:', error);
    return res.status(500).json({ error: 'Failed to fetch reports', details: error.message });
  }
};

export const updateReport = async (req, res) => {
  try {
    const { status, severityLevel, adminNote } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (status) report.status = status;
    if (severityLevel) report.severityLevel = severityLevel;
    if (adminNote !== undefined) report.adminNote = adminNote;

    const duplicateCount = await Report.countDocuments({ thana: report.thana, category: report.category });
    const { score, tier } = computePriorityScore(report, duplicateCount);
    report.priorityScore = score;
    report.priorityTier = tier;

    await report.save();

    return res.status(200).json({ message: 'Report updated successfully', report });
  } catch (error) {
    console.error('Error updating report:', error);
    return res.status(500).json({ error: 'Failed to update report', details: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const visibleStatuses = ['verified', 'resolved'];
    const all = req.query.all === 'true';

    const statusFilter = all ? {} : { status: { $in: visibleStatuses } };
    const total = await Report.countDocuments(statusFilter);
    const pending = await Report.countDocuments({ status: 'pending' });
    const verified = await Report.countDocuments({ status: 'verified' });
    const resolved = await Report.countDocuments({ status: 'resolved' });
    const rejected = await Report.countDocuments({ status: 'rejected' });

    const severityFilter = (level) => all
      ? { severityLevel: level }
      : { severityLevel: level, status: { $in: visibleStatuses } };

    const critical = await Report.countDocuments(severityFilter('Critical'));
    const high = await Report.countDocuments(severityFilter('High'));
    const medium = await Report.countDocuments(severityFilter('Medium'));
    const low = await Report.countDocuments(severityFilter('Low'));

    return res.status(200).json({
      total,
      pending,
      verified,
      resolved,
      rejected,
      critical,
      high,
      medium,
      low,
      resolutionRate: total > 0 ? Math.round(((verified + resolved) / total) * 100) : 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return res.status(500).json({ error: 'Failed to fetch stats', details: error.message });
  }
};
