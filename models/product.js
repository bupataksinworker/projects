// เส้นทางสำหรับการใช้งาน mongoose
const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');

const Type = require('./type'); // นำเข้าโมดูลของ Type model
const Grain = require('./grain'); // นำเข้าโมดูลของ Grain model
const Origin = require('./origin'); // นำเข้าโมดูลของ Origin model
const Heat = require('./heat'); // นำเข้าโมดูลของ Heat model
const Size = require('./size'); // นำเข้าโมดูลของ Size model
const Grade = require('./grade'); // นำเข้าโมดูลของ Grade model

// ออกแบบ schema
let productSchema = mongoose.Schema({
    typeID: {
        type: mongoose.Schema.Types.ObjectId, // เปลี่ยน type เป็น mongoose.Schema.Types.ObjectId
        ref: 'Type', // ระบุชื่อของโมเดลที่เกี่ยวข้อง
        required: true,
        autopopulate: true
    },
    sizeID: {
        type: mongoose.Schema.Types.ObjectId, // เปลี่ยน type เป็น mongoose.Schema.Types.ObjectId
        ref: 'Size', // ระบุชื่อของโมเดลที่เกี่ยวข้อง
        required: true,
        autopopulate: true
    },
    gradeID: {
        type: mongoose.Schema.Types.ObjectId, // เปลี่ยน type เป็น mongoose.Schema.Types.ObjectId
        ref: 'Grade', // ระบุชื่อของโมเดลที่เกี่ยวข้อง
        required: true,
        autopopulate: true
    },
    ber: {
        type: String,
        default: ''
    },
    sorter: {
        type: Number,
        default: 0 // ค่าเริ่มต้นของ sorter เป็น 0
    }
    ,
    displayName: {
        type: String
    }
});

productSchema.plugin(autopopulate); // ใช้งาน plugin กับ schema

// สร้าง virtual field productName
productSchema.virtual('productName').get(function () {
    let productName = `${this.displayName} ${this.typeID.originID.originCode} ${this.typeID.heatID.heatCode} ${this.gradeID.gradeName}`;
    // console.log('สำหรับเรา : ' + productName);
    return productName;
});


// สร้าง virtual field publicProductName
productSchema.virtual('publicProductName').get(function () {
   let publicProductName = `${this.displayName} ${this.typeID.originID.originCode} ${this.typeID.heatID.heatCode}`;
    // console.log('สำหรับลูกค้า : ' + publicProductName);
    return publicProductName;
});

// ทำให้ Virtual field แสดงผลเมื่อถูกแปลงเป็น Object หรือ JSON
productSchema.set('toJSON', { getters: true });
productSchema.set('toObject', { getters: true });

// เพิ่ม pre-save hook เพื่อกำหนดค่า sorter
productSchema.pre('save', async function (next) {
    if (!this.sorter) {
        const count = await Product.countDocuments();
        // กำหนดค่า sorter ให้เป็นค่าต่อไปจากค่าสูงสุดที่มี
        this.sorter = count + 1;
    }
    next();
});

// สร้างโมเดล Product
const Product = mongoose.model('Product', productSchema, 'products');

// export โมเดล Product เพื่อให้สามารถเรียกใช้งานในภายหลังได้
module.exports = Product;