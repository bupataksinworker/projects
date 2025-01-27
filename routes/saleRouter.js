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
const Sale = require('../models/sale');
const SaleEntry = require('../models/saleEntry');
const Product = require('../models/product');
const Cost = require('../models/cost');
const Type = require('../models/type');
const Size = require('../models/size');
const Grade = require('../models/grade');
const Sharp = require('../models/sharp');
const productForm = require('../public/script/productScript');

// หน้า Sale ครั้งแรก ย้ายไปใช้ที่ userRouter.js
router.get('/manageSale', async (req, res) => {
    // ตรวจสอบว่ามีผู้ใช้ล็อกอินหรือไม่
    if (!checkLoggedIn(req)) {
        // ถ้าไม่มีผู้ใช้ล็อกอิน ให้ redirect ไปยังหน้า login
        return res.redirect('/login');
    }

    try {
        const customers = await Customer.find();
        res.render('manageSale', { customers });
    } catch (error) {
        console.error('Failed to retrieve customers:', error);
        res.status(500).send("Internal Server Error");
    }
});

router.get('/getSubCustomers/:customerId', async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.customerId);
        console.log("getSubCustomers router : " + req.params.customerId)
        if (customer && customer.subCustomerName) {
            res.json({ subCustomerNames: customer.subCustomerName });
        } else {
            res.json({ subCustomerNames: [] });
        }
    } catch (error) {
        console.error('Error fetching sub customer names:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/addSale', async (req, res) => {
    const { customerID, subCustomerName, saleDate, discount, oldNew } = req.body;

    try {
        const newSale = new Sale({
            customerID,
            subCustomerName,
            saleDate,
            discount,
            oldNew
        });

        await newSale.save();
        res.status(201).json({ message: 'Sale created successfully!', newSale });
    } catch (error) {
        console.error('Error adding sale:', error);
        res.status(500).json({ message: 'Error adding sale' });
    }
});

router.get('/fetchSales', async (req, res) => {
    const pageSize = 10;  // จำนวนรายการสูงสุดต่อหน้า
    const page = parseInt(req.query.page) || 1;  // หน้าที่ร้องขอ
    const { customerID, subCustomerName, dateStart, dateEnd } = req.query;

    // ตั้งค่ากรองเริ่มต้น
    const filter = {};
    if (customerID) filter['customerID'] = customerID;
    if (subCustomerName) filter['subCustomerName'] = subCustomerName;
    if (dateStart && dateEnd) {
        filter['saleDate'] = { $gte: new Date(dateStart), $lte: new Date(dateEnd) };
    }

    try {
        // นับจำนวนการขายทั้งหมดตามตัวกรอง
        const totalSales = await Sale.countDocuments(filter);

        // ค้นหา sales ตามตัวกรองและหน้าที่ร้องขอ
        const sales = await Sale.find(filter)
            .populate('customerID')
            .sort({ saleDate: -1 })  // เรียงจากล่าสุดไปหาเก่าสุด
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .exec();

        // คำนวณ totalAmount สำหรับแต่ละ sale
        const salesWithTotalAmounts = await Promise.all(sales.map(async sale => {
            const totalAmount = await sale.getTotalSaleSum();
            const totalSaleAfterDC = await sale.totalSaleAfterDC();
            return { ...sale.toObject(), totalAmount, totalSaleAfterDC };
        }));

        // ส่งข้อมูลกลับไปยังไคลเอ็นต์
        res.json({
            sales: salesWithTotalAmounts,
            currentPage: page,
            totalPages: Math.ceil(totalSales / pageSize),
            totalSales,  // ส่งจำนวนรายการทั้งหมด (ใช้ตัวแปร totalSales)
        });
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).send('Internal Server Error');
    }
});



// แสดงฟอร์มแก้ไข
router.post('/editSale', async (req, res) => {
    const edit_id = req.body.edit_id;
    console.log(edit_id);
    try {
        // ค้นหาข้อมูลสินค้าจากฐานข้อมูล
        const sale = await Sale.findOne({ _id: edit_id }).populate('customerID').exec();

        if (sale) {
            const customers = await Customer.find();
            // ตรวจสอบและเตรียมข้อมูล subCustomerName ถ้าจำเป็น
            // ตัวอย่าง: สมมติว่า subCustomerName ต้องถูกโหลดเฉพาะจาก customer ที่เลือก
            const selectedCustomer = customers.find(customer => customer._id.toString() === sale.customerID._id.toString());
            let subCustomerNames = selectedCustomer ? selectedCustomer.subCustomerName : [];

            res.render('editSale', { sale, customers, subCustomerNames });
        } else {
            res.status(404).send('This Type Not Found');
        }
    } catch (error) {
        console.error('Error in retrieving sale details:', error);
        res.status(500).send('Server Error');
    }
});


// อัปเดตข้อมูล Sale
router.post('/updateSale', async (req, res) => {
    const { saleID, customerID, subCustomerName, billStatus, discount, oldNew, saleDate } = req.body;

    try {
        const updatedSale = await Sale.findByIdAndUpdate(saleID, {
            customerID,
            subCustomerName,
            billStatus,
            discount,
            oldNew,
            saleDate
        }, { new: true });

        if (!updatedSale) {
            return res.status(404).send('Sale not found');
        }
        res.status(200).json(updatedSale);
    } catch (error) {
        console.error('Error updating sale:', error);
        res.status(500).send('Error updating sale');
    }
});

// เส้นทางสำหรับลบ sale และ ต้องไม่มี saleEntry ใช้งานอยู่ 
router.post('/deleteSale', (req, res) => {
    const delete_id = req.body.delete_id;

    // ตรวจสอบว่ามี SaleEntry ที่อ้างอิงถึง saleID นี้หรือไม่
    SaleEntry.find({ saleID: delete_id })
        .then(entries => {
            if (entries.length === 0) {
                // ไม่มี entry ใดอ้างอิงถึง saleID นี้, ดำเนินการลบ
                return Sale.findByIdAndDelete(delete_id);
            } else {
                // พบ entry ที่อ้างอิง, ไม่สามารถลบได้
                throw new Error('ไม่สามารถลบข้อมูล sale นี้ได้เนื่องจากยังถูกใช้อยู่ใน SaleEntry');
            }
        })
        .then(deletedSale => {
            if (deletedSale) {
                res.json({ success: true, message: 'ลบข้อมูลสำเร็จ' });
            } else {
                res.status(404).json({ success: false, message: 'ไม่พบข้อมูล sale ที่ต้องการลบ' });
            }
        })
        .catch(error => {
            res.status(500).json({ success: false, message: error.message });
        });
});

// Define the closeBill route
router.post('/closeBill', async (req, res) => {
    const { id } = req.body;
    
    try {
      // Find the sale by ID and update the billStatus
      const sale = await Sale.findByIdAndUpdate(id, { billStatus: 'ปิด' }, { new: true });
      res.json({ success: true, billStatus: sale.billStatus });
    } catch (error) {
      console.error('Error updating bill status:', error);
      res.status(500).json({ success: false, message: 'Failed to close bill' });
    }
  });
  
module.exports = router;
