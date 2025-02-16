// productCostRouter.js

const express = require('express');
const router = express.Router();
const { checkLoggedIn } = require('../db/authUtils');

// Models
const Product = require('../models/product');
const Cost = require('../models/cost');
const Type = require('../models/type');
const Size = require('../models/size');
const Grade = require('../models/grade');

// Middleware to check login status
router.use((req, res, next) => {
    if (!checkLoggedIn(req)) {
        return res.redirect('/login');
    }
    next();
});

// หน้าจัดการ
router.get('/manageProductCost', async (req, res) => {
    try {
        const { typeID, sizeID, gradeID, productID } = req.query;

        const products = await Product.find()
            .populate('sizeID')
            .populate('gradeID')
            .populate({
                path: 'typeID',
                populate: [
                    { path: 'grainID' },
                    { path: 'originID' },
                    { path: 'heatID' }
                ]
            });

        const types = await Type.find();
        const sizes = await Size.find();
        const grades = await Grade.find();

        // ✅ ตรวจสอบ product ที่ต้องแก้ไข (ใช้ใน Modal)
        let selectedProduct = null;
        let costs = [];
        if (productID) {
            selectedProduct = await Product.findById(productID)
                .populate('typeID')
                .populate('sizeID')
                .populate('gradeID');

            costs = await Cost.find({ productID: selectedProduct._id }).sort({ sorter: -1 });
        }

        res.render('manageProductCost', {
            products,
            types,
            sizes,
            grades,
            selectedProduct, // ✅ ใช้สำหรับแสดงข้อมูลใน Modal
            costs, // ✅ ส่งข้อมูลต้นทุน
            selectedTypeID: typeID || '',
            selectedSizeID: sizeID || '',
            selectedGradeID: gradeID || ''
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});



// Route to handle dynamic dropdown data for grades
router.get('/api/getGradesBySize', async (req, res) => {
    try {
        const { sizeID } = req.query;
        const grades = await Grade.find(); // ไม่ใช้ sizeID เนื่องจากไม่มีใน model
        res.json(grades);
    } catch (error) {
        console.error('Error fetching grades:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเกรด' });
    }
});

router.post('/addProductCost', async (req, res) => {
    try {
        const { typeID, sizeID, gradeID, costOfProduct } = req.body;

        // ตรวจสอบว่า typeID ต้องมีค่าเสมอ
        if (!typeID || !costOfProduct) {
            return res.status(400).json({ message: 'ข้อมูลประเภทสินค้าและต้นทุนเป็นข้อมูลจำเป็น' });
        }

        // ดึงข้อมูล size เพื่อกำหนด displayName
        const size = await Size.findById(sizeID);
        let displayName = size ? size.sizeName : 'N/A';

        // ค้นหาสินค้าและต้นทุนปัจจุบัน
        let product = await Product.findOne({ typeID, sizeID, gradeID });
        if (product) {
            const existingCost = await Cost.findOne({ productID: product._id, costOfProduct });
            if (existingCost) {
                return res.status(200).json({ message: 'ข้อมูลต้นทุนนี้มีอยู่แล้วในระบบ', product });
            }
        } else {
            // สร้างสินค้าใหม่หากไม่มี
            product = new Product({
                typeID,
                sizeID: sizeID || undefined,
                gradeID: gradeID || undefined,
                displayName,
                ber: ''
            });
            await product.save();
        }

        // บันทึกข้อมูลต้นทุนใน collection Cost
        const newCost = new Cost({
            productID: product._id,
            costOfProduct
        });
        await newCost.save();

        res.json({ success: true, message: 'เพิ่มข้อมูลต้นทุนสำเร็จ', newCost, product });
    } catch (error) {
        console.error('Error adding product cost:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
});

router.get('/api/updateTableProductCost', async (req, res) => {
    try {
        const { typeID, sizeID, gradeID } = req.query;

        // Suggestion: Use ObjectId validation to prevent invalid query values and casting errors.
        const query = { typeID };
        if (sizeID && sizeID !== 'null') query.sizeID = sizeID;
        if (gradeID && gradeID !== 'null') query.gradeID = gradeID;

        const products = await Product.find(query)
            .populate('sizeID', 'sizeName')
            .populate('typeID', 'typeName')
            .populate('gradeID', 'gradeName');

        const productData = await Promise.all(products.map(async product => {
            // Suggestion: Cache this query or use lean() for better performance with large data sets.
            const latestCost = await Cost.findOne({ productID: product._id }).sort({ sorter: -1 });
            return {
                id: product._id,
                productName: product.productName,
                ber: product.ber,
                displayName: product.displayName,
                sizeName: product.sizeID.sizeName,
                typeName: product.typeID.typeName,
                gradeName: product.gradeID.gradeName,
                latestCost: latestCost ? latestCost.costOfProduct : null
            };
        }));

        res.json(productData);
    } catch (error) {
        console.error('Error updating table data:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลตาราง' });
    }
});

// เส้นทางสำหรับลบข้อมูลสินค้า
router.post('/deleteProductCost', async (req, res) => {
    try {
        const { delete_id } = req.body;

        const result = await Product.findByIdAndDelete(delete_id);

        if (result) {
            await Cost.deleteMany({ productID: delete_id }); // ลบ cost ของ productID นี้ทั้งหมด
            return res.json({ success: true, message: 'ลบข้อมูลสำเร็จ' });
        } else {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลที่ต้องการลบ' });
        }

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบข้อมูลสินค้า:', error);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูลสินค้า' });
    }
});

router.get('/api/getProductCostById', async (req, res) => {
    try {
        const { productID } = req.query;

        if (!productID) {
            return res.status(400).json({ success: false, message: 'ไม่มี productID ที่ส่งมา' });
        }

        const product = await Product.findById(productID)
            .populate('typeID')
            .populate('sizeID')
            .populate('gradeID');

        if (!product) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลสินค้า' });
        }

        // ✅ ดึงข้อมูลต้นทุนทั้งหมดที่เกี่ยวข้องกับสินค้า
        const costs = await Cost.find({ productID }).sort({ sorter: -1 });

        res.json({ success: true, product, costs });
    } catch (error) {
        console.error('Error fetching product cost data:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' });
    }
});

router.post('/addCost', async (req, res) => {
    try {
        const { costOfProduct, productID } = req.body;

        if (!costOfProduct || !productID) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
        }

        // ✅ ตรวจสอบว่ามีสินค้านี้อยู่ในระบบหรือไม่
        const product = await Product.findById(productID);
        if (!product) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลสินค้า' });
        }

        // ✅ ตรวจสอบว่าข้อมูลต้นทุนซ้ำกันหรือไม่
        const existingCost = await Cost.findOne({ costOfProduct, productID });
        if (existingCost) {
            return res.status(400).json({ success: false, message: 'ข้อมูลที่เพิ่มมีการซ้ำกันในระบบ' });
        }

        // ✅ บันทึกต้นทุนใหม่
        const newCost = new Cost({ costOfProduct, productID });
        await newCost.save();

        // ✅ ดึงข้อมูล typeID, sizeID, gradeID ของสินค้านี้
        const typeID = product.typeID?._id || null;
        const sizeID = product.sizeID?._id || null;
        const gradeID = product.gradeID?._id || null;

        console.log('บันทึกข้อมูลเรียบร้อยแล้ว:', newCost);
        res.json({ success: true, message: 'เพิ่มข้อมูลต้นทุนสำเร็จ', newCost, typeID, sizeID, gradeID });

    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }
});

// ✅ Route สำหรับอัปเดตสินค้า
router.post('/api/updateProduct', async (req, res) => {
    try {
        const { productID, ber, sizeID, typeID, gradeID, displayName } = req.body;

        // ✅ ตรวจสอบว่ามี Product นี้หรือไม่
        const product = await Product.findById(productID);
        if (!product) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลสินค้า' });
        }

        // ✅ อัปเดตข้อมูล
        product.ber = ber || product.ber;
        product.sizeID = sizeID || product.sizeID;
        product.typeID = typeID || product.typeID;
        product.gradeID = gradeID || product.gradeID;
        product.displayName = displayName || product.displayName;

        await product.save();

        res.json({ success: true, message: 'อัปเดตข้อมูลสินค้าสำเร็จ', product });

    } catch (error) {
        console.error('❌ Error updating product:', error);
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลสินค้า' });
    }
});

module.exports = router;


// Export the router
module.exports = router;
