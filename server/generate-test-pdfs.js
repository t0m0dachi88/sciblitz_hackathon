import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const outDir = path.join(process.cwd(), 'test-pdfs');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

function createDoc(filename, buildFn) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(path.join(outDir, filename));
    doc.pipe(stream);
    buildFn(doc);
    doc.end();
    stream.on('finish', () => { console.log(`Created: ${filename}`); resolve(); });
  });
}

function drawBorder(doc) {
  doc.rect(40, 40, 515, 752).lineWidth(2).stroke('#1a3a5c');
  doc.rect(44, 44, 507, 744).lineWidth(0.5).stroke('#1a3a5c');
}

function drawWatermark(doc) {
  doc.save();
  doc.translate(300, 420).rotate(-45);
  doc.fontSize(48).fillColor('#cc0000').opacity(0.3);
  doc.text('SAMPLE', -150, -30, { width: 300, align: 'center' });
  doc.text('TEST DATA', -150, 30, { width: 300, align: 'center' });
  doc.fontSize(20).text('NOT AN OFFICIAL DOCUMENT', -150, 80, { width: 300, align: 'center' });
  doc.opacity(1);
  doc.restore();
}

function header(doc, org, sub, title) {
  drawBorder(doc);
  drawWatermark(doc);
  doc.fontSize(14).fillColor('#1a3a5c').font('Helvetica-Bold').text(org, 50, 60, { align: 'center', width: 500 });
  doc.fontSize(10).font('Helvetica').text(sub, { align: 'center', width: 500 });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#1a3a5c');
  doc.moveDown(0.5);
  doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center', width: 500 });
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#1a3a5c');
  doc.moveDown(1);
}

function field(doc, label, value) {
  doc.fontSize(9).fillColor('#666').font('Helvetica').text(label, 60, doc.y, { continued: true, width: 200 });
  doc.fontSize(10).fillColor('#000').font('Helvetica-Bold').text(`  ${value}`);
  doc.moveDown(0.3);
}

function bodyText(doc, text) {
  doc.fontSize(10).fillColor('#222').font('Helvetica').text(text, 60, doc.y, { width: 480, lineGap: 4 });
  doc.moveDown(0.5);
}

function signatureBlock(doc, name, title, org) {
  doc.moveDown(2);
  doc.moveTo(60, doc.y).lineTo(250, doc.y).stroke('#000');
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#000').font('Helvetica-Bold').text(name);
  doc.fontSize(9).fillColor('#444').font('Helvetica').text(title);
  doc.fontSize(9).text(org);
}

// ── DOCUMENT 1: Work Completion Certificate ──
await createDoc('work-completion-certificate.pdf', (doc) => {
  header(doc,
    'Government of the People\'s Republic of Bangladesh',
    'Dhaka Power Distribution Company Ltd. (DPDC)',
    'WORK COMPLETION CERTIFICATE'
  );

  field(doc, 'Certificate No:', 'WCC-2026-DPDC-MP10-00789');
  field(doc, 'Date:', '5 July 2026');
  field(doc, 'Project:', 'Replacement of damaged electrical pole and rewiring');
  field(doc, 'Location:', 'Mirpur 10, Road 5, Section 12, Dhaka 1216');
  field(doc, 'Contractor:', 'Dhaka Electrical Services Ltd.');
  field(doc, 'Repair Case:', 'RPR-000022');
  field(doc, 'Infrastructure ID:', 'INF-DHK-000108');
  doc.moveDown(0.5);

  bodyText(doc, 'DESCRIPTION OF WORK:');
  bodyText(doc, 'The above-referenced repair work has been completed in accordance with approved specifications:');
  bodyText(doc, '1. The damaged concrete electrical pole (leaning 15 degrees, foundation crack) has been removed and replaced with a new pre-stressed concrete pole (12m, Grade A).');
  bodyText(doc, '2. Foundation excavated to 1.8m depth with reinforced concrete base poured and cured for 72 hours.');
  bodyText(doc, '3. All overhead lines re-strung with proper tensioning. Distribution and service connections restored.');
  bodyText(doc, '4. Earthing system installed with copper rod driven to 2.5m depth. Resistance tested at 3.2 ohms.');
  bodyText(doc, '5. Warning signage and reflective markers installed at pole base.');
  bodyText(doc, '6. Site cleared and road surface restored.');
  bodyText(doc, 'Work Period: 22 June 2026 to 4 July 2026 (13 working days).');

  signatureBlock(doc, 'Engr. Mahmudul Hasan', 'Assistant Engineer', 'DPDC Mirpur Division');

  doc.moveDown(1);
  doc.fontSize(8).fillColor('#999').text('[DPDC Mirpur Division Official Stamp]', 60, doc.y, { align: 'left' });
});

// ── DOCUMENT 2: Site Inspection Report ──
await createDoc('site-inspection-report.pdf', (doc) => {
  header(doc,
    'Dhaka Power Distribution Company Ltd.',
    'Technical Audit Division',
    'SITE INSPECTION REPORT'
  );

  field(doc, 'Report No:', 'SIR-2026-DPDC-MP10-00789');
  field(doc, 'Inspection Date:', '6 July 2026');
  field(doc, 'Location:', 'Mirpur 10, Road 5, Section 12, Dhaka 1216');
  field(doc, 'Inspector:', 'Nusrat Jahan, Sub-Engineer');
  field(doc, 'Division:', 'DPDC Technical Audit Division');
  field(doc, 'Purpose:', 'Post-repair quality inspection of electrical pole replacement');
  doc.moveDown(0.5);

  bodyText(doc, 'INSPECTION FINDINGS:');
  bodyText(doc, '1. Pole Replacement: Old pole removed and new 12m pre-stressed concrete pole erected at same position. Foundation depth confirmed at 1.8m with proper concrete base. Pole is vertical within 0.5 degrees tolerance.');
  bodyText(doc, '2. Overhead Lines: All lines re-connected with proper tension. No sagging observed. Clearance from ground meets minimum 5.8m requirement.');
  bodyText(doc, '3. Earthing System: Resistance measured at 3.2 ohms (within acceptable range of <5 ohms). Copper rod properly driven and connected.');
  bodyText(doc, '4. Safety Measures: Warning signage installed. Reflective markers present. Area cordoned during work.');
  bodyText(doc, '5. Documentation: Contractor work log reviewed. Material test certificates for pole and cables verified.');
  doc.moveDown(0.3);

  bodyText(doc, 'CONCLUSION:');
  bodyText(doc, 'The replacement work meets DPDC technical standards and safety requirements. All inspected items are within acceptable tolerances. Recommended for energization and public use.');

  signatureBlock(doc, 'Nusrat Jahan', 'Sub-Engineer', 'DPDC Technical Audit Division');

  doc.moveDown(1);
  doc.fontSize(8).fillColor('#999').text('[DPDC Technical Audit Division Official Stamp]', 60, doc.y, { align: 'left' });
});

console.log('\nDone! PDFs saved in server/test-pdfs/');
