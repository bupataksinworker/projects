const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
// ฟังก์ชันตรวจสอบการเข้าสู่ระบบ
const { checkLoggedIn } = require('../db/authUtils');

// Middleware ตรวจสอบการเข้าสู่ระบบ
router.use((req, res, next) => {
    if (!checkLoggedIn(req)) {
        return res.redirect('/login');
    }
    next();
});

// เรียกใช้งาน models
const Type = require('../models/type');
const Batch = require('../models/batch');

// หน้าจัดการ Batch
router.get('/manageBatch', async (req, res) => {
    try {
        const batchYears = [68, 69, 70];
        const numbers = [1, 2, 3, 4, 5, 6, 7];
        const types = await Type.find().populate('grainID').populate('originID').populate('heatID');

        res.render('manageBatch', { batchYears, numbers, types });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// เพิ่มข้อมูล Batch
router.post('/addBatch', async (req, res) => {
    try {
        const { batchYear, number, typeID, batchName, costOfBatchBefore, costOfBatchNew, costOfBatchLabor } = req.body;

        if (!batchYear || !number || !typeID || !batchName) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        const existing = await Batch.findOne({ batchYear, number, batchName });
        if (existing) {
            return res.status(400).json({ success: false, message: 'ข้อมูลที่เพิ่มมีการซ้ำกันในระบบ' });
        }

        const newBatch = new Batch({
            batchYear,
            number,
            typeID: Array.isArray(typeID) ? typeID : [typeID],  // รองรับกรณีที่ typeID เป็น array หรือ string
            batchName,
            costOfBatch: Number(costOfBatchBefore) + Number(costOfBatchNew) + Number(costOfBatchLabor),
            costOfBatchBefore,
            costOfBatchNew,
            costOfBatchLabor
        });

        await newBatch.save();
        res.json({ success: true, message: 'เพิ่มสำเร็จ', newBatch });
    } catch (error) {
        console.error('Error details:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', error });
    }
});

// ดึงข้อมูล Batch ตามเงื่อนไข
router.get('/batchForm', async (req, res) => {
    try {
        const { batchYear, number, typeID } = req.query;

        const query = {};
        if (batchYear) query.batchYear = batchYear;
        if (number) query.number = number;
        if (typeID) query.typeID = typeID;

        const batchs = await Batch.find(query).populate({
            path: 'typeID',
            populate: [
                { path: 'grainID', select: 'grainName' },
                { path: 'originID', select: 'originName' },
                { path: 'heatID', select: 'heatName' }
            ]
        });

        res.json({ batchs });
    } catch (error) {
        console.error('Error retrieving batches:', error);
        res.status(500).send('Server error retrieving batch data');
    }
});

// ดึงข้อมูล Batch เพื่อแก้ไข
router.get('/getBatchById', async (req, res) => {
    try {
        const batch = await Batch.findById(req.query.batchID).populate('typeID');
        if (batch) {
            res.json({ success: true, batch });
        } else {
            res.json({ success: false, message: 'ไม่พบข้อมูล' });
        }
    } catch (error) {
        console.error('Error fetching batch:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
    }
});

// อัปเดตข้อมูล Batch

router.post('/updateBatch', async (req, res) => {
    const {
        edit_id,
        batchYear,
        number,
        typeIDs,
        batchName,
        costOfBatch,
        costOfBatchBefore,
        costOfBatchNew,
        costOfBatchLabor
    } = req.body;

    try {
        // แปลงค่า edit_id เป็น ObjectId
        const objectIdEditId = new mongoose.Types.ObjectId(edit_id);

        // แปลง typeIDs เป็น array ของ ObjectId (ตรวจสอบถ้ามีค่าเป็น string ให้แปลงเป็น array ก่อน)
        const typeIDArray = Array.isArray(typeIDs)
            ? typeIDs.map(id => new mongoose.Types.ObjectId(id))
            : typeIDs
                ? [new mongoose.Types.ObjectId(typeIDs)]
                : [];

        // ตรวจสอบข้อมูลซ้ำ
        const existingBatch = await Batch.findOne({
            batchName,
            _id: { $ne: objectIdEditId }
        });

        if (existingBatch) {
            return res.status(400).json({ success: false, message: 'ข้อมูลสินค้าที่แก้ไขมีอยู่แล้วในระบบ' });
        }

        // อัปเดตข้อมูล
        const updatedBatch = await Batch.findOneAndUpdate(
            { _id: objectIdEditId },
            {
                batchYear,
                number,
                typeID: typeIDArray,  // ใช้ array ของ ObjectId ที่แปลงแล้ว
                batchName,
                costOfBatch: parseFloat(costOfBatch),
                costOfBatchBefore: parseFloat(costOfBatchBefore),
                costOfBatchNew: parseFloat(costOfBatchNew),
                costOfBatchLabor: parseFloat(costOfBatchLabor)
            },
            { new: true }
        );

        if (updatedBatch) {
            res.json({ success: true, message: 'อัพเดทสำเร็จ', batchYear, number });
        } else {
            res.status(404).json({ success: false, message: 'ไม่พบข้อมูลสินค้า' });
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
    }
});



// ลบข้อมูล Batch
router.post('/deleteBatch', async (req, res) => {
    try {
        const { delete_id } = req.body;

        await Batch.findByIdAndDelete(delete_id);
        res.json({ success: true, message: 'ลบสำเร็จ' });
    } catch (error) {
        console.error('Error deleting batch:', error);
        res.status(500).send('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
});

module.exports = router;
