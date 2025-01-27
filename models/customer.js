const mongoose = require('mongoose');

const customerSchema = mongoose.Schema({
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    subCustomerName: [{
        type: String,
        trim: true,
        default: '',
    }],
    email: {
        type: String,
        unique: true,
        sparse: true, // อนุญาตให้ null หรือค่าว่างซ้ำกันได้
        trim: true,
        default: null,
        match: /^[a-zA-Z0-9.+_-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },    
    phone: {
        type: String,
        unique: true,
        sparse: true, // อนุญาตให้ค่าว่างหรือ null ไม่ถือว่าซ้ำ
        trim: true,
        default: null
    },
    address: {
        type: String,
        trim: true,
        default: null // กำหนดให้ null แทนค่าว่าง
    },
    sorter: {
        type: Number,
        default: 0
    }
});

customerSchema.pre('save', async function (next) {
    if (!this.sorter) {
        const count = await mongoose.model('Customer').countDocuments();
        this.sorter = count + 1;
    }
    next();
});

customerSchema.set('toJSON', { getters: true });
customerSchema.set('toObject', { getters: true });

let Customer = mongoose.model('Customer', customerSchema, 'customers');

module.exports = Customer;
