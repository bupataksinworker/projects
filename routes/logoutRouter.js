const express = require('express');
const router = express.Router();

// เส้นทางสำหรับ logout ทั้งหมด
router.post('/', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Error destroying session');
    }
    console.log('Success destroying session')
    // res.redirect('/'); // ส่งผู้ใช้กลับไปยังหน้าหลักหลังจาก logout
    res.render('logout');
    
  });
});

module.exports = router;
