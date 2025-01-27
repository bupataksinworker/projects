//ใช้งาน mongoose
const mongoose = require('mongoose')
const autopopulate = require('mongoose-autopopulate');

const Grain = require('./grain'); // นำเข้าโมดูลของ Grain model
const Origin = require('./origin'); // นำเข้าโมดูลของ Origin model
const Heat = require('./heat'); // นำเข้าโมดูลของ Heat model

//ออกแบบ schema
let typeSchema = mongoose.Schema({
    grainID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Grain', // ระบุชื่อของโมเดลที่เกี่ยวข้อง
        required: true,
        autopopulate: true,
    },
    originID: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Origin', // ระบุชื่อของโมเดลที่เกี่ยวข้อง
        required: true,
        autopopulate: true,
    },
    heatID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Heat', // ระบุชื่อของโมเดลที่เกี่ยวข้อง
        required: true,
        autopopulate: true,
    },
    sorter: {
        type: Number,
        default: 0 // ค่าเริ่มต้นของ sorter เป็น 0
    }
});

typeSchema.plugin(autopopulate);

// เพิ่ม pre-save hook เพื่อกำหนดค่า sorter
typeSchema.pre('save', async function(next) {
    if (!this.sorter) {
        const count = await Type.countDocuments();
        // กำหนดค่า sorter ให้เป็นค่าต่อไปจากค่าสูงสุดที่มี
        this.sorter = count + 1;
    }
    next();
});

// สร้าง Virtual field ชื่อ typeName ซึ่งคำนวณมาจาก grain, origin, และ heat
typeSchema.virtual('typeName').get(function() {
    return `${this.grainID.grainName}${this.originID.originName}${this.heatID.heatName}`;
});

// ทำให้ Virtual field แสดงผลเมื่อถูกแปลงเป็น Object หรือ JSON
typeSchema.set('toJSON', { getters: true });
typeSchema.set('toObject', { getters: true });

//สร้าง models ใส่ collection,structure
let Type = mongoose.model('Type', typeSchema, 'types');

//ส่งออก models
module.exports = Type
