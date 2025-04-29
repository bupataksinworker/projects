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
const Size = require('../models/size');
const Grain = require('../models/grain');

// หน้าจัดการ Size
router.get('/manageSize', async (req, res) => {
    try {
        // ตรวจสอบว่ามีผู้ใช้ล็อกอินหรือไม่
        if (!checkLoggedIn(req)) {
            // ถ้าไม่มีผู้ใช้ล็อกอิน ให้ redirect ไปยังหน้า login
            return res.redirect('/login');
        }

        // ดึงข้อมูลทั้งหมดจาก MongoDB
        const sizes = await Size.find().populate('grainID').sort({ sorter: 1 });
        const grains = await Grain.find();


        // ส่งข้อมูลไปยังหน้า manageSize.ejs
        res.render('manageSize', { grains, sizes });


    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/sizeTableBody', async (req, res) => {
    try {
        // ตรวจสอบว่ามีผู้ใช้ล็อกอินหรือไม่
        if (!checkLoggedIn(req)) {
            // ถ้าไม่มีผู้ใช้ล็อกอิน ให้ redirect ไปยังหน้า login
            return res.redirect('/login');
        }

        // ดึงค่า grainID ที่ส่งมาจากหน้า manageSize.ejs
        const selectedGrainID = req.query.grainID;
        console.log("selectedGrainID : " + req.query.grainID)

        // หาขนาดที่มี grainID ตรงกับที่เลือก (หรือข้ามหากไม่มีหรือมีค่าเป็นค่าว่างหรือ undefined)
        let sizes;
        if (selectedGrainID) {
            sizes = await Size.find({ grainID: selectedGrainID }).populate('grainID').sort({ sorter: 1 });
            // console.log(sizes)
        } else {
            sizes = await Size.find().populate('grainID').sort({ sorter: 1 });
        }

        // ส่งข้อมูลขนาดเฉพาะเป็น JSON กลับไปที่หน้า manageSize.ejs
        res.json({ sizes });

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// เส้นทางสำหรับการเพิ่มขนาด Size
router.post('/addSize', async (req, res) => {
    try {
        // รับข้อมูลจาก form addSize
        const { grainID, sizeName } = req.body;

        // ค้นหาข้อมูลที่มีเงื่อนไขตามที่กำหนดไว้
        const existing = await Size.findOne({ sizeName });

        // ตรวจสอบว่ามีข้อมูลที่ซ้ำกันหรือไม่
        if (existing) {
            // ถ้าพบข้อมูลที่ซ้ำกัน ส่งคำตอบกลับไปยัง client ด้วยสถานะ 400 (Bad Request) และข้อความแจ้งเตือน
            return res.status(400).send('ข้อมูลที่เพิ่มมีการซ้ำกันในระบบ');

        }

        // สร้างเอกสารใหม่จากข้อมูลที่รับมาจาก form
        const newSize = new Size({
            sizeName,
            grainID
        });

        // บันทึกเอกสารใหม่ลงในฐานข้อมูล
        await newSize.save();

        console.log('บันทึกข้อมูลเรียบร้อยแล้ว:', newSize);
        res.json({ success: true, message: 'เพิ่มข้อมูลสำเร็จ', grainID });

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
});


// เส้นทางสำหรับการแก้ไขสินค้า ก่อนนำไป update
router.post('/editSize', async (req, res) => {
    const edit_id = req.body.edit_id; // Size._id

    // ค้นหาข้อมูลขนาดจากฐานข้อมูล
    Size.findOne({ _id: edit_id }).populate('grainID').exec()
        .then(async sizeDoc => {
            if (sizeDoc) {
                const grains = await Grain.find();
                res.render('editSize', { size: sizeDoc, grains });
            } else {
                // ถ้าไม่พบข้อมูลขนาด
                res.status(404).send('This Size Not Found');
            }
        })
        .catch(error => {
            console.error('Error finding size:', error);
            res.status(500).send('Error finding size');
        });
});

// เส้นทางสำหรับการ update ข้อมูลของสินค้า ที่ส่งมาจาก ฟอร์ม edit
router.post('/updateSize', async (req, res) => {
    const { edit_id, sizeName, grainID } = req.body;

    if (!edit_id || !sizeName || !grainID) {
        return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }

    try {
        // ตรวจสอบว่ามี Size อื่นที่มีชื่อเดียวกันและ grainID เดียวกันหรือไม่ แต่ไม่ใช่ ID ที่กำลังแก้ไข
        const existingSize = await Size.findOne({
            sizeName,
            grainID,
            _id: { $ne: edit_id }
        });

        if (existingSize) {
            return res.status(400).json({ success: false, message: 'ข้อมูลที่แก้ไขมีการซ้ำกันในระบบ' });
        }

        const updatedSize = await Size.findByIdAndUpdate(edit_id, { sizeName, grainID }, { new: true });

        if (updatedSize) {
            console.log('ข้อมูล Size ถูกอัปเดต:', updatedSize);
            res.json({ success: true, message: 'อัพเดทข้อมูลสำเร็จ', grainID });
        } else {
            res.status(404).json({ success: false, message: 'ไม่พบข้อมูล Size ที่ต้องการอัปเดต' });
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูล:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
    }
});



// เส้นทางสำหรับลบข้อมูลประเภทสินค้า
router.post('/deleteSize', async (req, res) => {
    try {
        const { sizeID, grainID } = req.body; // รับ _id ของข้อมูลที่ต้องการลบจาก body
        console.log(sizeID);
        // ค้นหาและลบข้อมูลจากฐานข้อมูล
        await Size.findByIdAndDelete(sizeID);

        console.log('ลบข้อมูลเรียบร้อยแล้ว');
        res.json({ success: true, message: 'ลบข้อมูลสำเร็จ', grainID });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบข้อมูล:', error);
        res.status(500).send('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
});


module.exports = router;
