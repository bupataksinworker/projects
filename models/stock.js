const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
const Product = require('./product'); // นำเข้าโมดูลของ Product model
const Type = require('./type'); // นำเข้าโมดูลของ Type model
const Grain = require('./grain'); // นำเข้าโมดูลของ Grain model
const Origin = require('./origin'); // นำเข้าโมดูลของ Origin model
const Heat = require('./heat'); // นำเข้าโมดูลของ Heat model
const Size = require('./size'); // นำเข้าโมดูลของ Size model
const Grade = require('./grade'); // นำเข้าโมดูลของ Grade model
const SaleEntry = require('./saleEntry'); // นำเข้าโมดูล SaleEntry

const stockSchema = new mongoose.Schema({
    batchID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
        required: true,
        autopopulate: true
    },
    typeID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Type',
        required: true,
        autopopulate: true
    },
    sizeID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Size',
        required: true,
        autopopulate: true
    },
    gradeID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grade',
        required: true,
        autopopulate: true
    },
    cost: {
        type: Number,
        required: true,
        default: 0
    },
    addStock: {
        type: Number,
        required: true,
        default: 0
    },
    comment: {
        type: String, // เพิ่มฟิลด์ comment
        default: ''
    },
    stockDate: { // ใช้ Native JavaScript เพื่อจัดการเขตเวลาเป็น UTC+7
        type: Date,
        default: () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }))
    },
    sorter: {
        type: Number,
        default: 0 // ค่าเริ่มต้นของ sorter เป็น 0
    }
});

stockSchema.plugin(autopopulate); // ใช้งาน plugin กับ schema

// เพิ่ม pre-save hook
stockSchema.pre('save', async function (next) {
    if (!this.sorter) {
        const count = await this.constructor.countDocuments();
        this.sorter = count + 1;
    }
});

// ตั้งค่า schema ให้รวม virtual fields ที่ใช้ toJSON และ toObject
stockSchema.set('toJSON', { virtuals: true });
stockSchema.set('toObject', { virtuals: true });

const Stock = mongoose.model('Stock', stockSchema, 'stocks');

module.exports = Stock;
