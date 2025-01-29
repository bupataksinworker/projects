const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

// Import utilities and middlewares
const { checkLoggedIn } = require('../db/authUtils');

// Models
const Customer = require('../models/customer');
const SubCustomer = require('../models/subCustomer');
const Sale = require('../models/sale');
const SaleEntry = require('../models/saleEntry');

// Middleware to check if user is logged in
router.use((req, res, next) => {
  if (!checkLoggedIn(req)) {
    return res.redirect('/login');
  }
  next();
});

// Route: Manage Sale Page
router.get('/manageSale', async (req, res) => {
  try {
    const customers = await Customer.find().populate('subCustomerIDs');
    res.render('manageSale', { customers });
  } catch (error) {
    console.error('Failed to retrieve customers:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route: Get SubCustomers by Customer ID
router.get('/getSubCustomers/:customerId', async (req, res) => {
  try {
    const subCustomers = await SubCustomer.find({ parentCustomerID: req.params.customerId });
    res.json({
      subCustomerNames: subCustomers.map(sub => ({
        id: sub._id,
        name: sub.subCustomerName,
      })),
    });
  } catch (error) {
    console.error('Error fetching sub-customers:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route: Add Sale
router.post('/addSale', async (req, res) => {
  const { customerID, subCustomerID, saleDate, discount } = req.body;

  try {
    const newSale = new Sale({ customerID, subCustomerID, saleDate, discount });
    await newSale.save();
    res.status(201).json({ message: 'Sale created successfully!', newSale });
  } catch (error) {
    console.error('Error adding sale:', error);
    res.status(500).json({ message: 'Error adding sale' });
  }
});

// Route: Fetch Sales
router.get('/fetchSales', async (req, res) => {
    const pageSize = 10;
    const page = parseInt(req.query.page, 10) || 1;
    const { customerID, subCustomerID, dateStart, dateEnd } = req.query;
  
    // Debug: Log the query parameters
    console.log('Query parameters:', { customerID, subCustomerID, dateStart, dateEnd });
  
    const filter = {};
    if (customerID) filter['customerID'] = customerID;
    if (subCustomerID) filter['subCustomerID'] = subCustomerID;
    if (dateStart && dateEnd) {
      filter['saleDate'] = { $gte: new Date(dateStart), $lte: new Date(dateEnd) };
    }
  
    console.log('Filter:', filter); // Debugging
  
    try {
      const totalSales = await Sale.countDocuments(filter);
      console.log('Total sales found:', totalSales); // Debugging
  
      const sales = await Sale.find(filter)
        .populate({ path: 'customerID', select: 'customerName' }) // Populate customerName only
        .populate({ path: 'subCustomerID', model: 'SubCustomer', select: 'subCustomerName' }) // Ensure subCustomerID is populated properly
        .sort({ saleDate: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean()
        .exec();
  
      console.log('Sales after populate:', sales); // Debugging
  
      const salesWithDetails = await Promise.all(sales.map(async sale => {
        const totalAmount = await Sale.findById(sale._id).then(s => s.getTotalSaleSum());
        const totalSaleAfterDC = await Sale.findById(sale._id).then(s => s.totalSaleAfterDC());
        return { ...sale, totalAmount, totalSaleAfterDC };
      }));
  
      res.json({
        sales: salesWithDetails,
        currentPage: page,
        totalPages: Math.ceil(totalSales / pageSize),
        totalSales,
      });
    } catch (error) {
      console.error('Error fetching sales:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  

// Route: Edit Sale
router.post('/editSale', async (req, res) => {
  const { edit_id } = req.body;

  try {
    const sale = await Sale.findById(edit_id)
      .populate('customerID')
      .populate('subCustomerID'); // ✅ ตรวจสอบว่า subCustomerID ถูก populate หรือไม่

    if (!sale) {
      return res.status(404).send('Sale not found');
    }

    // ✅ โหลดลูกค้าทั้งหมด พร้อมข้อมูล subCustomers
    const customers = await Customer.find().populate('subCustomerIDs');

    // ✅ หาลูกค้าที่ถูกเลือก และดึง subCustomers ของลูกค้าหลัก
    const selectedCustomer = customers.find(customer => String(customer._id) === String(sale.customerID._id));
    const subCustomers = selectedCustomer ? selectedCustomer.subCustomerIDs : [];

    console.log("✅ Sale.subCustomerID:", sale.subCustomerID ? sale.subCustomerID._id : "null");
    console.log("✅ SubCustomers Loaded:", subCustomers); // ตรวจสอบว่ามีข้อมูลหรือไม่

    res.render('editSale', { 
      sale, 
      customers, 
      subCustomers
    });

  } catch (error) {
    console.error('❌ Error in retrieving sale details:', error);
    res.status(500).send('Server Error');
  }
});



// Route: Update Sale
router.post('/updateSale', async (req, res) => {
  let { saleID, customerID, subCustomerID, billStatus, discount, saleDate } = req.body;

  try {
    if (!saleID || !customerID) {
      return res.status(400).json({ message: 'Sale ID และ Customer ID จำเป็นต้องระบุ' });
    }

    // ✅ ตรวจสอบค่า subCustomerID
    if (!subCustomerID || subCustomerID.trim() === '') {
      subCustomerID = null;
    }

    // ✅ ตรวจสอบค่า saleDate
    if (!saleDate || isNaN(new Date(saleDate))) {
      saleDate = new Date(); // ถ้าไม่ได้กรอก ให้ใช้วันที่ปัจจุบัน
    } else {
      saleDate = new Date(saleDate); // แปลงเป็น Date
    }

    // ✅ ตรวจสอบค่า discount
    discount = parseFloat(discount) || 0;

    const updatedSale = await Sale.findByIdAndUpdate(
      saleID,
      { customerID, subCustomerID, billStatus, discount, saleDate },
      { new: true, runValidators: true } // ✅ ใช้ runValidators เพื่อตรวจสอบความถูกต้อง
    );

    if (!updatedSale) {
      return res.status(404).json({ message: 'ไม่พบข้อมูล Sale ที่ต้องการอัปเดต' });
    }

    res.status(200).json({ message: 'อัปเดตสำเร็จ', updatedSale });
  } catch (error) {
    console.error('❌ Error updating sale:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดต', error });
  }
});


// Route: Delete Sale
router.post('/deleteSale', async (req, res) => {
  const { delete_id } = req.body;

  try {
    const saleEntries = await SaleEntry.find({ saleID: delete_id });

    if (saleEntries.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete sale with active entries' });
    }

    const deletedSale = await Sale.findByIdAndDelete(delete_id);

    if (deletedSale) {
      res.json({ success: true, message: 'Sale deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Sale not found' });
    }
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ success: false, message: 'Error deleting sale' });
  }
});

// Route: Close Bill
router.post('/closeBill', async (req, res) => {
  const { id } = req.body;

  try {
    const sale = await Sale.findByIdAndUpdate(id, { billStatus: 'ปิด' }, { new: true });
    res.json({ success: true, billStatus: sale.billStatus });
  } catch (error) {
    console.error('Error closing bill:', error);
    res.status(500).json({ success: false, message: 'Failed to close bill' });
  }
});

module.exports = router;
