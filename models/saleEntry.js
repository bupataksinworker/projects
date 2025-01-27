const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
const Product = require('./product'); // นำเข้าโมดูลของ Product model
const Type = require('./type'); // นำเข้าโมดูลของ Type model
const Grain = require('./grain'); // นำเข้าโมดูลของ Grain model
const Origin = require('./origin'); // นำเข้าโมดูลของ Origin model
const Heat = require('./heat'); // นำเข้าโมดูลของ Heat model
const Size = require('./size'); // นำเข้าโมดูลของ Size model
const Grade = require('./grade'); // นำเข้าโมดูลของ Grade model

const saleEntrySchema = new mongoose.Schema({
    saleID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sale',
        required: true,
        autopopulate: true
    },
    batchID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Batch',
        required: true,
        autopopulate: true
    },
    productID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
        autopopulate: true
    },
    cost: {
        type: Number,
        required: true,
        default: 0
    },
    openWeight: {
        type: Number,
        required: true,
        default: 0
    },
    openPrice: {
        type: Number,
        required: true,
        default: 0
    },
    closeWeight: {
        type: Number,
        default: 0
    },
    closePrice: {
        type: Number,
        default: 0
    },
    entryStatus: {
        type: String,
        default: 'N',
        enum: ['Y', 'N', 'C']  // ระบุเป็นสถานะ Y สิ้นสุด หรือ N ยังไม่สิ้นสุด รอดำเนินการ หรือ C คืนสินค้า
    },
    sorter: {
        type: Number,
        default: 0 // ค่าเริ่มต้นของ sorter เป็น 0
    },
    sharp: [{
        type: String,
        default: ''
    }],
    note: {
        type: String,
        default: ''
    },
    displayName: {
        type: String,
    },
    entryDate: { // timestamp
        type: Date,
        default: Date.now
    }
});

saleEntrySchema.plugin(autopopulate); // ใช้งาน plugin กับ schema

// เพิ่ม pre-save hook
saleEntrySchema.pre('save', async function (next) {
    if (!this.sorter) {
        const count = await this.constructor.countDocuments();
        this.sorter = count + 1;
    }

    // ตรวจสอบว่า entryStatus เป็น 'C' หรือไม่
    if (this.entryStatus === 'C') {
        next();
        return;
    }

    // ตรวจสอบค่า closeWeight และ closePrice
    // if (this.closeWeight === null || this.closeWeight === 0 || this.closePrice === null || this.closePrice === 0) {
    //     this.entryStatus = 'N';
    // } else {
    //     this.entryStatus = 'Y';
    // }

    // กำหนดค่า displayName ให้เป็น productName ของ Product
    if (!this.displayName) {
        try {
            const product = await mongoose.model('Product').findById(this.productID);
            if (product) {
                this.displayName = product.sizeID.sizeName;
            } else {
                this.displayName = 'Unknown Product';
            }
        } catch (error) {
            return next(error);
        }
    }

    next();
});

// เพิ่ม Virtual Field สำหรับคำนวณ totalSale
saleEntrySchema.virtual('totalSale').get(function () {
    return this.closeWeight * this.closePrice;
});
saleEntrySchema.virtual('totalPreSale').get(function () {
    return this.openWeight * this.openPrice;
});

// ตั้งค่า schema ให้รวม virtual fields ที่ใช้ toJSON และ toObject
saleEntrySchema.set('toJSON', { virtuals: true });
saleEntrySchema.set('toObject', { virtuals: true });

const SaleEntry = mongoose.model('SaleEntry', saleEntrySchema, 'saleentrys');

module.exports = SaleEntry;
