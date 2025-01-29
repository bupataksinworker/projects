const mongoose = require('mongoose');

const customerSchema = mongoose.Schema({
    customerName: {
        type: String,
        required: true,
        trim: true,
    },
    subCustomerIDs: [{ // ✅ เก็บ ObjectId ของ SubCustomer ที่ถูกต้อง
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubCustomer', // ✅ เปลี่ยนเป็น 'SubCustomer'
    }],
    email: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        default: null,
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        default: null,
    },
    address: {
        type: String,
        trim: true,
        default: null,
    },
    sorter: {
        type: Number,
        default: 0,
    },
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
