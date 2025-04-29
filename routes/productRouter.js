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
const Product = require('../models/product');
const Cost = require('../models/cost');
const Type = require('../models/type');
const Grain = require('../models/grain');
const Origin = require('../models/origin');
const Heat = require('../models/heat');
const Size = require('../models/size');
const Grade = require('../models/grade');
const productForm = require('../public/script/productScript');
const { populate } = require('../models/user');

// หน้าจัดการ
router.get('/manageProduct', async (req, res) => {
    try {
        // ตรวจสอบว่ามีผู้ใช้ล็อกอินหรือไม่
        if (!checkLoggedIn(req)) {
            // ถ้าไม่มีผู้ใช้ล็อกอิน ให้ redirect ไปยังหน้า login
            return res.redirect('/login');
        }
        // ดึงข้อมูลทั้งหมดจาก MongoDB
        // ส่งไปเพื่อใช้แสดงผลตาราง
        const products = await Product.find().populate('sizeID').populate('gradeID').populate({
            path: 'typeID',
            populate: [
                {path: 'grainID'},
                {path: 'originID'},
                {path: 'heatID'}
            ]
        });

        // ส่งไปเพื่อใช้ในฟอร์ม addProduct
        const types = await Type.find().populate('grainID').populate('originID').populate('heatID');
        const sizes = await Size.find().populate('grainID').sort({ sorter: 1 });
        const grades = await Grade.find().sort({ sorter: 1 });

        // ส่งข้อมูลไปยังหน้า manageProduct.ejs
        res.render('manageProduct', { products, types, sizes, grades });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// ค้นหาข้อมูลเมื่อเลือก Type
router.get('/selectedType', async (req, res) => {
    try {
        // ตรวจสอบว่ามีผู้ใช้ล็อกอินหรือไม่
        if (!checkLoggedIn(req)) {
            // ถ้าไม่มีผู้ใช้ล็อกอิน ให้ redirect ไปยังหน้า login
            return res.redirect('/login');
        }

        // ดึงค่า typeID ที่ส่งมาจากหน้า manageProduct.ejs
        const selectedTypeID = req.query.typeID;
        // console.log("productRouter selectedTypeID : " + req.query.typeID)

        // -------------- ดึงค่าอื่นๆจาก typeID ที่รับมา --------------------------- ****
        const { grainID, originID, heatID } = await Type.findOne({ _id: req.query.typeID });


        // หาขนาดที่มี typeID ตรงกับที่เลือก (หรือข้ามหากไม่มีหรือมีค่าเป็นค่าว่างหรือ undefined)
        let products;
        if (selectedTypeID) {
            products = await Product.find({ typeID: selectedTypeID });
        } else {
            products = '';
        }

        let sizes;
        if (grainID) {
            sizes = await Size.find({ grainID: grainID }).sort({ sorter: 1 });
        } else {
            sizes = await Size.find().populate('grainID').sort({ sorter: 1 });
        }

        const types = await Type.find();
        const grades = await Grade.find().sort({ sorter: 1 });

        // ส่งข้อมูลขนาดเฉพาะเป็น JSON กลับไปที่หน้า manageProduct.ejs
        res.json({ products, types, sizes, grades });

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// ค้นหาข้อมูลเมื่อเลือก ตัวอื่นนอกจาก Type
// router.get('/selectedProduct', async (req, res) => {
//     try {
//         // ตรวจสอบว่ามีผู้ใช้ล็อกอินหรือไม่
//         if (!checkLoggedIn(req)) {
//             // ถ้าไม่มีผู้ใช้ล็อกอิน ให้ redirect ไปยังหน้า login
//             return res.redirect('/login');
//         }

//         // ดึงค่า sizeID gradeID typeID ที่ส่งมาจากหน้า manageSize.ejs
//         const selectedTypeID = req.query.typeID;
//         // console.log("selectedTypeID : " + req.query.typeID)
//         const selectedSizeID = req.query.sizeID;
//         // console.log("selectedSizeID : " + req.query.sizeID)
//         const selectedGradeID = req.query.gradeID;
//         // console.log("selectedGradeID : " + req.query.gradeID)

//         // หาขนาดที่มี typeID ตรงกับที่เลือก (หรือข้ามหากไม่มีหรือมีค่าเป็นค่าว่างหรือ undefined)
//         let products;
//         if (selectedTypeID && selectedSizeID && selectedGradeID) {
//             console.log("Condition Code 4");
//             products = await Product.find({ typeID: selectedTypeID, sizeID: selectedSizeID, gradeID: selectedGradeID }).populate('sizeID').populate('typeID').populate('gradeID');
//         } else if (selectedTypeID && selectedSizeID && selectedGradeID) {
//             console.log("Condition Code 3-1");
//             products = await Product.find({ typeID: selectedTypeID, sizeID: selectedSizeID, gradeID: selectedGradeID }).populate('sizeID').populate('typeID').populate('gradeID');
//         } else if (selectedTypeID && selectedSizeID) {
//             console.log("Condition Code 3-2");
//             products = await Product.find({ typeID: selectedTypeID, sizeID: selectedSizeID }).populate('sizeID').populate('typeID').populate('gradeID');
//         } else if (selectedTypeID && selectedSizeID) {
//             console.log("Condition Code 2");
//             products = await Product.find({ typeID: selectedTypeID, sizeID: selectedSizeID }).populate('sizeID').populate('typeID').populate('gradeID');
//         } else if (selectedTypeID) {
//             console.log("Condition Code 1");
//             products = await Product.find({ typeID: selectedTypeID }).populate('sizeID').populate('typeID').populate('gradeID');
//         }

//         let sizes;
//         if (selectedTypeID) {
//             sizes = await Size.find({ typeID: selectedTypeID }).populate('typeID');
//         } else {
//             sizes = await Size.find().populate('typeID');
//         }

//         const types = await Type.find();
//         const grades = await Grade.find().sort({ sorter: 1 });
//         let costProduct = products;
//         // ส่งข้อมูลขนาดเฉพาะเป็น JSON กลับไปที่หน้า manageProduct.ejs
//         res.json({ products, types, sizes, grades, costProduct });

//     } catch (error) {
//         console.error('Error fetching data:', error);
//         res.status(500).send('Internal Server Error');
//     }
// });

router.get('/selectedProduct', async (req, res) => {
    try {
        if (!checkLoggedIn(req)) {
            return res.redirect('/login');
        }

        const selectedTypeID = req.query.typeID;
        const selectedSizeID = req.query.sizeID;

        let products;
        if (selectedTypeID && selectedSizeID) {
            products = await Product.find({ typeID: selectedTypeID, sizeID: selectedSizeID })
                .populate('sizeID')
                .populate('typeID')
                .populate('gradeID'); // ✅ เพิ่ม `gradeID` มาให้ product
        } else if (selectedTypeID) {
            products = await Product.find({ typeID: selectedTypeID })
                .populate('sizeID')
                .populate('typeID')
                .populate('gradeID');
        } else {
            products = await Product.find()
                .populate('sizeID')
                .populate('typeID')
                .populate('gradeID');
        }

        let sizes = selectedTypeID ? await Size.find({ typeID: selectedTypeID }).populate('typeID').sort({ sorter: 1 }) : await Size.find().populate('typeID').sort({ sorter: 1 });
        const types = await Type.find();
        const grades = await Grade.find().sort({ sorter: 1 });

        res.json({ products, types, sizes, grades });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});


// เส้นทางการเพิ่ม product
router.post('/addProduct', async (req, res) => {
    if (!checkLoggedIn(req)) {
        return res.redirect('/login');
    }
    try {
        const { ber, sizeID, typeID, gradeID } = req.body;

        // ค้นหาข้อมูลของ size จาก sizeID ที่รับมาจาก form
        const size = await Size.findById(sizeID);
        //ตรวจสอบว่าพบข้อมูล size หรือไม่
        let displayName;
        if (size) {
            // หากพบข้อมูล size กำหนด displayName เป็น sizeName
            displayName = size.sizeName;
            console.log('Size Name:', displayName);
        } else {
            // หากไม่พบข้อมูล size กำหนด displayName เป็น 'N/A' หรือค่าที่ต้องการ
            displayName = 'N/A';
            console.log('Size Name not found. Set default value:', displayName);
        }

        // ค้นหาข้อมูลที่มีเงื่อนไขตามที่กำหนดไว้
        const existingProduct = await Product.findOne({ sizeID, typeID, gradeID });

        // ตรวจสอบว่ามีข้อมูลที่ซ้ำกันหรือไม่
        if (existingProduct) {
            res.status(500).json({ error: 'ข้อมูลซ้ำในระบบ' });
        } else {
            const newProduct = new Product({
                ber,
                sizeID,
                typeID,
                gradeID,
                displayName
            });

            await newProduct.save();
            res.json({ message: 'Product added successfully', product: newProduct });
        }


    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

// หน้า manageProduct สำหรับข้อมูล real-time
router.get('/api/updateTableProduct/:typeID/:sizeID/:gradeID', async (req, res) => {
    if (!checkLoggedIn(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {

        // ดึงค่า sizeID gradeID typeID ที่ส่งมาจากหน้า manageSize.ejs
        const selectedTypeID = req.params.typeID;
        console.log("selectedTypeID : " + req.params.typeID)
        const selectedSizeID = req.params.sizeID;
        console.log("selectedSizeID : " + req.params.sizeID)
        const selectedGradeID = req.params.gradeID;
        console.log("selectedGradeID : " + req.params.gradeID)

        // หาขนาดที่มี typeID ตรงกับที่เลือก (หรือข้ามหากไม่มีหรือมีค่าเป็นค่าว่างหรือ undefined)
        let products;
        if (selectedTypeID && selectedSizeID && selectedGradeID) {
            console.log("Condition Code 4");
            products = await Product.find({ typeID: selectedTypeID, sizeID: selectedSizeID, gradeID: selectedGradeID }).populate('sizeID').populate('typeID').populate('gradeID');
        } else if (selectedTypeID && selectedSizeID && selectedGradeID) {
            console.log("Condition Code 3-1");
            products = await Product.find({ typeID: selectedTypeID, sizeID: selectedSizeID, gradeID: selectedGradeID }).populate('sizeID').populate('typeID').populate('gradeID');
        } else if (selectedTypeID && selectedSizeID) {
            console.log("Condition Code 3-2");
            products = await Product.find({ typeID: selectedTypeID, sizeID: selectedSizeID }).populate('sizeID').populate('typeID').populate('gradeID');
        } else if (selectedTypeID && selectedSizeID) {
            console.log("Condition Code 2");
            products = await Product.find({ typeID: selectedTypeID, sizeID: selectedSizeID }).populate('sizeID').populate('typeID').populate('gradeID');
        } else if (selectedTypeID) {
            console.log("Condition Code 1");
            products = await Product.find({ typeID: selectedTypeID }).populate('sizeID').populate('typeID').populate('gradeID');
        }

        res.json(products);  // ส่งกลับข้อมูลในรูปแบบ JSON
    } catch (error) {
        console.error('Failed to retrieve products:', error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// เส้นทางสำหรับการแก้ไขสินค้า ก่อนนำไป update
router.post('/editProduct', async (req, res) => {
    const edit_id = req.body.edit_id;
    console.log(edit_id);
    // ค้นหาข้อมูลสินค้าจากฐานข้อมูล
    Product.findOne({ _id: edit_id }).exec()
        .then(async doc => {
            if (doc) {
                // ถ้าพบข้อมูลสินค้า นำข้อมูลไปแสดงในแบบฟอร์มเพื่อแก้ไข
                const sizes = await Size.find().populate('grainID').sort({ sorter: 1 });
                const types = await Type.find();
                const grades = await Grade.find().sort({ sorter: 1 });
                res.render('editProduct', { product: doc, sizes, types, grades });
            } else {
                // ถ้าไม่พบข้อมูลสินค้า
                res.status(404).send('This Product Not Found');
            }
        })
});

// เส้นทางสำหรับการ update ข้อมูลของสินค้า ที่ส่งมาจาก ฟอร์ม edit
router.post('/updateProduct', async (req, res) => {
    const { edit_id, ber, sizeID, typeID, gradeID, displayName } = req.body;

    // ค้นหาข้อมูลสินค้าที่มี id ตรงกับ edit_id
    const product = await Product.findById(edit_id);

    if (!product) {
        // กรณีไม่พบข้อมูลสินค้า
        return res.status(404).send('ไม่พบข้อมูลสินค้า');
    }

    // ค้นหาข้อมูลที่มีเงื่อนไขตามที่กำหนดไว้
    const existingProduct = await Product.findOne({ ber, sizeID, typeID, gradeID, displayName,_id: { $ne: edit_id } });

    // ตรวจสอบว่ามีข้อมูลที่ซ้ำกันหรือไม่
    if (existingProduct) {
        const errorResponse = {
            message: 'ข้อมูลซ้ำในระบบ',
            status: 400
          };
          res.status(400).json(errorResponse);
    } else {

        // อัปเดตข้อมูลสินค้า
        product.ber = ber;
        product.sizeID = sizeID;
        product.typeID = typeID;
        product.gradeID = gradeID;
        product.displayName = displayName;

        // บันทึกการอัปเดต
        await product.save();

        // แจ้งเตือนการอัปเดตสำเร็จ และกลับไปยังหน้าจัดการสินค้า
        console.log('ข้อมูลสินค้าถูกอัปเดต:', product);
        res.json(product)
    }
});

// เส้นทางสำหรับลบข้อมูลสินค้า
router.post('/deleteProduct', async (req, res) => {
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


module.exports = router;
