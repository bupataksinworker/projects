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
router.get('/manageStock', (req, res) => {
    res.render('manageStock');
});

// View route สำหรับ manageStockDetails
router.get('/manageStockDetails', (req, res) => {
    const { year, batchID } = req.query;
    res.render('manageStockDetails', { year, batchID });
});

// API route Table Batch
router.get('/api/manageStock', async (req, res) => {
    try {
        const { year, origins, batchID, setNumber: rawSetNumber } = req.query;
        const setNumber = rawSetNumber || 0;
        console.log("setNumber : " + setNumber)
        const filters = [];

        // Filter by year
        if (year) {
            const startDate = moment().year(year).startOf('year').toDate();
            const endDate = moment().year(year).endOf('year').toDate();
            filters.push({ entryDate: { $gte: startDate, $lte: endDate } });
        }

        const aggregatePipeline = [
            {
                $lookup: {
                    from: "products",
                    localField: "productID",
                    foreignField: "_id",
                    as: "product"
                }
            },
            {
                $unwind: "$product"
            },
            {
                $lookup: {
                    from: "types",
                    localField: "product.typeID",
                    foreignField: "_id",
                    as: "product.type"
                }
            },
            {
                $unwind: "$product.type"
            },
            {
                $lookup: {
                    from: "origins",
                    localField: "product.type.originID",
                    foreignField: "_id",
                    as: "product.type.origin"
                }
            },
            {
                $unwind: "$product.type.origin"
            },
            {
                $lookup: {
                    from: "batchs",
                    localField: "batchID",
                    foreignField: "_id",
                    as: "batch"
                }
            },
            {
                $unwind: "$batch"
            },
            {
                $lookup: {
                    from: "sales", // ชื่อคอลเลคชัน Sale
                    localField: "saleID", // ฟิลด์ที่เชื่อมโยงกับ Sale
                    foreignField: "_id",
                    as: "sale"
                }
            },
            {
                $unwind: "$sale" // ทำให้ข้อมูลใน sale เป็นเอกสารเดียว
            }            
        ];

        // Filter by origins
        if (origins) {
            const originsArray = origins.split(',');
            filters.push({ 'product.type.origin.originCode': { $in: originsArray } });
        }

        // Filter by setNumber
        if (setNumber) {
            const setNumberArray = setNumber.split(',').map(Number); // แปลงเป็นตัวเลข
            filters.push({ 'batch.number': { $in: setNumberArray } });
        }

        // Apply filters to pipeline
        if (filters.length > 0) {
            aggregatePipeline.push({ $match: { $and: filters } });
        }

        // Group ข้อมูลจาก SaleEntry
        aggregatePipeline.push(
            {
                $group: {
                    _id: "$batchID",
                    batchName: { $first: "$batch.batchName" },
                    costOfBatch: { $first: "$batch.costOfBatch" },
                    displayName: { $first: "$product.displayName" },
                    sorter: { $first: "$sorter" },

                    // คำนวณค่าอื่นๆ จาก saleEntry
                    total: { $sum: 0 },
                    totalPrice: { $sum: 0 },
                    sold: {
                        $sum: {
                            $cond: {
                                if: { $eq: ["$entryStatus", "Y"] },
                                then: "$closeWeight",
                                else: 0
                            }
                        }
                    },
                    waitingForSale: {
                        $sum: {
                            $cond: {
                                if: { $eq: ["$entryStatus", "N"] },
                                then: "$openWeight",
                                else: 0
                            }
                        }
                    },
                    soldPrice: {
                        $sum: {
                            $cond: {
                                if: { $eq: ["$entryStatus", "Y"] },
                                then: { $multiply: ["$closeWeight", "$cost"] },
                                else: 0
                            }
                        }
                    },
                    waitingForSalePrice: {
                        $sum: {
                            $cond: {
                                if: { $eq: ["$entryStatus", "N"] },
                                then: { $multiply: ["$openWeight", "$cost"] },
                                else: 0
                            }
                        }
                    },
                    sumNetSale: {
                        $sum: {
                            $cond: {
                                if: { $eq: ["$entryStatus", "Y"] },
                                then: {
                                    $subtract: [
                                        {
                                            $subtract: [
                                                { $multiply: ["$closeWeight", "$closePrice"] },
                                                { $multiply: ["$closeWeight", "$cost"] }
                                            ]
                                        },
                                        {
                                            $multiply: [
                                                { $multiply: ["$closeWeight", "$closePrice"] },
                                                { $divide: ["$sale.discount", 100] }
                                            ]
                                        }
                                    ]
                                },
                                else: 0
                            }
                        }
                    }
                }
            },
            {
                $project: { // ใช้ส่งข้อมูลที่เลือกไปใช้งาน
                    _id: 0,
                    batchID: "$_id",
                    batchName: 1,
                    costOfBatch: 1,
                    displayName: 1,
                    sorter: 1,
                    total: 1,
                    totalPrice: 1,
                    sold: 1,
                    waitingForSale: 1,
                    soldPrice: 1,
                    waitingForSalePrice: 1,
                    sumNetSale: 1
                }
            },
            {
                $sort: { displayName: 1, sorter: 1 }
            }
        );

        // ดึงข้อมูลจาก SaleEntry
        const saleEntries = await SaleEntry.aggregate(aggregatePipeline);

        // ดึงข้อมูล Stock แยกจาก SaleEntry โดยใช้ batchID
        let stockFilters = [];
        if (batchID) {
            stockFilters.push({ batchID });
        }

        // ตรวจสอบว่า stockFilters มีข้อมูลหรือไม่ก่อนใช้ $or
        let stockEntries = [];
        if (stockFilters.length > 0) {
            stockEntries = await Stock.find({ $or: stockFilters })
                .populate('typeID')
                .populate('sizeID')
                .populate('gradeID');
        } else {
            stockEntries = await Stock.find()
                .populate('typeID')
                .populate('sizeID')
                .populate('gradeID');
        }


        // ส่งข้อมูลไปยัง client
        res.json({ saleEntries, stockEntries });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving stock data' });
    }
});


// API route Table 1
router.get('/api/manageStockDetails/:year/:batchID', async (req, res) => { // API route Table 1
    const { year, batchID } = req.params;
    let filters = [];

    try {
        // ค้นหาข้อมูล batchDetails ตาม batchID
        const batchDetails = await Batch.findById(batchID).populate({
            path: 'typeID',
            populate: [
                { path: 'grainID' },
                { path: 'originID' },
                { path: 'heatID' }
            ]
        });

        if (!batchDetails) {
            return res.status(404).json({ message: 'Batch not found' });
        }

        // สร้างฟิลเตอร์สำหรับปี
        if (year) {
            const startDate = moment().year(year).startOf('year').toDate();
            const endDate = moment().year(year).endOf('year').toDate();
            filters.push({ entryDate: { $gte: startDate, $lte: endDate } });
        }

        // ใช้ batchID และ typeID._id เพื่อค้นหา SaleEntry ที่เกี่ยวข้อง พร้อมกรองตามปี
        filters.push({
            batchID: batchID,
            'productID': {
                $in: await Product.find({
                    typeID: { $in: batchDetails.typeID.map(type => type._id) }
                }).select('_id')
            }
        });

        const saleEntries = await SaleEntry.find({ $and: filters })
            .populate('productID')
            .populate({
                path: 'productID',
                populate: {
                    path: 'typeID',
                    populate: [
                        { path: 'grainID' },
                        { path: 'originID' },
                        { path: 'heatID' }
                    ]
                }
            });

        // ดึง batchID, typeID, sizeID, gradeID จาก saleEntries ไปค้นหา Stock ที่เกี่ยวข้อง
        let stockFilters;

        if (saleEntries.length > 0) {
            // ถ้า saleEntries มีข้อมูล
            stockFilters = saleEntries.map(entry => ({
                batchID: entry.batchID,
                // typeID: entry.productID.typeID._id,
                // sizeID: entry.productID.sizeID,
                // gradeID: entry.productID.gradeID
            }));
        } else {
            // ถ้า saleEntries ไม่มีข้อมูล ใช้ batchID และ typeID จาก req.params
            stockFilters = [{
                batchID
            }];
        }

        // ค้นหา Stock โดยใช้เงื่อนไขที่ได้จาก saleEntries
        const stockEntries = await Stock.find({
            $or: stockFilters
        }).populate('typeID').populate('sizeID').populate('gradeID');

        // ส่งข้อมูลที่ค้นหาไปที่ view
        res.json({ batchDetails, saleEntries, stockEntries });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving stock details' });
    }
});

// API route Table 2
router.get('/api/getSizesByGrain/:batchID/:typeID/:grainID', async (req, res) => { // API route Table 2
    const { batchID, typeID, grainID } = req.params;

    try {
        // ค้นหาข้อมูล size ที่เกี่ยวข้องกับ grainID
        const sizes = await Size.find({ grainID }).sort({ sorter: 1 });
        // console.log("grainID :" + grainID)
        if (!sizes.length) {
            return res.status(404).json({ message: 'No sizes found for the given grainID' });
        }

        // ค้นหาข้อมูล SaleEntry ที่ตรงกับ batchID, typeID และ sizeID
        const saleEntries = await SaleEntry.find({
            batchID,
            'productID': {
                $in: await Product.find({
                    typeID,
                    sizeID: { $in: sizes.map(size => size._id) }
                }).select('_id')
            }
        }).populate('productID').populate({
            path: 'productID',
            populate: {
                path: 'typeID',
                populate: [
                    { path: 'grainID' },
                    { path: 'originID' },
                    { path: 'heatID' }
                ]
            }
        });

        // if (!saleEntries.length) {
        //     return res.status(404).json({ message: 'No sale entries found for the given criteria' });
        // }

        // ดึง batchID, typeID, sizeID, gradeID จาก saleEntries ไปค้นหา Stock ที่เกี่ยวข้อง
        let stockFilters;

        if (saleEntries.length > 0) {
            // ถ้า saleEntries มีข้อมูล
            stockFilters = saleEntries.map(entry => ({
                batchID: entry.batchID,
                typeID: entry.productID.typeID._id,
                // sizeID: entry.productID.sizeID,
                // gradeID: entry.productID.gradeID
            }));
        } else {
            // ถ้า saleEntries ไม่มีข้อมูล ใช้ batchID และ typeID จาก req.params
            stockFilters = [{
                batchID,
                typeID
            }];
        }

        // ค้นหา Stock โดยใช้เงื่อนไขที่ได้จาก saleEntries
        const stockEntries = await Stock.find({
            $or: stockFilters
        }).populate('typeID').populate('sizeID').populate('gradeID');

        // if (!saleEntries.length && !stockEntries.length) {
        //     return res.status(404).json({ message: 'No sale entries or stock entries found for the given criteria' });
        // }

        let products;
        if (typeID) {
            products = await Product.find({ typeID });
        } else {
            products = '';
        }

        // ส่งข้อมูล sizes, saleEntries, และ stockEntries กลับไปในรูปแบบ JSON
        res.json({ sizes, saleEntries, stockEntries, products });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving sizes and sale entries' });
    }
});

// API route Table 3
router.get('/api/getGradeBySize/:batchID/:typeID/:sizeID', async (req, res) => { // API route Table 3
    const { batchID, typeID, sizeID } = req.params;

    try {
        // Fetch all grades
        const grades = await Grade.find().sort({ sorter: 1 });

        if (!grades.length) {
            return res.status(404).json({ message: 'No grades found' });
        }

        // Fetch SaleEntry that matches batchID, typeID, sizeID, and the grades
        const saleEntries = await SaleEntry.find({
            batchID,
            'productID': {
                $in: await Product.find({
                    typeID,
                    sizeID,
                    gradeID: { $in: grades.map(grade => grade._id) } // Include gradeID in the condition
                }).select('_id')
            }
        }).populate('productID').populate({
            path: 'productID',
            populate: {
                path: 'typeID',
                populate: [
                    { path: 'grainID' },
                    { path: 'originID' },
                    { path: 'heatID' }
                ]
            }
        });

        // if (!saleEntries.length) {
        //     return res.status(404).json({ message: 'No sale entries found for the given criteria' });
        // }

        // ดึง batchID, typeID, sizeID, gradeID จาก saleEntries ไปค้นหา Stock ที่เกี่ยวข้อง
        let stockFilters;

        if (saleEntries.length > 0) {
            // ถ้า saleEntries มีข้อมูล
            stockFilters = saleEntries.map(entry => ({
                batchID: entry.batchID,
                typeID: entry.productID.typeID._id,
                sizeID: entry.productID.sizeID,
                // gradeID: entry.productID.gradeID
            }));
        } else {
            // ถ้า saleEntries ไม่มีข้อมูล ใช้ batchID และ typeID จาก req.params
            stockFilters = [{
                batchID,
                typeID,
                sizeID
            }];
        }

        // Find stock entries matching the filter criteria
        const stockEntries = await Stock.find({
            $or: stockFilters
        }).populate('typeID').populate('sizeID').populate('gradeID');

        
        let products;
        if (typeID) {
            products = await Product.find({ typeID, sizeID });
        } else {
            products = '';
        }

        // Send grades, saleEntries, and stockEntries as JSON response
        res.json({ grades, saleEntries, stockEntries, products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving grades, sale entries, and stock entries' });
    }
});

router.post('/api/addStock', async (req, res) => { // API add Stock
    const { batchID, typeID, sizeID, gradeID, cost, addStock, comment } = req.body;
    console.log(req.body)
    // ตรวจสอบว่าข้อมูลที่ส่งมาครบถ้วน
    if (!batchID || !typeID || !sizeID || !gradeID || !cost || addStock <= 0) {
        return res.status(400).json({ success: false, message: 'กรุณาระบุข้อมูลให้ครบถ้วนและถูกต้อง' });
    }

    try {
        // สร้างรายการสต็อกใหม่
        const stock = new Stock({
            batchID,
            typeID,
            sizeID,
            gradeID,
            cost: cost,
            addStock: parseFloat(addStock),
            comment: comment || '' // ถ้าไม่มี comment ให้เป็นค่าว่าง
        });

        // บันทึกข้อมูลลงในฐานข้อมูล
        await stock.save();
        res.json({ success: true, message: 'เพิ่มสต๊อกสำเร็จ' });
    } catch (error) {
        console.error('Error adding stock:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเพิ่มสต๊อก' });
    }
});

// เส้นทาง API สำหรับดึงข้อมูล cost ที่ตรงกับ typeID, sizeID, gradeID
router.get('/api/getCostByDetails', async (req, res) => { // เส้นทาง API สำหรับดึงข้อมูล cost ที่ตรงกับ typeID, sizeID, gradeID

    const { typeID, sizeID, gradeID } = req.query;

    try {
        // ค้นหา productID ที่ตรงกับเงื่อนไขที่ได้รับ
        const product = await Product.findOne({ typeID, sizeID, gradeID });

        if (!product) {
            return res.json({ success: false, message: 'ไม่พบข้อมูล Product' });
        }

        // ค้นหาข้อมูล Cost ที่ตรงกับ productID ทั้งหมด โดยเรียงจากค่า sorter มากไปน้อย
        const costs = await Cost.find({ productID: product._id })
            .sort({ sorter: -1 }); // เรียงตามค่า sorter จากมากไปน้อย

        if (!costs.length) {
            return res.json({ success: false, message: 'ไม่พบข้อมูล Cost' });
        }

        // console.log(costs);
        // ส่งข้อมูล costs ทั้งหมดกลับไปในรูปแบบ JSON
        res.json({ success: true, costs });
    } catch (error) {
        console.error('Error retrieving costs:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล cost' });
    }
});

// API เพื่อดึง grainID โดยใช้ typeID
router.get('/api/getGrainByType/:typeID', async (req, res) => { // API เพื่อดึง grainID โดยใช้ typeID
    const { typeID } = req.params;

    try {
        // ค้นหาข้อมูล Type โดยใช้ typeID และ populate grainID
        const type = await Type.findById(typeID).populate('grainID');

        // ตรวจสอบว่าพบ Type หรือไม่
        if (!type) {
            return res.status(404).json({ message: 'ไม่พบข้อมูลประเภท (Type)' });
        }

        // ตรวจสอบว่า grainID มีค่าหรือไม่
        if (!type.grainID) {
            return res.status(404).json({ message: 'ไม่พบข้อมูล grainID' });
        }

        // ส่ง grainID กลับไปใน response
        res.json({ grainID: type.grainID._id });
    } catch (error) {
        console.error('Error fetching grainID:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล grainID' });
    }
});

module.exports = router;
