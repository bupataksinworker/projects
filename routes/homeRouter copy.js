const express = require('express');
const router = express.Router();
const Sale = require('../models/sale');
const SaleEntry = require('../models/saleEntry');
const { checkLoggedIn } = require('../db/authUtils');
const moment = require('moment');
const Batch = require('../models/batch');
const Stock = require('../models/stock');
const Product = require('../models/product');
const Type = require('../models/type');
const Origin = require('../models/origin');
const Size = require('../models/size');
const Grade = require('../models/grade');

// ตรวจสอบการเข้าสู่ระบบก่อนเข้าถึง router
router.use((req, res, next) => {
    if (!checkLoggedIn(req)) {
        return res.redirect('/login');
    }
    next();
});

// นำเข้าฟังก์ชั่นจากไฟล์ utilityRouter.js
const { getTotalValues } = require('./utilityRouter');

// ฟังก์ชัน fetchSales ดึงข้อมูลยอดขาย
const fetchSales = async (dateStart, dateEnd) => {
    const filter = {};
    if (dateStart && dateEnd) {
        filter['saleDate'] = { $gte: new Date(dateStart), $lte: new Date(dateEnd) };
    }

    try {
        const sales = await Sale.find(filter)
            .populate('customerID')
            .sort({ saleDate: -1 });

        const salesWithTotalAmounts = await Promise.all(sales.map(async sale => {
            const [totalAmount, totalSaleAfterDC, totalValues] = await Promise.all([
                sale.getTotalSaleSum(),
                sale.totalSaleAfterDC(),
                getTotalValues(sale)
            ]);

            return { ...sale.toObject(), totalAmount, totalSaleAfterDC, totalValues };
        }));

        return salesWithTotalAmounts;
    } catch (error) {
        console.error('Error fetching sales:', error);
        throw new Error('Internal Server Error');
    }
};

// ฟังก์ชัน fetchSaleEntries ดึงข้อมูลการขายแต่ละชุด
const fetchSaleEntries = async (dateStart, dateEnd) => {
    const filter = {};
    if (dateStart && dateEnd) {
        filter['entryDate'] = { $gte: new Date(dateStart), $lte: new Date(dateEnd) };
    }

    try {
        const saleEntries = await SaleEntry.find(filter)
            .populate('saleID')
            .sort({ entryDate: -1 });

        return saleEntries;
    } catch (error) {
        console.error('Error fetching sale entries:', error);
        throw new Error('Internal Server Error');
    }
};

// หน้าจัดการ
router.get('/home', async (req, res) => {
    try {
        const dateStart = moment().subtract(1, 'years').startOf('month').toDate();
        const dateEnd = moment().endOf('month').toDate();
        const [salesData, saleEntriesData] = await Promise.all([
            fetchSales(dateStart, dateEnd),
            fetchSaleEntries(dateStart, dateEnd)
        ]);

        res.render('home', {
            data: JSON.stringify({
                sales: salesData,
                saleEntries: saleEntriesData
            })
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// API route batchProfitOriginTableBody
router.get('/api/batches', async (req, res) => {
    try {
        const { year, sets } = req.query;

        console.log('API /api/batches called with:', { year, sets });

        if (!year || !sets) {
            return res.status(400).json({ error: 'Year and sets are required' });
        }

        const setNumbers = sets.split(',').map(Number);
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
                    localField: "productID",
                    foreignField: "_id",
                    as: "productType"
                }
            },
            {
                $unwind: {
                    path: "$productType",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "origins",
                    localField: "productType.originID",
                    foreignField: "_id",
                    as: "productOrigin"
                }
            },
            {
                $unwind: {
                    path: "$productOrigin",
                    preserveNullAndEmptyArrays: true
                }
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

        // Add $lookup to join Batch and Type collections to fetch typeID
        aggregatePipeline.push(
            {
                $lookup: {
                    from: "types",
                    localField: "batch.typeID",
                    foreignField: "_id",
                    as: "typeDetails"
                }
            }
        );

        // Unwind typeDetails to access originID
        aggregatePipeline.push({ $unwind: "$typeDetails" });

        // Add $lookup to join Origin collection to fetch originCode
        aggregatePipeline.push(
            {
                $lookup: {
                    from: "origins",
                    localField: "typeDetails.originID",
                    foreignField: "_id",
                    as: "originDetails"
                }
            }
        );

        // Unwind originDetails to access originCode
        aggregatePipeline.push({ $unwind: "$originDetails" });

        // Filter by setNumber
        const setNumber = sets.split(',').map(Number);
        if (setNumber) {
            filters.push({ 'batch.number': { $in: setNumber } });
        }

        // Apply filters to pipeline
        if (filters.length > 0) {
            aggregatePipeline.push({ $match: { $and: filters } });
        }

        // console.log('Aggregate Pipeline:', JSON.stringify(aggregatePipeline, null, 2));

        // Group ข้อมูลจาก SaleEntry
        aggregatePipeline.push(
            {
            $group: {
                _id: "$batchID",
                batchID: { $first: "$batch._id" },
                batchName: { $first: "$batch.batchName" },
                number: { $first: "$batch.number" },
                originCode: { $first: "$originDetails.originCode" },
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
                number: 1, // เพิ่ม number ใน project
                originCode: 1, // เพิ่ม originCode ใน project
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

        // console.log('SaleEntries Result:', saleEntries);

        // ดึงข้อมูล Stock แยกจาก SaleEntry โดยใช้ batchID
        let stockFilters = [];

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

        // Debugging: Log originCode for saleEntries and stockEntries
        saleEntries.forEach(entry => {
            console.log('SaleEntry OriginCode:', entry.originCode);
        });

        stockEntries.forEach(entry => {
            console.log('StockEntry OriginCode:', entry.typeID?.originID?.originCode);
        });

        // Filter saleEntries and stockEntries by originCode with safety checks
        const saleEntriesMyn = saleEntries.filter(entry => entry.originCode === 'Myn');
        const saleEntriesMoz = saleEntries.filter(entry => entry.originCode === 'Moz');

        const stockEntriesMyn = stockEntries.filter(entry => entry.typeID?.originID?.originCode === 'Myn');
        const stockEntriesMoz = stockEntries.filter(entry => entry.typeID?.originID?.originCode === 'Moz');

        console.log('Filtered saleEntriesMyn:', saleEntriesMyn);
        console.log('Filtered saleEntriesMoz:', saleEntriesMoz);
        console.log('Filtered stockEntriesMyn:', stockEntriesMyn);
        console.log('Filtered stockEntriesMoz:', stockEntriesMoz);

        console.log('Count of saleEntriesMyn:', saleEntriesMyn.length);
        console.log('Count of saleEntriesMoz:', saleEntriesMoz.length);
        console.log('Count of stockEntriesMyn:', stockEntriesMyn.length);
        console.log('Count of stockEntriesMoz:', stockEntriesMoz.length);

        // ส่งข้อมูลไปยัง client
        res.json({ saleEntries, stockEntries });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error retrieving stock data' });
    }
});

module.exports = router;
