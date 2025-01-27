//ใช้งาน mongoose
const mongoose = require('mongoose')

//ออกแบบ schema
let originSchema = mongoose.Schema({
    originName: {
        type: String,
        required: true
    },
    originCode: {
        type: String,
        required: true
    },
    sorter: {
        type: Number,
        default: 0 // ค่าเริ่มต้นของ sorter เป็น 0
    }
})

// เพิ่ม pre-save hook เพื่อกำหนดค่า sorter
originSchema.pre('save', async function(next) {
    if (!this.sorter) {
        const count = await Origin.countDocuments();
        // กำหนดค่า sorter ให้เป็นค่าต่อไปจากค่าสูงสุดที่มี
        this.sorter = count + 1;
    }
    next();
});

// ทำให้ Virtual field แสดงผลเมื่อถูกแปลงเป็น Object หรือ JSON
originSchema.set('toJSON', { getters: true });
originSchema.set('toObject', { getters: true });

//สร้าง models ใส่ collection,structure
let Origin = mongoose.model('Origin', originSchema, 'origins');

//ส่งออก models
module.exports = Origin
