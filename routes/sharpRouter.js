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
const Sharp = require('../models/sharp');

// หน้าจัดการ Sharp
router.get('/manageSharp', async (req, res) => {
    try {
        // ตรวจสอบว่ามีผู้ใช้ล็อกอินหรือไม่
        if (!checkLoggedIn(req)) {
            // ถ้าไม่มีผู้ใช้ล็อกอิน ให้ redirect ไปยังหน้า login
            return res.redirect('/login');
        }

        // ดึงข้อมูลทั้งหมดจาก MongoDB
        const sharps = await Sharp.find();
        console.log(sharps);

        // ส่งข้อมูลไปยังหน้า manageSharp.ejs
        res.render('manageSharp', { sharps });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// เส้นทางสำหรับการเพิ่ม Sharp
router.post('/addSharp', async (req, res) => {
    try {
        const { sharpName } = req.body;

        if (!sharpName || sharpName.trim() === '') {
            return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อรูปร่าง' });
        }

        const existing = await Sharp.findOne({ sharpName: sharpName.trim() });
        if (existing) {
            return res.status(400).json({ success: false, message: 'ข้อมูลซ้ำกันในระบบ' });
        }

        const newSharp = new Sharp({ sharpName: sharpName.trim() });
        await newSharp.save();

        console.log('บันทึกข้อมูลเรียบร้อยแล้ว:', newSharp);
        res.json({ success: true, message: 'เพิ่มสำเร็จ', newSharp });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', error: error.message });
    }
});

// เส้นทางสำหรับการแก้ไขสินค้า ก่อนนำไป update
router.post('/editSharp', async (req, res) => {
    const edit_id1 = req.body.edit_id1; // Sharp._id
    console.log("edit_id1 : "+edit_id1);
    // ค้นหาข้อมูลจากฐานข้อมูล
    Sharp.findOne({ _id: edit_id1 }).exec()
        .then(sharpDoc => {
            if (sharpDoc) {
                // ถ้าพบข้อมูลข นำข้อมูลไปแสดงในแบบฟอร์มเพื่อแก้ไข
                // ค้นหาข้อมูลประเภทจากฐานข้อมูล
                // Type.findOne({ _id: edit_id2 }).exec()
                //     .then(async typeDoc => {
                //         if (typeDoc) {
                //             // ถ้าพบข้อมูลประเภท ส่งข้อมูลไปที่หน้าแก้ไข
                //             const types = await Type.find();
                //             res.render('editSize', { size: sizeDoc, type: typeDoc, types });
                //         } else {
                //             // ถ้าไม่พบข้อมูลประเภท
                //             res.status(404).send('This Type Not Found');
                //         }
                //     })
                //     .catch(error => {
                //         console.error('Error finding type:', error);
                //         res.status(500).send('Error finding type');
                //     });
                res.render('editSharp', { sharp: sharpDoc });
            } else {
                // ถ้าไม่พบข้อมูล
                res.status(404).send('This Sharp Not Found');
            }
        })
        .catch(error => {
            console.error('Error finding sharp:', error);
            res.status(500).send('Error finding sharp');
        });
});

// เส้นทางสำหรับการ update ข้อมูลของสินค้า ที่ส่งมาจาก ฟอร์ม edit
router.post('/updateSharp', async (req, res) => {
    const { edit_id, sharpName } = req.body;

    if (!edit_id || !sharpName) {
        return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }

    try {
        // ตรวจสอบว่ามี Sharp อื่นที่มีชื่อเดียวกันหรือไม่ แต่ไม่ใช่ ID ที่กำลังแก้ไข
        const existingSharp = await Sharp.findOne({ sharpName, _id: { $ne: edit_id } });

        if (existingSharp) {
            return res.status(400).json({ success: false, message: 'ข้อมูลที่แก้ไขมีการซ้ำกันในระบบ' });
        }

        // ค้นหาและอัปเดตข้อมูลที่ต้องการ
        const updatedSharp = await Sharp.findByIdAndUpdate(edit_id, { sharpName }, { new: true });

        if (updatedSharp) {
            console.log('ข้อมูลเกรดถูกอัปเดต:', updatedSharp);
            return res.json({ success: true, message: 'ข้อมูลเกรดถูกอัปเดตสำเร็จ', updatedSharp });
        } else {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลที่ต้องการอัปเดต' });
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล', error: error.message });
    }
});

// เส้นทางสำหรับลบข้อมูลประเภทสินค้า
router.post('/deleteSharp', async (req, res) => {
    try {
        const { delete_id } = req.body; // รับ _id ของข้อมูลที่ต้องการลบจาก body
        console.log(delete_id);
        // ค้นหาและลบข้อมูลจากฐานข้อมูล
        await Sharp.findByIdAndDelete(delete_id);

        console.log('ลบข้อมูลเรียบร้อยแล้ว');
        res.redirect('/manageSharp'); // หลังจากลบเสร็จสิ้น ให้ redirect กลับ
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบข้อมูล:', error);
        res.status(500).send('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
});

module.exports = router;
