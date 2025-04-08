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
const Grade = require('../models/grade');

// หน้าจัดการ Grade
router.get('/manageGrade', async (req, res) => {
    try {
        // ตรวจสอบว่ามีผู้ใช้ล็อกอินหรือไม่
        if (!checkLoggedIn(req)) {
            // ถ้าไม่มีผู้ใช้ล็อกอิน ให้ redirect ไปยังหน้า login
            return res.redirect('/login');
        }

        // ดึงข้อมูลทั้งหมดจาก MongoDB
        const grades = await Grade.find().sort({ sorter: 1 }); // เรียงจากน้อยไปมาก
        console.log(grades);

        // ส่งข้อมูลไปยังหน้า manageGrade.ejs
        res.render('manageGrade', { grades });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// เส้นทางสำหรับการเพิ่ม Grade
router.post('/addGrade', async (req, res) => {
    try {
        // รับข้อมูลจาก form addGrade
        const { gradeName } = req.body;

        // ค้นหาข้อมูลที่มีเงื่อนไขตามที่กำหนดไว้
        const existingGrade = await Grade.findOne({ gradeName });

        // ตรวจสอบว่ามีข้อมูลที่ซ้ำกันหรือไม่
        if (existingGrade) {
            // ถ้าพบข้อมูลที่ซ้ำกัน ส่งคำตอบกลับไปยัง client ด้วยสถานะ 400 (Bad Request) และข้อความแจ้งเตือน
            return res.status(400).send('ข้อมูลที่เพิ่มมีการซ้ำกันในระบบ');
        }

        // สร้างเอกสารใหม่จากข้อมูลที่รับมาจาก form
        const newGrade = new Grade({
           gradeName
        });

        // บันทึกเอกสารใหม่ลงในฐานข้อมูล
        await newGrade.save();

        console.log('บันทึกข้อมูลเรียบร้อยแล้ว:', newGrade);
        // res.redirect('/manageGrade'); // เมื่อบันทึกสำเร็จ ให้ redirect กลับ
        res.json({ success: true, message: 'เพิ่มสำเร็จ', newGrade})
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล:', error);
        res.status(500).send('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
});

// เส้นทางสำหรับการแก้ไขสินค้า ก่อนนำไป update
router.post('/editGrade', async (req, res) => {
    const edit_id1 = req.body.edit_id1; // Grade._id
    console.log("edit_id1 : "+edit_id1);
    // ค้นหาข้อมูลจากฐานข้อมูล
    Grade.findOne({ _id: edit_id1 }).exec()
        .then(gradeDoc => {
            if (gradeDoc) {
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
                res.render('editGrade', { grade: gradeDoc });
            } else {
                // ถ้าไม่พบข้อมูล
                res.status(404).send('This Grade Not Found');
            }
        })
        .catch(error => {
            console.error('Error finding grade:', error);
            res.status(500).send('Error finding grade');
        });
});

// เส้นทางสำหรับการ update ข้อมูลของสินค้า ที่ส่งมาจาก ฟอร์ม edit
router.post('/updateGrade', async (req, res) => {
    const { edit_id, gradeName } = req.body;

    if (!edit_id || !gradeName) {
        return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }

    try {
        // ตรวจสอบว่ามี Grade อื่นที่มีชื่อเดียวกันหรือไม่ แต่ไม่ใช่ ID ที่กำลังแก้ไข
        const existingGrade = await Grade.findOne({ gradeName, _id: { $ne: edit_id } });

        if (existingGrade) {
            return res.status(400).json({ success: false, message: 'ข้อมูลที่แก้ไขมีการซ้ำกันในระบบ' });
        }

        // ค้นหาและอัปเดตข้อมูลที่ต้องการ
        const updatedGrade = await Grade.findByIdAndUpdate(edit_id, { gradeName }, { new: true });

        if (updatedGrade) {
            console.log('ข้อมูลเกรดถูกอัปเดต:', updatedGrade);
            return res.json({ success: true, message: 'ข้อมูลเกรดถูกอัปเดตสำเร็จ', updatedGrade });
        } else {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลเกรดที่ต้องการอัปเดต' });
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล', error: error.message });
    }
});

// เส้นทางสำหรับลบข้อมูลประเภทสินค้า
router.post('/deleteGrade', async (req, res) => {
    try {
        const { delete_id } = req.body; // รับ _id ของข้อมูลที่ต้องการลบจาก body
        console.log(delete_id);
        // ค้นหาและลบข้อมูลจากฐานข้อมูล
        await Grade.findByIdAndDelete(delete_id);

        console.log('ลบข้อมูลเรียบร้อยแล้ว');
        res.redirect('/manageGrade'); // หลังจากลบเสร็จสิ้น ให้ redirect กลับ
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบข้อมูล:', error);
        res.status(500).send('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
});

module.exports = router;
