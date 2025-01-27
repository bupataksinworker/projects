//ใช้งาน mongoose
const mongoose = require('mongoose')
const autopopulate = require('mongoose-autopopulate');

//ออกแบบ schema
const sizeSchema = mongoose.Schema({
    grainID: {
        type: mongoose.Schema.Types.ObjectId, // เปลี่ยน type เป็น mongoose.Schema.Types.ObjectId
        ref: 'Grain', // ระบุชื่อของโมเดลที่เกี่ยวข้อง
        required: true,
        autopopulate: true,
    },
    sizeName: {
        type: String,
        required: true
    },
    sorter: {
        type: Number,
        default: 0 // ค่าเริ่มต้นของ sorter เป็น 0
    }
});

sizeSchema.plugin(autopopulate);

// เพิ่ม pre-save hook เพื่อกำหนดค่า sorter
sizeSchema.pre('save', async function(next) {
    if (!this.sorter) {
        const count = await Size.countDocuments();
        // กำหนดค่า sorter ให้เป็นค่าต่อไปจากค่าสูงสุดที่มี
        this.sorter = count + 1;
    }
    next();
});

//สร้าง models ใส่ collection,structure
let Size = mongoose.model('Size', sizeSchema, 'sizes');

//ส่งออก models
module.exports = Size
