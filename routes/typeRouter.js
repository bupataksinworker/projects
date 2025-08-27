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
const Type = require('../models/type');
const Grain = require('../models/grain');
const Origin = require('../models/origin');
const Heat = require('../models/heat');

// หน้าจัดการ Type
router.get('/manageType', async (req, res) => {
    try {
        // ตรวจสอบว่ามีผู้ใช้ล็อกอินหรือไม่
        if (!checkLoggedIn(req)) {
            // ถ้าไม่มีผู้ใช้ล็อกอิน ให้ redirect ไปยังหน้า login
            return res.redirect('/login');
        }

        // ดึงข้อมูลทั้งหมดจาก MongoDB
        const types = await Type.find().populate('grainID').populate('originID').populate('heatID');
        const grains = await Grain.find();
        const origins = await Origin.find();
        const heats = await Heat.find();

        // ตรวจสอบว่า type ถูกใช้งานใน products หรือ stock หรือไม่
        const Stock = require('../models/stock');
        const usedTypeIdsProduct = await Product.distinct('typeID');
        const usedTypeIdsStock = await Stock.distinct('typeID');
        // รวม id ที่ถูกใช้ใน product และ stock
        const usedTypeIds = [...new Set([...usedTypeIdsProduct, ...usedTypeIdsStock])];
        const typesWithUsage = types.map(type => {
            const isUsedInProducts = usedTypeIds.some(id => id.toString() === type._id.toString());
            return { ...type.toObject(), isUsedInProducts };
        });
        // console.log(typesWithUsage);
        // ส่งข้อมูลไปยังหน้า manageType.ejs
        res.render('manageType', { types: typesWithUsage, grains, origins, heats });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// เส้นทางสำหรับการเพิ่มประเภทสินค้า
router.post('/addType', async (req, res) => {
    try {
        // รับข้อมูลจาก form addType
        const { grainID, originID, heatID } = req.body;

        // ค้นหาข้อมูลที่มีเงื่อนไขตามที่กำหนดไว้
        const existing = await Type.findOne({ grainID, originID, heatID });

        // ตรวจสอบว่ามีข้อมูลที่ซ้ำกันหรือไม่
        if (existing) {
            // ถ้าพบข้อมูลที่ซ้ำกัน ส่งคำตอบกลับไปยัง client ด้วยสถานะ 400 (Bad Request) และข้อความแจ้งเตือน
            return res.status(400).send('ข้อมูลที่เพิ่มมีการซ้ำกันในระบบ');
        }

        // สร้างเอกสารใหม่จากข้อมูลที่รับมาจาก form
        const newType = new Type({
            grainID,
            originID,
            heatID
        });

        // บันทึกเอกสารใหม่ลงในฐานข้อมูล
        await newType.save();

        console.log('บันทึกข้อมูลเรียบร้อยแล้ว:', newType);
        res.json({ success: true, message: 'เพิ่ทข้อมูลสำเร็จ', newType})
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล:', error);
        res.status(500).send('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
});


// เส้นทางสำหรับการแก้ไขประเภทสินค้า ก่อนนำไป update
router.post('/editType', async (req, res) => {
    const edit_id = req.body.edit_id;
    console.log(edit_id);

    try {
        const grains = await Grain.find();
        const origins = await Origin.find();
        const heats = await Heat.find();
        const doc = await Type.findOne({ _id: edit_id })
                              .populate('grainID')
                              .populate('originID')
                              .populate('heatID')
                              .exec();

        if (doc) {
            res.render('editType', { 
                type: doc, 
                grains: grains, 
                origins: origins, 
                heats: heats 
            });
        } else {
            res.status(404).send('ไม่พบ Type นี้');
        }
    } catch (err) {
        console.error('เกิดข้อผิดพลาดในการค้นหา Type:', err);
        res.status(500).send('เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์');
    }
});


// เส้นทางสำหรับการ update ข้อมูลของประเภทสินค้า ที่ส่งมาจาก ฟอร์ม edit
router.post('/updateType', async (req, res) => {
    const edit_id = req.body.edit_id;
    // รับข้อมูลจากฟอร์มแก้ไข
    const { grainID, originID, heatID } = req.body;

    // ค้นหาข้อมูลที่มีเงื่อนไขตามที่กำหนดไว้
    try {
        const existingType = await Type.findOne({ 
            grainID, 
            originID, 
            heatID, 
            _id: { $ne: edit_id } 
        });
        
        // ตรวจสอบว่ามีข้อมูลที่ซ้ำกันหรือไม่
        if (existingType) {
            return res.status(400).json({ 
                success: false, 
                message: 'ข้อมูลที่แก้ไขมีการซ้ำกันในระบบ' 
            });
        }

        // ค้นหาและอัปเดตข้อมูลที่ต้องการ
        const updatedType = await Type.findByIdAndUpdate(edit_id, { grainID, originID, heatID }, { new: true });

        if (updatedType) {
            console.log('ข้อมูลประเภทสินค้าถูกอัปเดต:', updatedType);
            return res.json({ success: true, message: 'ข้อมูลประเภทสินค้าถูกอัปเดตสำเร็จ', updatedType });
        } else {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลประเภทสินค้า' });
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล', error: error.message });
    }
});

// เส้นทางสำหรับลบข้อมูลประเภทสินค้า
router.post('/deleteType', async (req, res) => {
    try {
        const { delete_id } = req.body; // รับ _id ของข้อมูลที่ต้องการลบจาก body
        console.log(delete_id);
        // ค้นหาและลบข้อมูลจากฐานข้อมูล
        await Type.findByIdAndDelete(delete_id);

        console.log('ลบข้อมูลเรียบร้อยแล้ว');
        res.redirect('/manageType'); // หลังจากลบเสร็จสิ้น ให้ redirect กลับ
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบข้อมูล:', error);
        res.status(500).send('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
});


module.exports = router;
