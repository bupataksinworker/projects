const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); //การเข้ารหัส
const mongoose = require('mongoose');

// เรียกใช้งานฟังก์ชัน checkLoggedIn จากไฟล์ authUtils.js
const { checkLoggedIn } = require('../db/authUtils');
// ตรวจสอบการเข้าสู่ระบบก่อนเข้าถึง router
router.use((req, res, next) => {
    if (!checkLoggedIn(req)) {
        return res.redirect('/login');
    }
    next();
});

// นำเข้าฟังก์ชั่นจากไฟล์ utilityRouter.js
const { getTotalValues } = require('./utilityRouter');

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

// หน้า manageSaleEntry สำหรับการโหลดหน้าครั้งแรก
router.get('/manageSaleEntry/:saleId', async (req, res) => {

    try {
        const sale = await Sale.findById(req.params.saleId)
            .populate('customerID', 'customerName email phone')
            .populate('subCustomerID', 'subCustomerName'); 

        if (!sale) {
            return res.status(404).send("Sale not found");
        }

        const totalValues = await getTotalValues(sale); // ส่ง sale ที่ได้ไปฟังก์ชั่นหาผลรวมที่ต้องการ

        const entry = await SaleEntry.find({ saleID: sale._id })
            .populate('batchID')
            .populate({
                path: 'productID',
                populate: [
                    { path: 'typeID', select: 'originCode heatCode' },
                    { path: 'gradeID', select: 'gradeName' },
                    { path: 'sizeID', select: 'sizeDescription' }
                ]
            });

        const products = await Product.find().populate('sizeID').populate('typeID').populate('gradeID');
        const costs = await Cost.find();
        const types = await Type.find();
        const sizes = await Size.find();
        const grades = await Grade.find();
        const sharps = await Sharp.find();
        console.log("Sale Data:", JSON.stringify(sale, null, 2));

        res.render('manageSaleEntry', {
            sale,
            entry,
            products,
            costs,
            types,
            sizes,
            grades,
            sharps,
            ...totalValues
        });
    } catch (error) {
        console.error('Failed to retrieve sale:', error);
        res.status(500).send("Internal Server Error");
    }
});

// หน้า manageSaleEntry สำหรับข้อมูล real-time
router.get('/api/saleEntries/:saleId', async (req, res) => {

    try {
        const entries = await SaleEntry.find({ saleID: req.params.saleId })
            .populate('batchID')
            .populate({
                path: 'productID',
                populate: [
                    { path: 'typeID', select: 'originCode heatCode' },
                    { path: 'gradeID', select: 'gradeName' },
                    { path: 'sizeID', select: 'sizeDescription' }
                ]
            });

        res.json(entries);
    } catch (error) {
        console.error('Failed to retrieve sale entries:', error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// หน้า manageSaleEntry สำหรับข้อมูล real-time
router.get('/api/saleResult/:saleId', async (req, res) => {

    try {
        const sale = await Sale.findById(req.params.saleId).populate('customerID', 'customerName email phone');

        if (!sale) {
            return res.status(404).send("Sale not found");
        }

        const totalValues = await getTotalValues(sale); // ส่ง sale ที่ได้ไปฟังก์ชั่นหาผลรวมที่ต้องการ

        res.json({ sale, totalValues });
    } catch (error) {
        console.error('Failed to retrieve sale entries:', error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// เส้นทางการเพิ่ม saleEntry
router.post('/addSaleEntry', async (req, res) => {

    try {
        const newEntry = new SaleEntry(req.body);
        await newEntry.save();
        res.json({ message: 'SaleEntry added successfully', entry: newEntry });
    } catch (error) {
        console.error('Error adding sale entry:', error);
        res.status(500).json({ error: 'Failed to add sale entry' });
    }
});

// Update closeWeight and closePrice
router.put('/api/inputSaleEntries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { closeWeight, closePrice } = req.body;

        const updateFields = {};
        if (closeWeight !== undefined) updateFields.closeWeight = closeWeight;
        if (closePrice !== undefined) updateFields.closePrice = closePrice;

        const entry = await SaleEntry.findByIdAndUpdate(id, updateFields, { new: true });
        if (!entry) {
            return res.status(404).json({ message: 'Sale entry not found' });
        }

        res.json(entry);
    } catch (error) {
        console.error('Error updating sale entry:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// ส่งข้อมูลไปหน้า editSaleEntry
router.post('/editSaleEntry', async (req, res) => {
    const edit_id1 = req.body.edit_id1; // saleEntry._id
    console.log("edit_id1 : " + edit_id1);
    try {
        const entry = await SaleEntry.findById(edit_id1)
            .populate('saleID')
            .populate('batchID')
            .populate('productID');
        if (!entry) {
            return res.status(404).send('This Grade Not Found');
        }
        const types = await Type.find();
        const sizes = await Size.find();
        const sharps = await Sharp.find();
        res.render('editSaleEntry', { entry, types, sizes, sharps });
    } catch (error) {
        console.error('Error finding grade:', error);
        res.status(500).send('Error finding grade');
    }
});

// อัพข้อมูลที่ได้มาจากฟอร์ม edit
router.post('/updateSaleEntry', async (req, res) => {
    const updateFields = req.body;
    const entryId = updateFields.saleEntryID; // ใช้ saleEntryID จากฟอร์มที่ส่งมา

    if (!mongoose.Types.ObjectId.isValid(entryId)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const updatedSaleEntry = await SaleEntry.findOneAndUpdate(
            { _id: entryId },
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        if (!updatedSaleEntry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        await updatedSaleEntry.save();
        res.status(200).json({ message: 'Update successful', updatedSaleEntry });
    } catch (error) {
        console.error('Update failed:', error); // บันทึกข้อผิดพลาดใน console
        res.status(500).json({ message: 'Internal server error', error });
    }
});

router.post('/api/changeClosePrice', async (req, res) => {
    const { num, percen, saleID } = req.body;
    // console.log(req.body)
    if (!mongoose.Types.ObjectId.isValid(saleID)) {
        return res.status(400).json({ message: 'Invalid sale ID' });
    }

    try {
        // ค้นหาเอนทรีที่มีสถานะเป็น 'N' และมี saleID ที่ตรงกัน
        const saleEntries = await SaleEntry.find({ saleID, entryStatus: 'N' });

        if (!saleEntries.length) {
            return res.status(404).json({ message: 'No entries found with status N for this sale ID' });
        }

        // อัพเดทค่า closePrice
        for (let entry of saleEntries) {
            if (num === 1) {
                entry.closePrice += (entry.closePrice * percen) / 100;
            } else if (num === 2) {
                entry.closePrice -= (entry.closePrice * percen) / 100;
            }

            if (percen === 0) {
                entry.closePrice = entry.openPrice;
            }
            await entry.save();
        }

        res.status(200).json({ message: 'Update successful', updatedEntries: saleEntries });
    } catch (error) {
        console.error('Update failed:', error); // บันทึกข้อผิดพลาดใน console
        res.status(500).json({ message: 'Internal server error', error });
    }
});


// ลบข้อมูลตาม id ที่ได้รับ
router.delete('/deleteSaleEntry/:id', async (req, res) => {
    const entryId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(entryId)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const result = await SaleEntry.deleteOne({ _id: new mongoose.Types.ObjectId(entryId) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        res.status(200).json({ message: 'Delete successful' });
    } catch (error) {
        console.error('Delete failed:', error); // บันทึกข้อผิดพลาดใน console
        res.status(500).json({ message: 'Internal server error', error });
    }
});

// อัพเดทข้อมูลตามเงื่อนไขที่กำหนด
router.put('/okSaleEntry/:id', async (req, res) => {
    const entryId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(entryId)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const { closeWeight, closePrice } = req.body;
        const saleEntry = await SaleEntry.findById(entryId);

        if (!saleEntry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        saleEntry.closeWeight = closeWeight;
        saleEntry.closePrice = closePrice;
        saleEntry.entryStatus = 'Y';

        // บันทึกเอกสารเพื่อให้ pre-save hook ทำงาน
        await saleEntry.save();

        res.status(200).json({ message: 'Update successful' });
    } catch (error) {
        console.error('Update failed:', error); // บันทึกข้อผิดพลาดใน console
        res.status(500).json({ message: 'Internal server error', error });
    }
});

router.get('/getEntryStatus/:entryID', async (req, res) => {
    const entryID = req.params.entryID;

    if (!mongoose.Types.ObjectId.isValid(entryID)) {
        return res.status(400).json({ message: 'Invalid entryID' });
    }

    try {
        const entry = await SaleEntry.findById(entryID);

        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        res.status(200).json({ entryStatus: entry.entryStatus });
    } catch (error) {
        console.error('Error fetching entry status:', error);
        res.status(500).json({ message: 'Internal server error', error });
    }
});

// อัพเดทข้อมูลตามเงื่อนไขที่กำหนดสำหรับทุก entry ที่มี saleID ตรงกับพารามิเตอร์
// router.put('/okAllSaleEntry/:saleID', async (req, res) => {
//     const saleID = req.params.saleID;

//     if (!mongoose.Types.ObjectId.isValid(saleID)) {
//         return res.status(400).json({ message: 'Invalid saleID' });
//     }

//     try {
//         // ตรวจสอบว่ามี entry ใดที่มีสถานะเป็น Y หรือไม่
//         const hasStatusY = await SaleEntry.exists({ saleID: new mongoose.Types.ObjectId(saleID), entryStatus: 'Y' });

//         if (hasStatusY) {
//             return res.status(400).json({ message: 'มีรายการที่มีสถานะเป็น Y จะไม่สามารถใช้ฟังก์ชั่นนี้ได้' });
//         }

//         // ดึง entries ที่ต้องการอัพเดท
//         const entries = await SaleEntry.find({ saleID: new mongoose.Types.ObjectId(saleID) });

//         if (entries.length === 0) {
//             return res.status(404).json({ message: 'No entries found' });
//         }

//         // อัพเดทค่าของ entries ที่มีเงื่อนไขตรงกัน
//         for (let entry of entries) {
//             if (entry.openWeight > 0 && entry.openPrice > 0 && entry.closeWeight === 0 && entry.closePrice === 0) {
//                 entry.closeWeight = entry.openWeight;
//                 entry.closePrice = entry.openPrice;
//                 await entry.save();
//             }
//         }

//         res.status(200).json({ message: 'Update successful' });
//     } catch (error) {
//         console.error('Update failed:', error); // บันทึกข้อผิดพลาดใน console
//         res.status(500).json({ message: 'Internal server error', error });
//     }
// });

// อัพเดทข้อมูลตามเงื่อนไขที่กำหนด
router.put('/cancelSaleEntry/:id', async (req, res) => {
    const entryId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(entryId)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    try {
        const saleEntry = await SaleEntry.findById(entryId);

        if (!saleEntry) {
            return res.status(404).json({ message: 'Entry not found' });
        }

        // ตรวจสอบว่า entryStatus เท่ากับ 'Y'
        if (saleEntry.entryStatus === 'Y') {
            // กำหนดให้ closeWeight = 0
            saleEntry.closeWeight = 0;
            saleEntry.entryStatus = "C";

            // บันทึกเอกสารเพื่อให้ pre-save hook ทำงาน
            await saleEntry.save();

            res.status(200).json({ message: 'Update successful' });
        } else {
            res.status(400).json({ message: 'Conditions not met' });
        }
    } catch (error) {
        console.error('Update failed:', error); // บันทึกข้อผิดพลาดใน console
        res.status(500).json({ message: 'Internal server error', error });
    }
});


// สำหรับข้อมูลที่ใช้ในงาน printing
router.get('/printing/:saleId', async (req, res) => {

    try {
        const sale = await Sale.findById(req.params.saleId).populate('customerID', 'customerName email phone').populate('subCustomerID');

        if (!sale) {
            return res.status(404).send("Sale not found");
        }

        const entries = await SaleEntry.find({ saleID: req.params.saleId })
            .populate('batchID')
            .populate({
                path: 'productID',
                populate: [
                    { path: 'typeID', select: 'originCode heatCode' },
                    { path: 'gradeID', select: 'gradeName' },
                    { path: 'sizeID', select: 'sizeDescription' }
                ]
            });

        // เรียงข้อมูลตาม batchYear จากมากไปน้อย, number จากน้อยไปมาก, sorter จากน้อยไปมาก
        entries.sort((a, b) => {
            if (a.batchID.batchYear !== b.batchID.batchYear) {
                return b.batchID.batchYear - a.batchID.batchYear; // มากไปน้อย
            }
            if (a.number !== b.number) {
                return a.number - b.number; // น้อยไปมาก
            }
            return a.sorter - b.sorter; // น้อยไปมาก
        });

        const totalValues = await getTotalValues(sale); // ส่ง sale ที่ได้ไปฟังก์ชั่นหาผลรวมที่ต้องการ

        res.render('printing', { sale, totalValues, entries });
    } catch (error) {
        console.error('Failed to retrieve sale entries:', error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get('/printingSize/:saleId', async (req, res) => {

    try {
        const sale = await Sale.findById(req.params.saleId).populate('customerID', 'customerName email phone').populate('subCustomerID');

        if (!sale) {
            return res.status(404).send("Sale not found");
        }

        const entries = await SaleEntry.find({ saleID: req.params.saleId })
            .populate('batchID')
            .populate({
                path: 'productID',
                populate: [
                    { path: 'typeID', select: 'originCode heatCode' },
                    { path: 'gradeID', select: 'gradeName' },
                    { path: 'sizeID', select: 'sizeDescription sizeName' }
                ]
            });

        // เรียงข้อมูลตาม sizeID และ sizeName ก่อน จากนั้น batchYear, number และ sorter
        entries.sort((a, b) => {
            if (String(a.productID.sizeID._id) !== String(b.productID.sizeID._id)) {
                return String(a.productID.sizeID._id).localeCompare(String(b.productID.sizeID._id)); // เรียงตาม sizeID
            }
            if (a.productID.sizeID.sizeName !== b.productID.sizeID.sizeName) {
                return a.productID.sizeID.sizeName.localeCompare(b.productID.sizeID.sizeName); // เรียงตาม sizeName
            }
            if (a.batchID.batchYear !== b.batchID.batchYear) {
                return b.batchID.batchYear - a.batchID.batchYear; // มากไปน้อย
            }
            if (a.number !== b.number) {
                return a.number - b.number; // น้อยไปมาก
            }
            return a.sorter - b.sorter; // น้อยไปมาก
        });

        const totalValues = await getTotalValues(sale); // ส่ง sale ที่ได้ไปฟังก์ชั่นหาผลรวมที่ต้องการ

        res.render('printingSize', { sale, totalValues, entries });
    } catch (error) {
        console.error('Failed to retrieve sale entries:', error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = router;
