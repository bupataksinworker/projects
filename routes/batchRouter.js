const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); //การเข้ารหัส

// เรียกใช้งานฟังก์ชัน checkLoggedIn จากไฟล์ authUtils.js
const { checkLoggedIn } = require('../db/authUtils');
// ตรวจสอบการเข้าสู่ระบบก่อนเข้าถึง router
router.use((req, res, next) => {
    if (!checkLoggedIn(req)) {
        return res.redirect('/login');
    }
    next();
});

//เรียกใช้งาน model
const Product = require('../models/product');
const Cost = require('../models/cost');
const Type = require('../models/type');
const Size = require('../models/size');
const Grade = require('../models/grade');
const Batch = require('../models/batch');
const Grain = require('../models/grain');
const Origin = require('../models/origin');
const Heat = require('../models/heat');

// หน้าจัดการ
router.get('/manageBatch', async (req, res) => {
    try {
        // ตรวจสอบว่ามีผู้ใช้ล็อกอินหรือไม่
        if (!checkLoggedIn(req)) {
            // ถ้าไม่มีผู้ใช้ล็อกอิน ให้ redirect ไปยังหน้า login
            return res.redirect('/login');
        }
        // ข้อมูล Enum
        const batchYears = [67, 68, 69];
        const numbers = [1, 2, 3, 4, 5, 6, 7];
        // ดึงข้อมูลจาก DB
        const types = await Type.find().populate('grainID').populate('originID').populate('heatID');

        // ส่งข้อมูลไปยังหน้า manageBatch.ejs
        res.render('manageBatch', { batchYears: batchYears, numbers: numbers, types });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// เส้นทางสำหรับการเพิ่ม Batch
router.post('/addBatch', async (req, res) => {
    try {
        // รับข้อมูลจาก form addBatch
        const { batchYear, number, typeID, batchName, costOfBatch, costOfBatchBefore, costOfBatchNew, costOfBatchLabor } = req.body;

        // ตรวจสอบค่าว่าง
        if (!batchYear || !number || !typeID || !batchName) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        // ค้นหาข้อมูลที่มีเงื่อนไขตามที่กำหนดไว้
        const existing = await Batch.findOne({ batchYear, number, batchName });

        // ตรวจสอบว่ามีข้อมูลที่ซ้ำกันหรือไม่
        if (existing) {
            return res.status(400).json({ success: false, message: 'ข้อมูลที่เพิ่มมีการซ้ำกันในระบบ' });
        }

        // สร้างเอกสารใหม่จากข้อมูลที่รับมาจาก form
        const newBatch = new Batch({
            batchYear,
            number,
            typeID,
            batchName,
            costOfBatch,
            costOfBatchBefore,
            costOfBatchNew,
            costOfBatchLabor
        });

        // บันทึกเอกสารใหม่ลงในฐานข้อมูล
        await newBatch.save();

        console.log('บันทึกข้อมูลเรียบร้อยแล้ว:', newBatch);
        res.json({ success: true, message: 'เพิ่มสำเร็จ', newBatch });
    } catch (error) {
        console.error('Error details:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', error });
    }
});



// ค้นหาข้อมูลเมื่อเลือก
router.get('/batchForm', async (req, res) => {
    if (!checkLoggedIn(req)) {
        // Redirect ถ้าไม่ได้ล็อกอิน
        return res.redirect('/login');
    }

    const { batchYear, number, typeID } = req.query;

    let query = {};

    if (batchYear) {
        query.batchYear = batchYear; // เพิ่ม batchYear ลงใน query ถ้ามี
    }

    if (number) {
        query.number = number; // เพิ่ม number ลงใน query ถ้ามี
    }

    if (typeID) {
        query.typeID = typeID; // เพิ่ม number ลงใน query ถ้ามี
    }

    try {
        // ดึงข้อมูลจากฐานข้อมูลด้วยเงื่อนไขที่สร้างขึ้น
        // const batchs = await Batch.find(query).populate('typeID');
        const batchs = await Batch.find(query).populate({
            path: 'typeID',
            populate: [
                { path: 'grainID', select: 'grainName' }, // เลือกเฉพาะฟิลด์ที่จำเป็น
                { path: 'originID', select: 'originName' }, // เลือกเฉพาะฟิลด์ที่จำเป็น
                { path: 'heatID', select: 'heatName' } // เลือกเฉพาะฟิลด์ที่จำเป็น
            ]
        });

        res.json({ batchs }); // ส่งข้อมูลกลับไปในรูปแบบ JSON
    } catch (error) {
        // หากเกิดข้อผิดพลาดในระหว่างการดึงข้อมูล
        console.error('Error retrieving batches:', error);
        res.status(500).send('Server error retrieving batch data');
    }
});

// เส้นทางสำหรับการแก้ไข ก่อนนำไป update
router.post('/editBatch', async (req, res) => {
    const edit_id = req.body.edit_id;
    console.log(edit_id);
    // ค้นหาข้อมูลสินค้าจากฐานข้อมูล
    Batch.findOne({ _id: edit_id }).exec()
        .then(async batchs => {
            if (batchs) {
                // ถ้าพบข้อมูลสินค้า นำข้อมูลไปแสดงในแบบฟอร์มเพื่อแก้ไข
                const types = await Type.find();
                res.render('editBatch', { batchs, types });
            } else {
                // ถ้าไม่พบข้อมูลสินค้า
                res.status(404).send('This Item Not Found');
            }
        })
});

// เส้นทางสำหรับการ update ข้อมูล ที่ส่งมาจากฟอร์ม edit
router.post('/updateBatch', async (req, res) => {
    const { edit_id, batchYear, number, typeIDs, batchName, costOfBatch, costOfBatchBefore, costOfBatchNew, costOfBatchLabor } = req.body;

    const existingBatch = await Batch.findOne({ 
        batchName, 
        _id: { $ne: edit_id }  // เพิ่มเงื่อนไขนี้เพื่อไม่สนใจ ID ที่กำลังแก้ไข
    });
    if (existingBatch) {
        return res.status(400).json({ success: false, message: 'ข้อมูลสินค้าที่แก้ไขมีอยู่แล้วในระบบ' });
    }


    try {
        const updatedBatch = await Batch.findOneAndUpdate({ _id: edit_id }, {
            batchYear,
            number,
            typeID: typeIDs, // อัปเดตหลายประเภท
            batchName,
            costOfBatch,
            costOfBatchBefore,
            costOfBatchNew,
            costOfBatchLabor
        }, { new: true });

        if (updatedBatch) {
            res.json({ success: true, message: 'อัพเดทสำเร็จ', batchYear, number, typeIDs });
        } else {
            res.status(404).json({ success: false, message: 'ไม่พบข้อมูลสินค้า' });
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
    }
});


// เส้นทางสำหรับลบข้อมูล
router.post('/deleteBatch', async (req, res) => {
    try {
        const { delete_id } = req.body; // รับ _id ของข้อมูลที่ต้องการลบจาก body
        console.log(delete_id);
        // ค้นหาและลบข้อมูลจากฐานข้อมูล
        await Batch.findByIdAndDelete(delete_id);

        console.log('ลบข้อมูลเรียบร้อยแล้ว');
        // res.redirect('/manageBatch'); // หลังจากลบเสร็จสิ้น ให้ redirect กลับ
        res.json({ success: true, message: 'ลบสำเร็จ' });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบข้อมูล:', error);
        res.status(500).send('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
});
module.exports = router;
