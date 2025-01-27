//ใช้งาน mongoose
const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // เพิ่มบรรทัดนี้

//ออกแบบ schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  }
});

// เพิ่ม method validPassword() ใน schema
userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

//สร้าง models ใส่ collection
const User = mongoose.model('Users', userSchema, 'users');

module.exports = User;
