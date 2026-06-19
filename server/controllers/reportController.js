import { analyzeImageWithGemini } from '../services/geminiService.js';
import Report from '../models/Report.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';

export const analyzeReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { path: imagePath, mimetype, filename } = req.file;

    // Call Gemini Service
    const aiResult = await analyzeImageWithGemini(imagePath, mimetype);

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
    const { thana, category, description, imageUrl, damage_type, severity_level, explanation } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Missing image URL' });
    }

    const newReport = new Report({
      thana,
      category,
      description,
      imageUrl,
      damageType: damage_type,
      severityLevel: severity_level,
      aiExplanation: explanation
    });

    await newReport.save();

    return res.status(201).json({ message: 'Report saved successfully', report: newReport });
  } catch (error) {
    console.error('Error saving report:', error);
    return res.status(500).json({ error: 'Failed to save report', details: error.message });
  }
};
