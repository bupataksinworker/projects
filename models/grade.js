//ใช้งาน mongoose
const mongoose = require('mongoose')

//ออกแบบ schema
const gradeSchema = mongoose.Schema({
    gradeName: {
        type: String,
        required: true
    },
    sorter: {
        type: Number,
        default: 0 // ค่าเริ่มต้นของ sorter เป็น 0
    }
});

// เพิ่ม pre-save hook เพื่อกำหนดค่า sorter
gradeSchema.pre('save', async function(next) {
    if (!this.sorter) {
        const count = await Grade.countDocuments();
        // กำหนดค่า sorter ให้เป็นค่าต่อไปจากค่าสูงสุดที่มี
        this.sorter = count + 1;
    }
    next();
});

//สร้าง models ใส่ collection,structure
let Grade = mongoose.model('Grade', gradeSchema, 'grades');

//ส่งออก models
module.exports = Grade
