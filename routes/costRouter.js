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
const Cost = require('../models/cost');
const Product = require('../models/product');
const Type = require('../models/type');
const Size = require('../models/size');
const Grade = require('../models/grade');
const { populate } = require('../models/user');

// หน้าจัดการ
router.get('/manageCost', async (req, res) => {
    try {
        // ตรวจสอบว่ามีผู้ใช้ล็อกอินหรือไม่
        if (!checkLoggedIn(req)) {
            // ถ้าไม่มีผู้ใช้ล็อกอิน ให้ redirect ไปยังหน้า login
            return res.redirect('/login');
        }

        // เส้นทางการดึงข้อมูลจาก MongoDB เพื่อส่งไปใช้งานใน page
        // ส่งไปแสดงผลตาราง **********************************************
        const costs = await Cost.find().populate({
            path: 'productID',
            populate: [
                { path: 'typeID', 
                populate: [
                    { path: 'grainID'},
                    { path: 'originID'},
                    { path: 'heatID'}
                ] }, // เลือกเฉพาะฟิลด์ที่จำเป็น
                { path: 'gradeID' } // เลือกเฉพาะฟิลด์ที่จำเป็น
            ]
        });


        // ส่งไปใช้ในฟอร์ม addCost
        const products = await Product.find().populate({
            path: 'typeID',
            populate: [
                { path: 'grainID'},
                { path: 'originID'},
                { path: 'heatID'}
            ]
        }).populate('sizeID').populate('gradeID');
        const types = await Type.find().populate('grainID').populate('originID').populate('heatID');
        const sizes = await Size.find();
        const grades = await Grade.find();

        // สร้างตัวแปรเก็บข้อมูลสินค้า
        const productGroups = {}; // สร้างออบเจ็กต์เพื่อจัดกลุ่มข้อมูลสินค้า

        let costId = ''; // เพิ่มตัวแปรเก็บ _id ของ cost ตัวสุดท้าย

        costs.forEach(cost => {
            const productName = cost.productID.productName; // ดึงชื่อสินค้า

            // อัพเดทค่า _id ของ cost ตัวสุดท้าย
            costId = cost._id;

            // ถ้ายังไม่มีกลุ่มสินค้านี้ในออบเจ็กต์ productGroups
            if (!productGroups[productName]) {
                // สร้างกลุ่มสินค้าใหม่
                productGroups[productName] = {
                    productId: cost.productID, // productID
                    totalCost: 0, // กำหนดค่าเริ่มต้นของราคารวมในกลุ่มสินค้านี้เป็น 0
                    latestCost: cost.costOfProduct, // เก็บค่า costOfProduct ล่าสุด
                    costId: costId // เก็บค่า _id ของ cost
                };
            } else {
                // อัพเดทค่า costOfProduct ล่าสุด
                productGroups[productName].latestCost = cost.costOfProduct;
                // อัพเดทค่า _id ของ cost
                productGroups[productName].costId = costId;
            }

            // เพิ่มค่าราคารวมของสินค้าในกลุ่ม
            productGroups[productName].totalCost += cost.costOfProduct;
        });

        // ส่งข้อมูลไปยังหน้า manageCost.ejs
        res.render('manageCost', { productGroups, products, costs, types, sizes, grades });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// เส้นทางสร้าง productGroup
router.get('/productGroup', async (req, res) => {
    try {
        // ตรวจสอบว่ามีผู้ใช้ล็อกอินหรือไม่
        if (!checkLoggedIn(req)) {
            // ถ้าไม่มีผู้ใช้ล็อกอิน ให้ redirect ไปยังหน้า login
            return res.redirect('/login');
        }

        // ดึงค่า sizeID gradeID typeID ที่ส่งมาจากหน้า manageSize.ejs
        const selectedTypeID = req.query.typeID;
        console.log("selectedTypeID : " + req.query.typeID)
        const selectedSizeID = req.query.sizeID;
        console.log("selectedSizeID : " + req.query.sizeID)
        const selectedGradeID = req.query.gradeID;
        console.log("selectedGradeID : " + req.query.gradeID)
        const selectedBer = req.query.ber;
        console.log("selectedBer : " + req.query.ber)

        // เส้นทางการดึงข้อมูลจาก MongoDB เพื่อส่งไปใช้งานใน page
        // ส่งไปแสดงผลตาราง **********************************************
        const costs = await Cost.find().populate({
            path: 'productID',
            select: 'ber displayName typeID sizeID gradeID', // เลือกเฉพาะฟิลด์ที่จำเป็น
            populate: [
                { path: 'typeID', select: 'originCode heatCode' }, // เลือกเฉพาะฟิลด์ที่จำเป็น
                { path: 'sizeID', select: 'sizeName' }, // เลือกเฉพาะฟิลด์ที่จำเป็น
                { path: 'gradeID', select: 'gradeName' } // เลือกเฉพาะฟิลด์ที่จำเป็น
            ]
        });


        // ส่งไปใช้ในฟอร์ม addCost
        // หาขนาดที่มี typeID ตรงกับที่เลือก (หรือข้ามหากไม่มีหรือมีค่าเป็นค่าว่างหรือ undefined)
        let products;
        if (selectedTypeID && selectedSizeID && selectedGradeID && selectedBer) {
            console.log("Condition Code 4");
            products = await Product.find({ typeID: selectedTypeID, sizeID: selectedSizeID, gradeID: selectedGradeID, ber: selectedBer }).populate('sizeID').populate('typeID').populate('gradeID');
        } else if (selectedTypeID && selectedSizeID && selectedGradeID) {
            console.log("Condition Code 3-1");
            products = await Product.find({ typeID: selectedTypeID, sizeID: selectedSizeID, gradeID: selectedGradeID }).populate('sizeID').populate('typeID').populate('gradeID');
        } else if (selectedTypeID && selectedSizeID && selectedBer) {
            console.log("Condition Code 3-2");
            products = await Product.find({ typeID: selectedTypeID, sizeID: selectedSizeID, ber: selectedBer }).populate('sizeID').populate('typeID').populate('gradeID');
        } else if (selectedTypeID && selectedSizeID) {
            console.log("Condition Code 2");
            products = await Product.find({ typeID: selectedTypeID, sizeID: selectedSizeID }).populate('sizeID').populate('typeID').populate('gradeID');
        } else if (selectedTypeID) {
            console.log("Condition Code 1");
            products = await Product.find({ typeID: selectedTypeID }).populate('sizeID').populate('typeID').populate('gradeID');
        }

        let sizes;
        if (selectedTypeID) {
            sizes = await Size.find({ typeID: selectedTypeID }).populate('typeID');
        } else {
            sizes = await Size.find().populate('typeID');
        }

        const types = await Type.find();
        const grades = await Grade.find();

        // สร้างตัวแปรเก็บข้อมูลสินค้า
        const productGroups = {}; // สร้างออบเจ็กต์เพื่อจัดกลุ่มข้อมูลสินค้า

        let costId = ''; // เพิ่มตัวแปรเก็บ _id ของ cost ตัวสุดท้าย

        costs.forEach(cost => {
            const productName = cost.productID.productName; // ดึงชื่อสินค้า
            const typeID = cost.productID.typeID;
            const sizeID = cost.productID.sizeID;
            const gradeID = cost.productID.gradeID;
            const ber = cost.productID.ber;

            // อัพเดทค่า _id ของ cost ตัวสุดท้าย
            costId = cost._id;

            // ถ้ายังไม่มีกลุ่มสินค้านี้ในออบเจ็กต์ productGroups
            if (!productGroups[productName]) {
                // สร้างกลุ่มสินค้าใหม่
                productGroups[productName] = {
                    productId: cost.productID, // productID
                    totalCost: 0, // กำหนดค่าเริ่มต้นของราคารวมในกลุ่มสินค้านี้เป็น 0
                    latestCost: cost.costOfProduct, // เก็บค่า costOfProduct ล่าสุด
                    costId: costId, // เก็บค่า _id ของ cost
                    typeID: typeID,
                    sizeID: sizeID,
                    gradeID: gradeID,
                    ber: ber
                };
            } else {
                // อัพเดทค่า costOfProduct ล่าสุด
                productGroups[productName].latestCost = cost.costOfProduct;
                // อัพเดทค่า _id ของ cost
                productGroups[productName].costId = costId;
            }

            // เพิ่มค่าราคารวมของสินค้าในกลุ่ม
            productGroups[productName].totalCost += cost.costOfProduct;
        });

        // ส่งข้อมูลกลับไปยัง fetchProductGroup
        res.json({ productGroups, products, costs, types, sizes, grades });

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// เส้นทางสำหรับการเพิ่มข้อมูล
router.post('/addCost', async (req, res) => {
    try {
        // รับข้อมูลจาก form
        const { costOfProduct, productID } = req.body;

        // ค้นหาข้อมูลที่มีเงื่อนไขตามที่กำหนดไว้
        const existingCost = await Cost.findOne({ costOfProduct, productID });

        // ตรวจสอบว่ามีข้อมูลที่ซ้ำกันหรือไม่
        if (existingCost) {
            // ถ้าพบข้อมูลที่ซ้ำกัน ส่งคำตอบกลับไปยัง client ด้วยสถานะ 400 (Bad Request) และข้อความแจ้งเตือน
            return res.status(400).send('ข้อมูลที่เพิ่มมีการซ้ำกันในระบบ');
        }

        // สร้างเอกสารใหม่จากข้อมูลที่รับมาจาก form
        const newCost = new Cost({
            costOfProduct,
            productID
        });

        // บันทึกเอกสารใหม่ลงในฐานข้อมูล
        await newCost.save();

        const costs = await Cost.find({ productID: productID }).populate({
            path: 'productID',
            select: 'ber displayName typeID sizeID gradeID', // เลือกเฉพาะฟิลด์ที่จำเป็น
            populate: [
                { path: 'typeID', select: 'originCode heatCode' }, // เลือกเฉพาะฟิลด์ที่จำเป็น
                { path: 'sizeID', select: 'sizeName' }, // เลือกเฉพาะฟิลด์ที่จำเป็น
                { path: 'gradeID', select: 'gradeName' } // เลือกเฉพาะฟิลด์ที่จำเป็น
            ]
        });

        const typeID = costs[0].productID.typeID._id;
        const sizeID = costs[0].productID.sizeID._id;
        const gradeID = costs[0].productID.gradeID._id;

        console.log('บันทึกข้อมูลเรียบร้อยแล้ว:', newCost);
        console.log('เรียกค่า typeID:', typeID);
        console.log('เรียกค่า sizeID:', sizeID);
        console.log('เรียกค่า gradeID:', gradeID);

        res.json({ success: true, message: 'เพิ่มข้อมูลต้นทุนสำเร็จ', newCost, typeID, sizeID, gradeID });

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });

    }
});

// เส้นทางสำหรับการ edit ก่อนนำไป update
router.post('/editCost', async (req, res) => {
    const edit_id1 = req.body.edit_id1; // รับค่า productID มาจากฟอร์ม
    const edit_id2 = req.body.edit_id2; // รับค่า productName มาจากฟอร์ม
    const edit_id3 = req.body.edit_id3; // รับค่า cost._id มาจากฟอร์ม

    try {
        // ค้นหาข้อมูล cost จากฐานข้อมูล
        const costs = await Cost.find({ productID: edit_id1 }).populate('productID');

        // ส่งข้อมูล cost ไปยังหน้า editCost.ejs
        res.render('editCost', { edit_id1, edit_id2, edit_id3, costs });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/getCost', async (req, res) => {
    const productID = req.body.productID; // รับค่า productID มาจากฟอร์ม
    try {
        // ค้นหาข้อมูล cost จากฐานข้อมูล
        const costs = await Cost.find({ productID: productID }).populate('productID');

        // ส่งข้อมูลกลับเป็น json
        res.json({ costs });

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});



// เส้นทางสำหรับการ update ข้อมูลที่ส่งมาจากฟอร์ม edit
router.post('/updateCost', async (req, res) => {
    const { productID, costID, costIdOld } = req.body;

    try {
        // ค้นหาข้อมูลที่มี id ตรงกับ id ที่รับมา
        const costNew = await Cost.findById(costID);
        const costOld = await Cost.findById(costIdOld);

        if (!costNew) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูล costNew' });
        }

        if (!costOld) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูล costOld' });
        }

        // อัปเดตข้อมูล
        const costOfProductNew = costNew.costOfProduct; // ค่า cost ใหม่ก่อน update
        const costOfProductOld = costOld.costOfProduct; // ค่า cost เก่าก่อน update
        costNew.costOfProduct = costOfProductOld;
        costOld.costOfProduct = costOfProductNew;

        // บันทึกการอัปเดต
        const updatedCostNew = await costNew.save();
        const updatedCostOld = await costOld.save();

        if (!updatedCostNew || !updatedCostOld) {
            return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
        }

        // ค้นหาข้อมูลที่เกี่ยวข้องเพิ่มเติมและ populate ฟิลด์ที่จำเป็น
        const costs = await Cost.find({ productID: productID }).populate({
            path: 'productID',
            select: 'typeID sizeID gradeID', // เลือกเฉพาะฟิลด์ที่จำเป็น
            populate: [
                { path: 'typeID', select: 'originCode heatCode' },
                { path: 'sizeID', select: 'sizeName' },
                { path: 'gradeID', select: 'gradeName' }
            ]
        });

        const typeID = costs[0].productID.typeID._id;
        const sizeID = costs[0].productID.sizeID._id;
        const gradeID = costs[0].productID.gradeID._id;

        console.log('ข้อมูลถูกอัปเดต:', costOld.costOfProduct, "เปลี่ยนเป็น", costNew.costOfProduct);
        res.json({ success: true, message: 'อัพเดทสำเร็จ', typeID, sizeID, gradeID });

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
});

// เส้นทางสำหรับลบข้อมูล
router.post('/deleteCostAll', async (req, res) => {
    const { delete_id } = req.body; // รับ _id ของข้อมูลที่ต้องการลบจาก body

    try {
        // ค้นหาและลบข้อมูลจากฐานข้อมูล
        const result = await Cost.deleteMany({ productID: delete_id });

        if (result) {
            return res.json({ success: true, message: 'ลบข้อมูลสำเร็จ' });
        } else {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลที่ต้องการลบ' });
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบข้อมูลสินค้า:', error);
        res.status(500).send('เกิดข้อผิดพลาดในการลบข้อมูลสินค้า');
    }
});

// เส้นทางสำหรับลบข้อมูล
// router.post('/deleteCostOne', async (req, res) => {
//     try {
//         const { delete_id } = req.body; // รับ _id ของข้อมูลที่ต้องการลบจาก body
//         console.log(delete_id);
//         // ค้นหาและลบข้อมูลจากฐานข้อมูล
//         await Cost.findByIdAndDelete(delete_id);

//         console.log('ลบข้อมูลเรียบร้อยแล้ว');
//         res.redirect('/manageCost'); // หลังจากลบเสร็จสิ้น ให้ redirect กลับ
//     } catch (error) {
//         console.error('เกิดข้อผิดพลาดในการลบข้อมูล:', error);
//         res.status(500).send('เกิดข้อผิดพลาดในการลบข้อมูล');
//     }
// });

router.post('/deleteID', async (req, res) => {
    try {
        if (!req.body.delete_id) {
            return res.status(400).json({ error: 'ไม่มี delete_id ที่ส่งมา' });
        }
        const { delete_id } = req.body;
        console.log('deleteID: ' + delete_id);
        await Cost.findByIdAndDelete(delete_id);
        console.log('ลบข้อมูลเรียบร้อยแล้ว');
        res.sendStatus(200);
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบข้อมูล:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
    }
});


module.exports = router;
