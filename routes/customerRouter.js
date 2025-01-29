const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); //การเข้ารหัส
const Sale = require('../models/sale'); // นำเข้าโมเดล Sale
const SubCustomer = require('../models/subCustomer');

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
        // ดึงข้อมูล Customer พร้อมข้อมูล SubCustomer
        const customers = await Customer.find().populate('subCustomerIDs').exec();

        console.log(customers);
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

router.post('/addSubCustomer', async (req, res) => {
    const { subCustomerName, parentCustomerID } = req.body;

    if (!subCustomerName || !parentCustomerID) {
        return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อ Sub-customer และ CustomerID' });
    }

    try {
        // สร้าง Sub-customer ใหม่
        console.log("สร้าง subcustomer ชื่อ: " + subCustomerName + " หลักคือ " + parentCustomerID);
        const newSubCustomer = new SubCustomer({
            subCustomerName,
            parentCustomerID,
        });
        await newSubCustomer.save();

        // อัปเดต subCustomerIDs ใน Customer
        await Customer.findByIdAndUpdate(
            parentCustomerID,
            { $push: { subCustomerIDs: newSubCustomer._id } }, // เพิ่ม ObjectId ของ Sub-customer
            { new: true } // คืนค่าข้อมูลที่อัปเดต
        );

        res.json({ success: true, subCustomer: newSubCustomer });
    } catch (error) {
        console.error('Error adding sub-customer:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเพิ่ม Sub-customer', error: error.message });
    }
});



// เส้นทางสำหรับการแก้ไขข้อมูล ก่อนนำไป update
router.post('/editCustomer', async (req, res) => {
    const edit_id = req.body.edit_id;

    const customer = await Customer.findById(edit_id).exec();
    const subCustomers = await SubCustomer.find({ parentCustomerID: edit_id }).exec();

    res.render('editCustomer', { customer, subCustomers });
});

router.post('/updateCustomer', async (req, res) => {
    const { edit_id, customerName, email, phone, address, subCustomers } = req.body;

    try {
        // อัปเดตข้อมูลลูกค้า
        const updateData = { customerName, email, phone, address };
        const updatedCustomer = await Customer.findByIdAndUpdate(edit_id, updateData, { new: true });

        if (!updatedCustomer) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลลูกค้า' });
        }

        // อัปเดตข้อมูล Sub-customer
        if (Array.isArray(subCustomers)) {
            for (const sub of subCustomers) {
                if (sub.id) {
                    // อัปเดต Sub-customer ที่มีอยู่
                    await SubCustomer.findByIdAndUpdate(sub.id, { subCustomerName: sub.name });
                } else {
                    // เพิ่ม Sub-customer ใหม่
                    const newSubCustomer = new SubCustomer({
                        subCustomerName: sub.name,
                        parentCustomerID: edit_id,
                    });
                    await newSubCustomer.save();
                }
            }
        }

        res.json({ success: true, message: `อัพเดทลูกค้า ${updatedCustomer.customerName} สำเร็จ` });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดภายในระบบ', error: error.message });
    }
});


router.post('/updateSubCustomer', async (req, res) => {
    const { id, subCustomerName } = req.body;

    try {
        await SubCustomer.findByIdAndUpdate(id, { subCustomerName });
        res.json({ success: true, message: 'อัพเดทสำเร็จ' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
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

router.post('/deleteSubCustomer', async (req, res) => {
    const { id } = req.body;

    try {
        // ตรวจสอบว่า SubCustomer ถูกใช้งานใน Sale หรือไม่
        const saleInUse = await Sale.findOne({ subCustomerID: id }).exec();
        if (saleInUse) {
            return res.status(400).json({ success: false, message: 'ไม่สามารถลบได้ เนื่องจากมีการใช้งานใน Sale' });
        }

        // ค้นหา SubCustomer ที่จะลบ
        const subCustomer = await SubCustomer.findById(id);
        if (!subCustomer) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูล Sub-customer ที่ต้องการลบ' });
        }

        // ลบ SubCustomer ออกจากคอลเลกชัน SubCustomer
        await SubCustomer.findByIdAndDelete(id);

        // ลบ ObjectId ของ SubCustomer จากฟิลด์ subCustomerIDs ใน Customer
        await Customer.findByIdAndUpdate(
            subCustomer.parentCustomerID,
            { $pull: { subCustomerIDs: id } }, // ใช้ $pull เพื่อลบ ObjectId ออกจาก Array
            { new: true }
        );

        res.json({ success: true, message: 'ลบสำเร็จ' });
    } catch (error) {
        console.error('Error deleting sub-customer:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบ Sub-customer', error: error.message });
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
    const { subCustomerId } = req.query;

    try {
        const saleInUse = await Sale.findOne({ subCustomerID: subCustomerId }).exec();

        res.json({ success: true, inUse: !!saleInUse });
    } catch (error) {
        console.error('Error checking subCustomer usage:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบ', error: error.message });
    }
});


module.exports = router;
