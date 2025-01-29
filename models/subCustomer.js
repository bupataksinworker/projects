const mongoose = require('mongoose');

const subCustomerSchema = new mongoose.Schema({
    subCustomerName: {
        type: String,
        required: true,
        trim: true,
    },
    parentCustomerID: { // ✅ อ้างอิงไปยัง Customer ที่เป็นลูกค้าหลัก
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
});

const SubCustomer = mongoose.model('SubCustomer', subCustomerSchema, 'subcustomers');
module.exports = SubCustomer;
