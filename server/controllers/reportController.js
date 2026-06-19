import { analyzeImageWithGemini } from '../services/geminiService.js';
import Report from '../models/Report.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

const THANA_COORDS = {
  Dhanmondi:   [23.7461, 90.3742],
  Gulshan:     [23.7925, 90.4078],
  Mirpur:      [23.8223, 90.3654],
  Uttara:      [23.8759, 90.3795],
  Mohammadpur: [23.7613, 90.3587],
  Motijheel:   [23.7337, 90.4196],
  Rampura:     [23.7649, 90.4310],
  Khilgaon:    [23.7524, 90.4284],
  Pallabi:     [23.8271, 90.3587],
  Cantonment:  [23.8009, 90.3982],
  Tejgaon:     [23.7728, 90.3938],
  Lalbagh:     [23.7219, 90.3860],
};

export const analyzeReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { path: imagePath, mimetype, filename } = req.file;
    const address = req.body.address || '';

    const aiResult = await analyzeImageWithGemini(imagePath, mimetype, address);

    // Cloudinary upload temporarily disabled as requested
    // const cloudinaryResult = await cloudinary.uploader.upload(imagePath, { folder: 'ncdn_cip_reports' });
    // fs.unlinkSync(imagePath);
    // const imageUrl = cloudinaryResult.secure_url;

    // Using local file upload code for now
    const imageUrl = `/uploads/${filename}`;

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

    const thanaCoords = THANA_COORDS[thana] || [];
    const newReport = new Report({
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

    return res.status(201).json({ message: 'Report saved successfully', report: newReport });
  } catch (error) {
    console.error('Error saving report:', error);
    return res.status(500).json({ error: 'Failed to save report', details: error.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const { status, thana, severity, all } = req.query;

    // Public: only show verified/resolved. Admin with ?all=true sees everything.
    const filter = {};
    if (all === 'true') {
      // requires auth — checked in route middleware
      if (status) filter.status = status;
    } else {
      filter.status = { $in: ['verified', 'resolved'] };
      if (status) filter.status = status;
    }
    if (thana) filter.thana = thana;
    if (severity) filter.severityLevel = severity;

    const reports = await Report.find(filter).sort({ createdAt: -1 });
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
    const reports = await Report.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json(reports);
  } catch (error) {
    console.error('Error fetching my reports:', error);
    return res.status(500).json({ error: 'Failed to fetch reports', details: error.message });
  }
};

export const updateReport = async (req, res) => {
  try {
    const { status, severityLevel, adminNote } = req.body;
    const updateFields = {};
    if (status) updateFields.status = status;
    if (severityLevel) updateFields.severityLevel = severityLevel;
    if (adminNote !== undefined) updateFields.adminNote = adminNote;

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
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
