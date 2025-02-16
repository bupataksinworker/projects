// เส้นทางสำหรับการใช้งาน mongoose
const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');

const batchSchema = new mongoose.Schema({
    batchYear: {
        type: Number,
        required: true,
        enum: [68, 69, 70] // ใช้เป็นปี พ.ศ. สามารถเพิ่มหรือลบปีได้ตามต้องการ
    },
    number: {
        type: Number,
        required: true,
        min: 1,
        max: 7
    },
    batchName: {
        type: String,
        required: true,
        trim: true
    },
    typeID: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Type', // อ้างอิงไปยัง model 'Type'
      required: true,
      autopopulate: true
    }],
    costOfBatch: {
        type: Number,
        default: 0, // ค่าเริ่มต้นของ sorter เป็น 0
        required: true
    },
    sorter: {
        type: Number,
        default: 0 // ค่าเริ่มต้นของ sorter เป็น 0
    },
    costOfBatchBefore: { //ทุนชุดก่อนหน้า
        type: Number,
        default: 0 
    },
    costOfBatchNew: { // ทุนของใหม่
        type: Number,
        default: 0 
    },
    costOfBatchLabor: { // รวมทุนแรงงาน
        type: Number,
        default: 0 
    },
});
batchSchema.plugin(autopopulate); // ใช้งาน plugin กับ schema


// ทำให้ Virtual field แสดงผลเมื่อถูกแปลงเป็น Object หรือ JSON
batchSchema.set('toJSON', { getters: true });
batchSchema.set('toObject', { getters: true });

// เพิ่ม pre-save hook เพื่อกำหนดค่า sorter
batchSchema.pre('save', async function (next) {
    if (!this.sorter) {
        const count = await Batch.countDocuments();
        // กำหนดค่า sorter ให้เป็นค่าต่อไปจากค่าสูงสุดที่มี
        this.sorter = count + 1;
    }
    
    // คำนวณ costOfBatch จาก cost1, cost2, cost3
    this.costOfBatch = this.costOfBatchBefore + this.costOfBatchNew + this.costOfBatchLabor;

    next();
});


// สร้าง model จาก schema
const Batch = mongoose.model('Batch', batchSchema, 'batchs');

// export โมเดล Batch เพื่อให้สามารถเรียกใช้งานในภายหลังได้
module.exports = Batch;