/// วิธีการลบ index ของ collection customers ใน MongoDB โดยใช้ Mongoose
/// เพื่อแก้ไขปัญหาการใช้งาน index ที่ไม่ถูกต้อง ทำให้คีย์ customerName เพิ่มไม่ได้
/// วิธีคือ node dropIndexes.js จากนั้นรัน node app.js เปิดระบบอีกครั้ง
const mongoose = require('mongoose');
const dbUrl = require('./db/db');
const Customer = require('./models/customer');

(async () => {
    try {
        // Connect to the database
        await mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to the database');

        // Drop existing indexes on the customers collection
        await Customer.collection.dropIndexes();
        console.log('Indexes dropped successfully');

        // Close the connection
        await mongoose.disconnect();
        console.log('Disconnected from the database');
    } catch (error) {
        console.error('Error dropping indexes:', error);
    }
})();
