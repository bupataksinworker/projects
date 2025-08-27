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

    // --- แปลงพารามิเตอร์ ---
    const yy = year ? (Number(year) - 1957) : null; // 2025 -> 68 (พ.ศ. สองหลัก)
    const setNumbers = rawSetNumber ? rawSetNumber.split(',').map(Number) : [];
    const originsArray = origins ? origins.split(',') : [];

    console.log('year :', year);
    console.log('setNumber :', rawSetNumber || '');

    // ---------- PIPELINE สำหรับ SaleEntry ----------
    const saleFilters = [];

    // ใส่ batchID (ObjectId)
    if (batchID) {
      if (!mongoose.Types.ObjectId.isValid(batchID)) {
        return res.status(400).json({ message: 'Invalid batchID' });
      }
      saleFilters.push({ batchID: new mongoose.Types.ObjectId(batchID) });
    }

    // เริ่ม pipeline
    const aggregatePipeline = [
      // product -> type -> origin
      { $lookup: { from: 'products', localField: 'productID', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $lookup: { from: 'types', localField: 'product.typeID', foreignField: '_id', as: 'product.type' } },
      { $unwind: '$product.type' },
      { $lookup: { from: 'origins', localField: 'product.type.originID', foreignField: '_id', as: 'product.type.origin' } },
      { $unwind: '$product.type.origin' },

      // batch
      { $lookup: { from: 'batchs', localField: 'batchID', foreignField: '_id', as: 'batch' } },
      { $unwind: '$batch' },

      // sale (เผื่อบางเอกสารไม่มี saleID)
      { $lookup: { from: 'sales', localField: 'saleID', foreignField: '_id', as: 'sale' } },
      { $unwind: { path: '$sale', preserveNullAndEmptyArrays: true } }
    ];

    // year -> เทียบที่ batch.batchYear
    if (yy !== null) saleFilters.push({ 'batch.batchYear': yy });

    // setNumber -> เทียบที่ batch.number
    if (setNumbers.length) saleFilters.push({ 'batch.number': { $in: setNumbers } });

    // origins (ถ้าระบุ)
    if (originsArray.length) {
      saleFilters.push({ 'product.type.origin.originCode': { $in: originsArray } });
    }

    if (saleFilters.length) aggregatePipeline.push({ $match: { $and: saleFilters } });

    // Group จาก SaleEntry
    aggregatePipeline.push(
      {
        $group: {
          _id: '$batchID',
          batchName: { $first: '$batch.batchName' },
          costOfBatch: { $first: '$batch.costOfBatch' },
          displayName: { $first: '$product.displayName' },
          sorter: { $first: '$sorter' },

          total: { $sum: 0 },
          totalPrice: { $sum: 0 },

          sold: {
            $sum: {
              $cond: [{ $eq: ['$entryStatus', 'Y'] }, '$closeWeight', 0]
            }
          },
          waitingForSale: {
            $sum: {
              $cond: [{ $eq: ['$entryStatus', 'N'] }, '$openWeight', 0]
            }
          },
          soldPrice: {
            $sum: {
              $cond: [
                { $eq: ['$entryStatus', 'Y'] },
                { $multiply: ['$closeWeight', '$cost'] },
                0
              ]
            }
          },
          waitingForSalePrice: {
            $sum: {
              $cond: [
                { $eq: ['$entryStatus', 'N'] },
                { $multiply: ['$openWeight', '$cost'] },
                0
              ]
            }
          },
          sumNetSale: {
            $sum: {
              $cond: [
                { $eq: ['$entryStatus', 'Y'] },
                {
                  $subtract: [
                    { $subtract: [{ $multiply: ['$closeWeight', '$closePrice'] }, { $multiply: ['$closeWeight', '$cost'] }] },
                    { $multiply: [{ $multiply: ['$closeWeight', '$closePrice'] }, { $divide: ['$sale.discount', 100] }] }
                  ]
                },
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          batchID: '$_id',
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
      { $sort: { displayName: 1, sorter: 1 } }
    );

    const saleEntries = await SaleEntry.aggregate(aggregatePipeline);

    // ---------- PIPELINE สำหรับ Stock (คงรูปแบบเอกสารดิบ + ฝัง batch เป็นอ็อบเจกต์) ----------
    const stockPipeline = [];

    // batchID
    if (batchID) {
      stockPipeline.push({ $match: { batchID: new mongoose.Types.ObjectId(batchID) } });
    }

    // join batch สำหรับกรอง year/set และใช้ชื่อชุด
    stockPipeline.push(
      { $lookup: { from: 'batchs', localField: 'batchID', foreignField: '_id', as: 'batch' } },
      { $unwind: '$batch' }
    );

    // year / setNumber ที่ batch
    if (yy !== null) stockPipeline.push({ $match: { 'batch.batchYear': yy } });
    if (setNumbers.length) stockPipeline.push({ $match: { 'batch.number': { $in: setNumbers } } });

    // (ออปชัน) origins สำหรับ stock: type -> origin (ใส่เฉพาะเมื่อมี origins)
    if (originsArray.length) {
      stockPipeline.push(
        { $lookup: { from: 'types', localField: 'typeID', foreignField: '_id', as: 'type' } },
        { $unwind: '$type' },
        { $lookup: { from: 'origins', localField: 'type.originID', foreignField: '_id', as: 'origin' } },
        { $unwind: '$origin' },
        { $match: { 'origin.originCode': { $in: originsArray } } }
      );
    }

    // จัดรูปให้ batchID เป็นอ็อบเจกต์ (เหมือน populate) + ส่งฟิลด์ที่ client ใช้
    stockPipeline.push({
      $project: {
        _id: 1,
        addStock: 1,
        cost: 1,
        typeID: 1,
        sizeID: 1,
        gradeID: 1,
        // แทนที่ batchID ด้วยเอกสาร batch (ให้ client อ่าน batchID.batchName/costOfBatch ได้)
        batchID: '$batch'
      }
    });

    const stockEntries = await Stock.aggregate(stockPipeline);

    // ---------- batchList: ชุดที่ตรง year/setNumber แต่ยังไม่มีทั้ง sale/stock ----------
    const usedBatchIds = new Set([
      ...saleEntries.map(e => String(e.batchID)),
      ...stockEntries.map(e => String(e.batchID?._id))
    ]);

    const batchFind = {};
    if (yy !== null) batchFind.batchYear = yy;
    if (setNumbers.length) batchFind.number = { $in: setNumbers };

    let batchList = [];
    if (Object.keys(batchFind).length) {
      const allBatches = await Batch.find(batchFind).select('_id batchName batchYear number costOfBatch').lean();
      batchList = allBatches.filter(b => !usedBatchIds.has(String(b._id)));
    }

    console.log('saleEntries :', saleEntries.length);
    console.log('stockEntries :', stockEntries.length);
    console.log('batchList :', batchList.length);

    return res.json({ saleEntries, stockEntries, batchList });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error retrieving stock data' });
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
