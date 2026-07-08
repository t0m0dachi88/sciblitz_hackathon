import { validateRepairEvidence as aiValidate } from '../services/geminiEvidenceService.js';
import { generateRepairId } from '../utils/idGenerator.js';
import RepairCase from '../models/RepairCase.js';
import RepairEvidence from '../models/RepairEvidence.js';
import Report from '../models/Report.js';
import Infrastructure from '../models/Infrastructure.js';
import imagekit from '../config/imagekit.js';
import multer from 'multer';
import fs from 'fs';

const CONFIDENCE_THRESHOLD = 70;

export const getRepairCases = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.repairStatus = status;

    const cases = await RepairCase.find(filter)
      .sort({ createdAt: -1 });

    return res.status(200).json(cases);
  } catch (error) {
    console.error('Error fetching repair cases:', error);
    return res.status(500).json({ error: 'Failed to fetch repair cases' });
  }
};

export const getRepairCaseById = async (req, res) => {
  try {
    const repairCase = await RepairCase.findOne({
      $or: [
        { repairId: req.params.repairId },
        { _id: req.params.repairId },
      ],
    });

    if (!repairCase) {
      return res.status(404).json({ error: 'Repair case not found' });
    }

    const report = await Report.findOne({ reportId: repairCase.reportId });
    const evidence = await RepairEvidence.findOne({ repairId: repairCase.repairId });

    return res.status(200).json({
      ...repairCase.toObject(),
      report: report || null,
      evidence: evidence || null,
    });
  } catch (error) {
    console.error('Error fetching repair case:', error);
    return res.status(500).json({ error: 'Failed to fetch repair case' });
  }
};

export const createRepairCase = async (req, res) => {
  try {
    const { reportId, infrastructureId, assignedAuthority, reportMongoId } = req.body;

    const report = reportMongoId
      ? await Report.findById(reportMongoId)
      : await Report.findOne({ reportId });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const finalReportId = report.reportId || reportId;
    let finalInfraId = report.infrastructureId || infrastructureId;

    if (!finalReportId) {
      return res.status(400).json({ error: 'Report has no reportId' });
    }

    if (!finalInfraId) {
      const { generateReportId, generateInfrastructureId } = await import('../utils/idGenerator.js');
      if (!report.reportId) {
        const newReportId = await generateReportId();
        await Report.findByIdAndUpdate(report._id, { reportId: newReportId });
        report.reportId = newReportId;
      }
      finalInfraId = await generateInfrastructureId();
      const infra = await Infrastructure.create({
        infrastructureId: finalInfraId,
        type: report.category,
        location: report.thana,
        thana: report.thana,
        coordinates: { lat: report.lat, lng: report.lng },
        currentStatus: 'in_repair',
        priorityScore: report.priorityScore,
        priorityTier: report.priorityTier,
      });
      await Report.findByIdAndUpdate(report._id, { infrastructureId: finalInfraId });
    }

    const repairId = await generateRepairId();
    const repairCase = await RepairCase.create({
      repairId,
      infrastructureId: finalInfraId,
      reportId: finalReportId,
      reportMongoId: report._id,
      assignedAuthority: assignedAuthority || 'Unassigned',
      repairStatus: 'in_progress',
      startedAt: new Date(),
    });

    await Report.findByIdAndUpdate(report._id, { status: 'in_repair' });
    await Infrastructure.findOneAndUpdate(
      { infrastructureId: finalInfraId },
      { currentStatus: 'in_repair' },
    );

    return res.status(201).json({
      message: 'Repair case created',
      repairCase,
    });
  } catch (error) {
    console.error('Error creating repair case:', error);
    return res.status(500).json({ error: 'Failed to create repair case', details: error.message });
  }
};

export const submitRepairEvidence = async (req, res) => {
  try {
    const {
      repairId,
      completionCertificateUrl,
      siteInspectionReportUrl,
      afterRepairImageUrl,
      repairNotes,
    } = req.body;

    if (!repairId) {
      return res.status(400).json({ error: 'repairId is required' });
    }

    const repairCase = await RepairCase.findOne({ repairId });
    if (!repairCase) {
      return res.status(404).json({ error: 'Repair case not found' });
    }

    const report = await Report.findOne({ reportId: repairCase.reportId });

    const originalPath = report?.imageUrl?.startsWith('/uploads/')
      ? `uploads/${report.imageUrl.split('/uploads/')[1]}`
      : null;
    const afterPath = afterRepairImageUrl?.startsWith('/uploads/')
      ? `uploads/${afterRepairImageUrl.split('/uploads/')[1]}`
      : null;

    let aiResult = {
      verificationStatus: 'needs_manual_review',
      confidence: 0,
      summary: 'AI validation skipped.',
      concerns: [],
    };

    try {
      aiResult = await aiValidate({
        originalImagePath: originalPath,
        afterRepairImagePath: afterPath,
        completionCertificatePath: completionCertificateUrl,
        siteInspectionReportPath: siteInspectionReportUrl,
        repairNotes: repairNotes || '',
        damageType: report?.damageType || report?.category || 'Unknown',
        description: report?.description || '',
      });
    } catch (aiErr) {
      console.error('AI validation error (continuing with defaults):', aiErr.message);
    }

    const evidenceId = `EVD-${Date.now()}`;
    const isVerified = aiResult.verificationStatus === 'verified'
      && aiResult.confidence >= CONFIDENCE_THRESHOLD;

    const evidence = await RepairEvidence.create({
      evidenceId,
      repairId,
      completionCertificate: completionCertificateUrl || '',
      siteInspectionReport: siteInspectionReportUrl || '',
      afterRepairImage: afterRepairImageUrl || '',
      repairNotes: repairNotes || '',
      aiVerificationStatus: isVerified ? 'verified' : 'needs_manual_review',
      aiConfidence: aiResult.confidence,
      aiSummary: aiResult.summary,
      aiConcerns: aiResult.concerns,
      verifiedAt: isVerified ? new Date() : undefined,
    });

    if (isVerified) {
      await RepairCase.findOneAndUpdate(
        { repairId },
        { repairStatus: 'verified_repaired', completedAt: new Date() },
      );
      if (report) {
        await Report.findByIdAndUpdate(report._id, { status: 'repaired' });
      }
      if (repairCase.infrastructureId) {
        await Infrastructure.findOneAndUpdate(
          { infrastructureId: repairCase.infrastructureId },
          { currentStatus: 'repaired' },
        );
      }
    } else {
      await RepairCase.findOneAndUpdate(
        { repairId },
        { repairStatus: 'needs_manual_review' },
      );
    }

    return res.status(201).json({
      message: isVerified
        ? 'Evidence verified — repair marked as complete'
        : 'Evidence submitted — needs manual review',
      evidence,
      aiResult,
      verified: isVerified,
    });
  } catch (error) {
    console.error('Error submitting evidence:', error);
    return res.status(500).json({ error: 'Failed to submit evidence', details: error.message });
  }
};

export const manuallyApproveRepair = async (req, res) => {
  try {
    const { repairId } = req.params;

    const repairCase = await RepairCase.findOne({ repairId });
    if (!repairCase) {
      return res.status(404).json({ error: 'Repair case not found' });
    }

    await RepairCase.findOneAndUpdate(
      { repairId },
      { repairStatus: 'verified_repaired', completedAt: new Date() },
    );

    if (repairCase.reportMongoId) {
      await Report.findByIdAndUpdate(repairCase.reportMongoId, { status: 'repaired' });
    }
    if (repairCase.infrastructureId) {
      await Infrastructure.findOneAndUpdate(
        { infrastructureId: repairCase.infrastructureId },
        { currentStatus: 'repaired' },
      );
    }

    await RepairEvidence.findOneAndUpdate(
      { repairId },
      { aiVerificationStatus: 'verified', verifiedAt: new Date(), verifiedBy: req.user?.id },
    );

    return res.status(200).json({ message: 'Repair manually approved' });
  } catch (error) {
    console.error('Error approving repair:', error);
    return res.status(500).json({ error: 'Failed to approve repair' });
  }
};

export const getRepairEvidencePublic = async (req, res) => {
  try {
    const { repairId } = req.params;

    const repairCase = await RepairCase.findOne({ repairId });
    if (!repairCase) {
      return res.status(404).json({ error: 'Repair case not found' });
    }

    if (repairCase.repairStatus !== 'verified_repaired') {
      return res.status(403).json({ error: 'Only verified repairs are publicly visible' });
    }

    const evidence = await RepairEvidence.findOne({ repairId });
    const report = await Report.findOne({ reportId: repairCase.reportId });

    return res.status(200).json({
      repairCase,
      evidence: evidence || null,
      report: report
        ? {
            reportId: report.reportId,
            thana: report.thana,
            category: report.category,
            description: report.description,
            damageType: report.damageType,
            imageUrl: report.imageUrl,
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching public repair evidence:', error);
    return res.status(500).json({ error: 'Failed to fetch repair evidence' });
  }
};
