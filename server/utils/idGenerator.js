import Report from '../models/Report.js';
import Infrastructure from '../models/Infrastructure.js';
import RepairCase from '../models/RepairCase.js';

export async function generateReportId() {
  const today = new Date();
  const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `RPT-${yyyymmdd}-`;
  const count = await Report.countDocuments({
    reportId: { $regex: `^${prefix}` },
  });
  const seq = String(count + 1).padStart(5, '0');
  return `${prefix}${seq}`;
}

export async function generateInfrastructureId() {
  const prefix = 'INF-DHK-';
  const count = await Infrastructure.countDocuments({
    infrastructureId: { $regex: `^${prefix}` },
  });
  const seq = String(count + 1).padStart(6, '0');
  return `${prefix}${seq}`;
}

export async function generateRepairId() {
  const prefix = 'RPR-';
  const count = await RepairCase.countDocuments({
    repairId: { $regex: `^${prefix}` },
  });
  const seq = String(count + 1).padStart(6, '0');
  return `${prefix}${seq}`;
}
