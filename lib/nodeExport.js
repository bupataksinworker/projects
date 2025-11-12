// lib/nodeExport.js
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const BACKUP_DIR = process.env.BACKUP_DIR || path.resolve(__dirname, '..', 'mongo_backup');
const DRIVE_TARGET = process.env.DRIVE_TARGET || 'G:\\My Drive\\MongoBackups';

function isBSONObjectId(v) {
  return v && (v._bsontype === 'ObjectID' || v._bsontype === 'ObjectId');
}

function collectPaths(obj, prefix = '', set) {
  if (!obj || typeof obj !== 'object') return;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const p = prefix ? `${prefix}.${k}` : k;
    set.add(p);
    if (v && typeof v === 'object' && !isBSONObjectId(v) && !Array.isArray(v) && !(v instanceof Date)) {
      collectPaths(v, p, set);
    }
  }
}

function flatten(obj, prefix = '', out = {}) {
  if (obj === null || obj === undefined) return out;
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    const p = prefix ? `${prefix}.${k}` : k;
    if (v === null || v === undefined) {
      out[p] = '';
    } else if (Array.isArray(v)) {
      try { out[p] = JSON.stringify(v); } catch (e) { out[p] = String(v); }
    } else if (isBSONObjectId(v)) {
      out[p] = v.toString();
    } else if (v instanceof Date) {
      out[p] = v.toISOString();
    } else if (typeof v === 'object') {
      // nested
      flatten(v, p, out);
    } else {
      out[p] = v;
    }
  }
  return out;
}

function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (s.indexOf('"') !== -1) return '"' + s.replace(/"/g, '""') + '"';
  if (s.indexOf(',') !== -1 || s.indexOf('\n') !== -1 || s.indexOf('\r') !== -1) return '"' + s + '"';
  return s;
}

async function exportCollectionToCSV(collection, fieldsString = '') {
  if (!/^[a-z0-9_]+$/i.test(collection)) throw new Error('Invalid collection name');
  if (fieldsString && !/^[a-z0-9_,\.\$\-]+$/i.test(fieldsString)) throw new Error('Invalid fields');

  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const TMP_CSV = path.join(BACKUP_DIR, `${collection}.tmp.csv`);
  const CSV_FILE = path.join(BACKUP_DIR, `${collection}.csv`);
  const BOM = Buffer.from([0xEF, 0xBB, 0xBF]);

  const db = mongoose.connection.db;

  // determine headers
  let headers = [];
  if (fieldsString && fieldsString.trim()) {
    headers = fieldsString.split(',').map(s => s.trim()).filter(Boolean);
  } else {
    // try find model schema
    const models = mongoose.models || {};
    const foundModel = Object.values(models).find(m => m.collection && m.collection.name === collection);
    if (foundModel && foundModel.schema) {
      headers = Object.keys(foundModel.schema.paths || {}).filter(k => /^[a-z0-9_\.\$\-]+$/i.test(k));
    }
    if (!headers.length) {
      // sample a few docs
      const samples = await db.collection(collection).aggregate([{ $sample: { size: 200 } }]).toArray().catch(() => []);
      const set = new Set();
      for (const doc of samples) collectPaths(doc, '', set);
      headers = Array.from(set).filter(k => /^[a-z0-9_\.\$\-]+$/i.test(k));
    }
  }

  // ensure _id present first
  if (!headers.includes('_id')) headers.unshift('_id');
  // remove duplicates while preserving order
  headers = Array.from(new Set(headers));

  // open write stream
  const ws = fs.createWriteStream(TMP_CSV, { encoding: 'utf8' });
  // write BOM
  ws.write(BOM);
  // write header
  ws.write(headers.map(h => csvEscape(h)).join(',') + '\r\n');

  // stream documents
  const cursor = db.collection(collection).find({}, { batchSize: 1000 });
  try {
    for await (const doc of cursor) {
      const flat = flatten(doc, '');
      const row = headers.map(h => csvEscape(flat.hasOwnProperty(h) ? flat[h] : '')).join(',');
      ws.write(row + '\r\n');
    }
  } catch (err) {
    ws.end();
    throw err;
  }

  ws.end();
  // ensure finished
  await new Promise((resolve, reject) => { ws.on('finish', resolve); ws.on('error', reject); });

  // move tmp to final
  try { fs.renameSync(TMP_CSV, CSV_FILE); } catch (e) { /* fallback copy */ fs.copyFileSync(TMP_CSV, CSV_FILE); fs.unlinkSync(TMP_CSV); }

  // copy to drive target if exists
  try {
    if (fs.existsSync(DRIVE_TARGET)) {
      const dest = path.join(DRIVE_TARGET, `${collection}.csv`);
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      fs.copyFileSync(CSV_FILE, dest);
    }
  } catch (e) {
    // ignore drive copy errors
  }

  return { ok: true, path: CSV_FILE, headersCount: headers.length, headers };
}

module.exports = { exportCollectionToCSV };
