const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); //การเข้ารหัส
const Sale = require('../models/sale'); // นำเข้าโมเดล Sale

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

    let { customerName, email = null, phone = null, address = null } = req.body;

    if (!customerName) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อของลูกค้า' });
    }

    try {
        const existingCustomer = await Customer.findOne({ customerName });
        if (existingCustomer) {
            return res.status(400).json({ success: false, message: 'ข้อมูลที่เพิ่มมีการซ้ำกันในระบบ' });
        }

        const newCustomer = new Customer({
            customerName,
            email: email || null, // แปลงค่าว่างเป็น null
            phone: phone || null,
            address: address || null
        });
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

    try {
        // ค้นหาว่ามี Sale ที่ใช้ CustomerID หรือ SubCustomerName อยู่หรือไม่
        const customerInSale = await Sale.findOne({
            $or: [
                { customerID: edit_id },
                { subCustomerName: { $in: [edit_id] } } // ตรวจสอบ SubCustomerName
            ]
        }).exec();

        const doc = await Customer.findById(edit_id).exec();
        if (doc) {
            res.render('editCustomer', { customer: doc, customerInSale: !!customerInSale });
        } else {
            res.status(404).send('This Data Not Found');
        }
    } catch (error) {
        console.error('Error checking sale usage:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/updateCustomer', async (req, res) => {
    const { edit_id, customerName, email, phone, address } = req.body;
    let { subCustomerName } = req.body;

    if (typeof subCustomerName === 'string') {
        subCustomerName = [subCustomerName];
    }

    if (!edit_id || !customerName) {
        return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อของลูกค้าและระบุรหัสลูกค้า' });
    }

    try {
        const updateData = { customerName, subCustomerName };
        if (email !== undefined) updateData.email = email || null;
        if (phone !== undefined) updateData.phone = phone || null;
        if (address !== undefined) updateData.address = address || null; // แปลงค่าว่างเป็น null

        const updatedCustomer = await Customer.findByIdAndUpdate(edit_id, updateData, { new: true });

        if (!updatedCustomer) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลลูกค้า' });
        }

        res.json({ success: true, message: `อัพเดทลูกค้า ${updatedCustomer.customerName} สำเร็จ` });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในระบบ', error: error.message });
    }
});



// เส้นทางสำหรับลบข้อมูล
router.post('/deleteCustomer', async (req, res) => {
    try {
        const { delete_id } = req.body; // รับ _id ของข้อมูลที่ต้องการลบจาก body
        console.log(delete_id);

        // ตรวจสอบว่า customerID ถูกใช้อยู่ใน Sale หรือไม่
        const saleInUse = await Sale.findOne({ customerID: delete_id }).exec();

        if (saleInUse) {
            console.log(`ไม่สามารถลบได้ เนื่องจาก customerID: ${delete_id} ถูกใช้อยู่ใน Sale`);
            return res.json({ success: false, message: 'ไม่สามารถลบได้ เนื่องจากข้อมูลลูกค้าถูกใช้อยู่ใน Sale' });
        }

        // หาก customerID ไม่ถูกใช้งาน ให้ลบข้อมูล
        await Customer.findByIdAndDelete(delete_id);
        console.log('ลบข้อมูลเรียบร้อยแล้ว');
        res.json({ success: true, message: 'ลบข้อมูลสำเร็จ' });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบข้อมูล:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูล', error: error.message });
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

//ตรวจสอบว่า subCustomerName ถูกใช้อยู่ใน Sale หรือไม่
router.get('/checkSubCustomerUsage', async (req, res) => {
    const { subCustomerName } = req.query;

    if (!subCustomerName) {
        return res.status(400).json({ success: false, message: 'กรุณาระบุ Sub-customer Name' });
    }

    try {
        const saleInUse = await Sale.findOne({ subCustomerName }).exec();

        if (saleInUse) {
            res.json({ success: true, inUse: true });
        } else {
            res.json({ success: true, inUse: false });
        }
    } catch (error) {
        console.error('Error checking subCustomer usage:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบ', error: error.message });
    }
});

module.exports = router;
