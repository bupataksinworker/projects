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
const Cost = require('../models/cost');
const Type = require('../models/type');
const Grain = require('../models/grain');
const Origin = require('../models/origin');
const Heat = require('../models/heat');
const Size = require('../models/size');
const Grade = require('../models/grade');
const Sharp = require('../models/sharp');

const Stock = require('../models/stock');

// เส้นทางสำหรับไปหน้าแสดงผล
router.get('/gradeDetails', (req, res) => {
    const { batchID, typeID, sizeID, gradeID,  } = req.query;
    console.log(req.query)
    res.render('gradeDetails');
});

router.post('/api/getGradeDetails', async (req, res) => {
    const { batchID, typeID, sizeID, gradeID } = req.body;
    try {
        // ค้นหา Product ที่ตรงกับ typeID, sizeID, และ gradeID
        const products = await Product.find({
            typeID,
            sizeID,
            gradeID
        }).select('_id');

        // ตรวจสอบว่ามี products ที่ตรงกับเงื่อนไขหรือไม่
        const productIDs = products.map(product => product._id);

        // ค้นหา SaleEntry ที่ตรงกับ batchID และ productIDs
        const saleEntries = await SaleEntry.find({
            batchID,
            productID: { $in: productIDs }
        })
        .populate({
            path: 'productID',
            populate: {
                path: 'typeID sizeID gradeID grainID originID heatID'
            }
        });

        // สร้างเงื่อนไขสำหรับค้นหา Stock จาก SaleEntry หรือใช้ batchID, typeID, และ sizeID ที่ส่งมา
        let stockFilters;
        if (saleEntries.length > 0) {
            stockFilters = saleEntries.map(entry => ({
                batchID: entry.batchID,
                typeID: entry.productID.typeID._id,
                sizeID: entry.productID.sizeID,
                gradeID: entry.productID.gradeID
            }));
        } else {
            stockFilters = [{ batchID, typeID, sizeID, gradeID }];
        }

        // ค้นหา Stock entries ที่ตรงกับ filter criteria
        const stockEntries = await Stock.find({
            $or: stockFilters
        })
        .populate('typeID')
        .populate('sizeID')
        .populate('gradeID');

        // แบ่ง saleEntries ตามสถานะ entryStatus
        const waitingForSale = saleEntries.filter(entry => entry.entryStatus === 'N');
        const sold = saleEntries.filter(entry => entry.entryStatus === 'Y');

        // คำนวณ readyForSale
        const readyForSale = stockEntries;

        // ส่งข้อมูลกลับไปที่ frontend
        res.json({ 
            readyForSale,
            waitingForSale,
            sold 
        });

    } catch (error) {
        console.error('Error fetching grade details:', error);
        res.status(500).json({ error: 'Failed to fetch grade details' });
    }
});


module.exports = router;
