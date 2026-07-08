import Report from '../models/Report.js';
import Infrastructure from '../models/Infrastructure.js';
import RepairCase from '../models/RepairCase.js';

function pad(n, len) {
  return String(n).padStart(len, '0');
}

function randSuffix() {
  return String(Math.floor(Math.random() * 100)).padStart(2, '0');
}

export async function generateReportId() {
  const today = new Date();
  const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `RPT-${yyyymmdd}-`;

  for (let attempt = 0; attempt < 10; attempt++) {
    const count = await Report.countDocuments({
      reportId: { $regex: `^${prefix}` },
    });
    const seq = pad(count + 1 + attempt, 5);
    const id = `${prefix}${seq}`;

    const exists = await Report.findOne({ reportId: id }, { _id: 1 });
    if (!exists) return id;
  }

  return `${prefix}${pad(Date.now() % 100000, 5)}`;
}

export async function generateInfrastructureId() {
  const prefix = 'INF-DHK-';

  for (let attempt = 0; attempt < 10; attempt++) {
    const count = await Infrastructure.countDocuments({
      infrastructureId: { $regex: `^${prefix}` },
    });
    const seq = pad(count + 1 + attempt, 6);
    const id = `${prefix}${seq}`;

    const exists = await Infrastructure.findOne({ infrastructureId: id }, { _id: 1 });
    if (!exists) return id;
  }

  return `${prefix}${pad(Date.now() % 1000000, 6)}`;
}

export async function generateRepairId() {
  const prefix = 'RPR-';

  for (let attempt = 0; attempt < 10; attempt++) {
    const count = await RepairCase.countDocuments({
      repairId: { $regex: `^${prefix}` },
    });
    const seq = pad(count + 1 + attempt, 6);
    const id = `${prefix}${seq}`;

    const exists = await RepairCase.findOne({ repairId: id }, { _id: 1 });
    if (!exists) return id;
  }

  return `${prefix}${pad(Date.now() % 1000000, 6)}`;
}
