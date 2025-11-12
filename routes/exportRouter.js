// routes/exportRouter.js
const express = require('express');
const router = express.Router();
// exportScript อยู่ใน public/script (เป็นสคริปต์เรียก .bat สำหรับการ export)
const { runExport } = require('../public/script/exportScript');
// Node-based exporter (fallback / alternative to .bat)
const nodeExport = require('../lib/nodeExport');

router.post('/', async (req, res) => {
  try {
    const { collection, fields } = req.body;

    // หากผู้เรียกส่ง collection มา ให้ทำแบบเดิม (validate ชื่อง่ายๆ)
    if (collection) {
      if (!/^[a-z0-9_]+$/i.test(collection)) {
        return res.status(400).json({ ok:false, message:'Invalid collection name' });
      }
      const r = await runExport(collection, fields || '');
      return res.json({ ok:true, results: [{ collection, stdout: r.stdout, stderr: r.stderr }] });
    }

    // ถ้าไม่ได้ส่ง collection มา: ให้ export ทุก collections (ยกเว้น system.*)
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;

    // ดึงรายชื่อ collections จากฐานข้อมูล
    const list = await db.listCollections().toArray();
    const names = list.map(c => c.name).filter(name => !name.startsWith('system.'));

    const results = [];

    // โหลด models จากโฟลเดอร์ models เพื่อดึง schema paths หากเป็นไปได้
  const fs = require('fs');
  const path = require('path');
  const modelsDir = path.join(__dirname, '..', 'models');
    try {
      const modelFiles = fs.readdirSync(modelsDir).filter(f => f.endsWith('.js'));
      for (const mf of modelFiles) {
        try {
          require(path.join(modelsDir, mf));
        } catch (e) {
          // ignore model load errors
        }
      }
    } catch (e) {
      // ignore
    }

    for (const col of names) {
      try {
        // หา fields อัตโนมัติ: ถ้ามี mongoose model ให้ใช้ schema.paths
        let autoFields = '';
        const models = mongoose.models || {};
        const foundModel = Object.values(models).find(m => m.collection && m.collection.name === col);
        if (foundModel && foundModel.schema) {
          // ถ้ามี model ให้นำ schema.paths มาเป็นพื้นฐาน
          const schemaPaths = Object.keys(foundModel.schema.paths || {});
          const safeSchema = schemaPaths.filter(k => /^[a-z0-9_\.\$\-]+$/i.test(k));
          // แต่เพื่อความปลอดภัย ให้ sample เอกสารด้วยแล้วรวม union กัน
          try {
            const samples = await db.collection(col).aggregate([{ $sample: { size: 1000 } }]).toArray();
            const paths = new Set();
            const isBSONObjectId = (v) => v && (v._bsontype === 'ObjectID' || v._bsontype === 'ObjectId');
            const collect = (obj, prefix = '') => {
              if (!obj || typeof obj !== 'object') return;
              for (const k of Object.keys(obj)) {
                const v = obj[k];
                const path = prefix ? `${prefix}.${k}` : k;
                if (v === null || v === undefined) {
                  paths.add(path);
                } else if (Array.isArray(v)) {
                  paths.add(path);
                } else if (isBSONObjectId(v) || v instanceof Date || typeof v !== 'object') {
                  paths.add(path);
                } else {
                  paths.add(path);
                  collect(v, path);
                }
              }
            };
            for (const doc of samples) collect(doc, '');
            const safeSample = Array.from(paths).filter(k => /^[a-z0-9_\.\$\-]+$/i.test(k));
            const union = Array.from(new Set([...safeSchema, ...safeSample]));
            autoFields = union.join(',');
          } catch (e) {
            // ถ้าสำเร็จใช้ schemaPaths อย่างเดียวเป็น fallback
            autoFields = safeSchema.join(',');
          }
        } else {
          // หากไม่มี model ให้ sample หลายเอกสารแล้ว flatten fields (dot notation)
          try {
            const samples = await db.collection(col).aggregate([{ $sample: { size: 200 } }]).toArray();
            const paths = new Set();

            const isBSONObjectId = (v) => v && (v._bsontype === 'ObjectID' || v._bsontype === 'ObjectId');

            const collect = (obj, prefix = '') => {
              if (!obj || typeof obj !== 'object') return;
              for (const k of Object.keys(obj)) {
                const v = obj[k];
                const path = prefix ? `${prefix}.${k}` : k;
                if (v === null || v === undefined) {
                  paths.add(path);
                } else if (Array.isArray(v)) {
                  paths.add(path);
                } else if (isBSONObjectId(v) || v instanceof Date || typeof v !== 'object') {
                  paths.add(path);
                } else {
                  paths.add(path);
                  collect(v, path);
                }
              }
            };

            for (const doc of samples) collect(doc, '');
            const safe = Array.from(paths).filter(k => /^[a-z0-9_\.\$\-]+$/i.test(k));
            autoFields = safe.join(',');
          } catch (aggErr) {
            const doc = await db.collection(col).findOne();
            if (doc && typeof doc === 'object') {
              const keys = Object.keys(doc).filter(k => /^[a-z0-9_\.\$\-]+$/i.test(k));
              autoFields = keys.join(',');
            }
          }
        }
        
        // เรียก export สำหรับ collection นี้ (ใช้ Node-based exporter)
        console.log('[exportRouter] export collection=', col, ' fieldsCount=', (autoFields||'').split(',').filter(Boolean).length, ' fields=', autoFields);
        try {
          const nr = await nodeExport.exportCollectionToCSV(col, autoFields);
          results.push({ collection: col, ok: true, node: true, path: nr.path, headersCount: nr.headersCount, headers: nr.headers });
        } catch (e) {
          // fallback to existing .bat-based exporter if Node export fails
          console.error('[exportRouter] node export failed for', col, e && e.message);
          const r = await runExport(col, autoFields);
          results.push({ collection: col, ok: true, stdout: r.stdout, stderr: r.stderr });
        }
        continue;
      } catch (errInner) {
        console.error('Export error for', col, errInner);
        results.push({ collection: col, ok: false, message: errInner.message, code: errInner.code || 500, stdout: errInner.stdout, stderr: errInner.stderr });
        continue;
      }
    }

    res.json({ ok:true, results });
  } catch (err) {
    console.error('Export error', err);
    res.status(500).json({ ok:false, message: err.message, code: err.code || 500, stdout: err.stdout, stderr: err.stderr });
  }
});

module.exports = router;
