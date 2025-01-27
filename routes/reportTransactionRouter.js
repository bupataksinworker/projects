const express = require('express');
const router = express.Router();
const moment = require('moment');
const mongoose = require('mongoose');

// เรียกใช้งาน model
const Customer = require('../models/customer');
const Sale = require('../models/sale');
const SaleEntry = require('../models/saleEntry');
const Batch = require('../models/batch');
const Product = require('../models/product');
const Type = require('../models/type');
const Grain = require('../models/grain');
const Origin = require('../models/origin');
const Heat = require('../models/heat');
const Size = require('../models/size');
const Grade = require('../models/grade');
const Sharp = require('../models/sharp');

const Stock = require('../models/stock');

// เส้นทางสำหรับไปหน้าแสดงผล
router.get('/reportTransaction/:batchID', (req, res) => {
    const { batchID } = req.params; // ดึง batchID จาก URL
    res.render('reportTransaction', { batchID });
});


// เพิ่มเส้นทางสำหรับดึงข้อมูลทั้งหมดจาก Stock โดยใช้ batchID เป็นเงื่อนไข
router.get('/api/getAllStock/:batchID', async (req, res) => {
    const { batchID } = req.params; // ดึง batchID จาก URL
    console.log(batchID)
    try {
        // ค้นหา stock ที่ตรงกับ batchID
        const stocks = await Stock.find({ batchID }) // ใช้ batchID เป็นเงื่อนไขในการค้นหา
            .populate('batchID')
            .populate('typeID')
            .populate('sizeID')
            .populate('gradeID')
            .exec();

        // ถ้าไม่มีข้อมูล stock ที่ตรงกับ batchID
        if (!stocks.length) {
            return res.status(404).json({ success: false, message: 'No stock found for the given batchID' });
        }

        // ส่งข้อมูล stock กลับไปในรูปแบบ JSON
        res.json({ success: true, data: stocks });
    } catch (error) {
        console.error('Error retrieving stock:', error);
        res.status(500).json({ success: false, message: 'Error retrieving stock data' });
    }
});


// เพิ่ม router สำหรับลบข้อมูล stock โดยใช้ stock._id
router.delete('/api/deleteStock/:id', async (req, res) => {
    const stockID = req.params.id;

    try {
        // ค้นหาและลบ stock โดยใช้ _id
        const deletedStock = await Stock.findByIdAndDelete(stockID);

        // ตรวจสอบว่ามีการลบสำเร็จหรือไม่
        if (deletedStock) {
            return res.status(200).json({ success: true, message: 'ลบข้อมูลสำเร็จ' });
        } else {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลที่ต้องการลบ' });
        }
    } catch (error) {
        console.error('Error deleting stock:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
    }
});

module.exports = router;
