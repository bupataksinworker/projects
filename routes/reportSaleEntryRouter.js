const express = require('express');
const router = express.Router();

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

// เรียกใช้งานฟังก์ชัน checkLoggedIn จากไฟล์ authUtils.js
const { checkLoggedIn } = require('../db/authUtils');
// ตรวจสอบการเข้าสู่ระบบก่อนเข้าถึง router
router.use((req, res, next) => {
    if (!checkLoggedIn(req)) {
        return res.redirect('/login');
    }
    next();
});

// Route สำหรับแสดงผลข้อมูล
router.get('/reportSaleEntry', async (req, res) => {

    try {
        const customers = await Customer.find();
        const grains = await Grain.find();
        const origins = await Origin.find();
        const heats = await Heat.find();
        const sharps = await Sharp.find();
        const grades = await Grade.find().sort({ sorter: 1 });

        // ส่งข้อมูลกลับไปยังไคลเอ็นต์
        res.render('reportSaleEntry', { customers, grains, origins, heats, sharps, grades });
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).send('Internal Server Error');
    }
});

// API สำหรับดึงข้อมูล subCustomer
router.get('/api/subCustomers', async (req, res) => {
    const { customerId } = req.query;
    try {
        // ดึงข้อมูล Customer พร้อมข้อมูล SubCustomer ที่ populate มา
        const customer = await Customer.findById(customerId).populate('subCustomerIDs').exec();

        if (!customer) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลลูกค้า' });
        }

        // ส่งข้อมูล subCustomers กลับไปยัง client
        res.json({ success: true, subCustomers: customer.subCustomerIDs });
    } catch (err) {
        console.error('Error fetching subCustomers:', err);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Sub-customer', error: err.message });
    }
});


// API สำหรับดึงข้อมูล size ตาม grainID
router.get('/api/sizes', async (req, res) => {
    const { grainID } = req.query;
    try {
        const sizes = await Size.find({ grainID: { $in: grainID.split(',') } })
            .populate({
                path: 'grainID',
                select: 'grainName sorter'
            })
            .sort({ 'grainID': 1, 'sorter': 1 }) // เรียงลำดับตาม grainID ก่อน แล้วตาม sorter
            .exec();

        res.json(sizes);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/api/products', async (req, res) => {
    const { grainID, originID, heatID, sizeID } = req.query;
    try {
        const query = {};

        // สร้าง query เงื่อนไขสำหรับ typeID
        if (grainID || originID || heatID) {
            const typeQuery = {};

            if (grainID) {
                typeQuery.grainID = { $in: grainID.split(',') };
            }
            if (originID) {
                typeQuery.originID = { $in: originID.split(',') };
            }
            if (heatID) {
                typeQuery.heatID = { $in: heatID.split(',') };
            }

            const types = await Type.find(typeQuery).select('_id');
            const typeIDs = types.map(type => type._id);

            query.typeID = { $in: typeIDs };
        }

        if (sizeID) {
            query.sizeID = sizeID;
        }

        // console.log("query :")
        // console.log(query);

        const products = await Product.find(query)
            .populate({
                path: 'typeID',
                populate: [
                    { path: 'grainID', select: 'grainName' },
                    { path: 'originID', select: 'originName' },
                    { path: 'heatID', select: 'heatName' }
                ]
            })
            .populate('sizeID', 'sizeName')
            .populate('gradeID', 'gradeName')
            .exec();

        // console.log("products :")
        // console.log(products);

        res.json(products);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/api/batchs', async (req, res) => {
    const { grainID } = req.query;
    try {
        const query = {};

        if (grainID) {
            const grainIDs = grainID.split(',');
            const types = await Type.find({ grainID: { $in: grainIDs } }).select('_id').exec();
            const typeIDs = types.map(type => type._id);
            query.typeID = { $in: typeIDs };
        }

        const batchs = await Batch.find(query).exec();
        res.json({ batchs });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/api/saleEntries', async (req, res) => {
    try {
        const saleEntries = await SaleEntry.find()
            .populate({
                path: 'productID',
                populate: {
                    path: 'typeID',
                    populate: ['grainID', 'originID', 'heatID']
                }
            })
            .populate('saleID')
            .populate('batchID')
            .sort({ entryDate: -1, sorter: -1 })
            .exec();

        res.json(saleEntries);
    } catch (err) {
        res.status(500).send(err.message);
    }
});


module.exports = router;
