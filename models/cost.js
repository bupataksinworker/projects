// เส้นทางสำหรับการใช้งาน mongoose
const mongoose = require('mongoose');
const { getCurrentDate } = require('./utilityModels'); // นำเข้า getCurrentDate จาก utilityModels
const Product = require('./product'); // นำเข้าโมดูลของ Product model
const Type = require('./type'); // นำเข้าโมดูลของ Type model
const Size = require('./size'); // นำเข้าโมดูลของ Size model
const Grade = require('./grade'); // นำเข้าโมดูลของ Grade model

// ออกแบบ schema
let costSchema = mongoose.Schema({
    costOfProduct: {
        type: Number,
        required: true,
        min: 0,
        max: 999999.99,
        precision: 2,
    },
    productID: {
        type: mongoose.Schema.Types.ObjectId, // เปลี่ยน type เป็น mongoose.Schema.Types.ObjectId
        ref: 'Product', // ระบุชื่อของโมเดลที่เกี่ยวข้อง
        required: true
    },
    sorter: {
        type: Number,
        default: 0 // ค่าเริ่มต้นของ sorter เป็น 0
    },
    costDate: {
        type: String,
        default: getCurrentDate // ค่าเริ่มต้นเป็นวันที่ของวันที่เพิ่มข้อมูล (รูปแบบ dd-MM-yyyy)
    }
});

// ทำให้ Virtual field แสดงผลเมื่อถูกแปลงเป็น Object หรือ JSON
costSchema.set('toJSON', { getters: true });
costSchema.set('toObject', { getters: true });

// เพิ่ม pre-save hook เพื่อกำหนดค่า sorter
costSchema.pre('save', async function (next) {
    if (!this.sorter) {
        const count = await Cost.countDocuments();
        // กำหนดค่า sorter ให้เป็นค่าต่อไปจากค่าสูงสุดที่มี
        this.sorter = count + 1;
    }
    next();
});

// สร้างโมเดล Cost
const Cost = mongoose.model('Cost', costSchema, 'costs');

// export โมเดล Cost เพื่อให้สามารถเรียกใช้งานในภายหลังได้
module.exports = Cost;
