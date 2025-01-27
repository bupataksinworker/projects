const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); //การเข้ารหัส

//เรียกใช้งาน model
const User = require('../models/user');
const Customer = require('../models/customer'); // เพิ่มการเรียกใช้งาน Customer model

// หน้า Login
router.get('/login', (req, res) => {
    res.render('login');
});

// จัดการการ Login
router.post('/login', authenticateUser);

// ฟังก์ชั่นสำหรับตรวจสอบการ login
async function authenticateUser(req, res) {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(400).send('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }
  
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).send('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }

  // Set session or token for authentication
  req.session.username = username;
  console.log('Login Success by : ' + username);
  console.log(req.session);
  
  return res.redirect('/manageSale');
  // return res.redirect('/home');
}

// หน้า Register
router.get('/register', (req, res) => {
    res.render('register');
});

// จัดการการ Register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
  
    // ตรวจสอบว่ามี username นี้แล้วหรือยัง
    const existingUser = await User.findOne({ username });
  
    if (existingUser) {
      res.status(400).send('ชื่อผู้ใช้นี้ถูกใช้งานแล้ว');
    } else {
      // เข้ารหัส password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const user = new User({ username, password: hashedPassword });
  
      try {
        await user.save();
        res.redirect('/login');
        console.log('register successful');
      } catch (error) {
        console.error(error);
        res.status(500).send('เกิดข้อผิดพลาดในการสมัครสมาชิก');
      }
    }
  });

// Route สำหรับ manageSale
router.get('/manageSale', async (req, res) => {
  // ตรวจสอบว่ามีผู้ใช้ล็อกอินหรือไม่
  if (!checkLoggedIn(req)) {
    // ถ้าไม่มีผู้ใช้ล็อกอิน ให้ redirect ไปยังหน้า login
    return res.redirect('/login');
  }

  try {
    const customers = await Customer.find();
    res.render('manageSale', { customers });
  } catch (error) {
    console.error('Failed to retrieve customers:', error);
    res.status(500).send("Internal Server Error");
  }
});

function checkLoggedIn(req) {
  return req.session && req.session.username;
}

module.exports = router;
