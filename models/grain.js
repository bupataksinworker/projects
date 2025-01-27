//ใช้งาน mongoose
const mongoose = require('mongoose')

//ออกแบบ schema
let grainSchema = mongoose.Schema({
    grainName: {
        type: String,
        required: true
    },
    sorter: {
        type: Number,
        default: 0 // ค่าเริ่มต้นของ sorter เป็น 0
    }
})

// เพิ่ม pre-save hook เพื่อกำหนดค่า sorter
grainSchema.pre('save', async function(next) {
    if (!this.sorter) {
        const count = await Grain.countDocuments();
        // กำหนดค่า sorter ให้เป็นค่าต่อไปจากค่าสูงสุดที่มี
        this.sorter = count + 1;
    }
    next();
});

// ทำให้ Virtual field แสดงผลเมื่อถูกแปลงเป็น Object หรือ JSON
grainSchema.set('toJSON', { getters: true });
grainSchema.set('toObject', { getters: true });

//สร้าง models ใส่ collection,structure
let Grain = mongoose.model('Grain', grainSchema, 'grains');

//ส่งออก models
module.exports = Grain
