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
const Customer = require('../models/customer');

// หน้าจัดการ
router.get('/manageCustomer', async (req, res) => {
    try {
        // ตรวจสอบว่ามีผู้ใช้ล็อกอินหรือไม่
        if (!checkLoggedIn(req)) {
            // ถ้าไม่มีผู้ใช้ล็อกอิน ให้ redirect ไปยังหน้า login
            return res.redirect('/login');
        }

        // ดึงข้อมูลทั้งหมดจาก MongoDB
        const customers = await Customer.find();
        console.log(customers);

        // ส่งข้อมูลไปยังหน้า manageType.ejs
        res.render('manageCustomer', { customers });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/addCustomer', async (req, res) => {
    if (!checkLoggedIn(req)) {
        return res.status(401).json({ success: false, message: 'โปรดเข้าสู่ระบบก่อนทำรายการ' });
    }

    let { customerName, email = null, phone = null, address = '' } = req.body;

    if (!customerName) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อของลูกค้า' });
    }

    try {
        const existingCustomer = await Customer.findOne({ customerName });

        if (existingCustomer) {
            return res.status(400).json({ success: false, message: 'ข้อมูลที่เพิ่มมีการซ้ำกันในระบบ' });
        }

        const newCustomer = new Customer({ customerName, email, phone, address });
        await newCustomer.save();

        res.json({ success: true, message: `เพิ่มลูกค้า ${newCustomer.customerName} สำเร็จ` });

    } catch (error) {
        console.error('Failed to add customer:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในระบบ', error: error.message });
    }
});

// เส้นทางสำหรับการแก้ไขข้อมูล ก่อนนำไป update
router.post('/editCustomer', async (req, res) => {
    const edit_id = req.body.edit_id;
    console.log(edit_id);
    // ค้นหาข้อมูลจากฐานข้อมูล
    Customer.findOne({ _id: edit_id }).exec()
        .then(doc => {
            if (doc) {
                // ถ้าพบข้อมูลนำข้อมูลไปแสดงในแบบฟอร์มเพื่อแก้ไข
                res.render('editCustomer', { customer: doc });
            } else {
                // ถ้าไม่พบข้อมูลสินค้า
                res.status(404).send('This Data Not Found');
            }
        })
});

router.post('/updateCustomer', async (req, res) => {
    const { edit_id, customerName, email, phone, address } = req.body;
    let { subCustomerName } = req.body;

    // แปลง subCustomerName เป็นอาร์เรย์หากเป็นข้อความเดี่ยว
    if (typeof subCustomerName === 'string') {
        subCustomerName = [subCustomerName];
    }

    if (!edit_id || !customerName) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อของลูกค้าและระบุรหัสลูกค้า' });
    }

    try {
        // ตรวจสอบว่ามีชื่อซ้ำกับลูกค้าคนอื่นหรือไม่
        const existingCustomer = await Customer.findOne({
            customerName,
            _id: { $ne: edit_id } // กรอง ID ที่กำลังแก้ไข
        });

        if (existingCustomer) {
            return res.status(400).json({ success: false, message: 'ข้อมูลลูกค้ามีอยู่แล้วในระบบ' });
        }

        const updatedCustomer = await Customer.findByIdAndUpdate(
            edit_id,
            {
                customerName,
                subCustomerName,
                email,
                phone,
                address
            },
            { new: true }
        );

        if (!updatedCustomer) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลลูกค้า' });
        }

        res.json({ success: true, message: `อัพเดทลูกค้า ${updatedCustomer.customerName} สำเร็จ` });

    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในระบบ', error: error.message });
    }
});

module.exports = router;




// เส้นทางสำหรับลบข้อมูล
router.post('/deleteCustomer', async (req, res) => {
    try {
        const { delete_id } = req.body; // รับ _id ของข้อมูลที่ต้องการลบจาก body
        console.log(delete_id);
        // ค้นหาและลบข้อมูลจากฐานข้อมูล
        await Customer.findByIdAndDelete(delete_id);

        console.log('ลบข้อมูลเรียบร้อยแล้ว');
        res.redirect('/manageCustomer'); // หลังจากลบเสร็จสิ้น ให้ redirect กลับ
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบข้อมูล:', error);
        res.status(500).send('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
});


// เพิ่มเส้นทางใหม่สำหรับการดึงข้อมูลลูกค้า
router.get('/customers', async (req, res) => {
    try {
      const customers = await Customer.find({});
      res.json(customers);
    } catch (err) {
      console.error(err);
      res.status(500).send('Error retrieving customers');
    }
  });
  
module.exports = router;
