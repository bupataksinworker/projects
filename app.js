const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { fullBackup } = require('./backup'); // นำเข้า fullBackup
const router = express.Router();
const session = require('express-session');

const userRouter = require('./routes/userRouter');
const logoutRouter = require('./routes/logoutRouter');
const productRouter = require('./routes/productRouter');
const typeRouter = require('./routes/typeRouter');
const sizeRouter = require('./routes/sizeRouter');
const gradeRouter = require('./routes/gradeRouter');
const costRouter = require('./routes/costRouter');
const batchRouter = require('./routes/batchRouter');
const customerRouter = require('./routes/customerRouter');
const saleRouter = require('./routes/saleRouter');
const saleEntryRouter = require('./routes/saleEntryRouter');
const sharpRouter = require('./routes/sharpRouter');
const reportSaleEntryRouter = require('./routes/reportSaleEntryRouter');
const homeRouter = require('./routes/homeRouter');
const stockRouter = require('./routes/stockRouter');
const reportTransactionRouter = require('./routes/reportTransactionRouter');
const gradeDetailsRouter = require('./routes/gradeDetailsRouter');
const productCostRouter = require('./routes/productCostRouter');


const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.static('public'));

const { checkLoggedIn } = require('./db/authUtils');
const dbUrl = require('./db/db');
// console.log(dbUrl);

const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl); // ตัวเลือกไม่จำเป็นใน MongoDB Driver เวอร์ชันใหม่

    console.log('✅ Connected to MongoDB successfully!');

    // เรียกใช้ Backup หลังจาก MongoDB เชื่อมต่อเสร็จ
    // fullBackup();
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1); // ปิดแอปพลิเคชันหากเชื่อมต่อไม่ได้
  }

  // ตรวจสอบสถานะการเชื่อมต่อ
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connection is active');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB connection lost');
  });
};

// เรียกใช้งานฟังก์ชันเชื่อมต่อ
connectDB();

const db = mongoose.connection;

db.on('connected', () => console.log('MongoDB connection established'));
db.on('error', err => console.error('MongoDB connection error:', err.message));
db.on('disconnected', () => console.warn('MongoDB connection lost'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// app.use(express.urlencoded({ extended: false }));
app.use(express.urlencoded({ extended: true })); // สำหรับ parsing application/x-www-form-urlencoded
app.use(express.json()); // สำหรับ parsing application/json

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
  function (username, password, done) {
    User.findOne({ username: username }, function (err, user) {
      if (err) { return done(err); }
      if (!user) {
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!bcrypt.compareSync(password, user.password)) {
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

// index form login
app.use('/', router);
router.get('/', (req, res) => {
  // console.log(req.session)
  res.render('login', { data: 'This is data from server', session: req.session });
});

// เส้นทางการ login ของ user
app.use(userRouter);

// เส้นทางสำหรับการ logout
app.use('/logout', logoutRouter);

app.use(productRouter);
app.use(typeRouter);
app.use(sizeRouter);
app.use(gradeRouter);
app.use(costRouter);
app.use(batchRouter);
app.use(customerRouter);
app.use(saleRouter);
app.use(saleEntryRouter);
app.use(sharpRouter);
app.use(reportSaleEntryRouter);
app.use(homeRouter);
app.use(stockRouter);
app.use(reportTransactionRouter);
app.use(gradeDetailsRouter);
app.use(productCostRouter);

app.listen(3000, () => {
  console.log('Start server port 3000');
});
