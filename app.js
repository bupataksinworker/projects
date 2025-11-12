const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const router = express.Router();
const session = require('express-session');
const { exec } = require('child_process');

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
const exportRouter = require('./routes/exportRouter');

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.static('public'));

const { checkLoggedIn } = require('./db/authUtils');
const dbUrl = require('./db/db');

const connectDB = async () => {
  try {
    await mongoose.connect(dbUrl);
    console.log('✅ Connected to MongoDB successfully!');

    // เรียก backup หลังเชื่อมต่อสำเร็จ
    exec('node ./backupSystem/backupScript.js', (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Backup failed: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`⚠️ Backup stderr: ${stderr}`);
        return;
      }
      console.log(`🎉 Backup completed successfully:\n${stdout}`);
    });

  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }

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

connectDB();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy((username, password, done) => {
  User.findOne({ username: username }, (err, user) => {
    if (err) return done(err);
    if (!user) return done(null, false, { message: 'Incorrect username.' });
    if (!bcrypt.compareSync(password, user.password)) return done(null, false, { message: 'Incorrect password.' });
    return done(null, user);
  });
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => done(err, user));
});

app.use('/', router);
router.get('/', (req, res) => {
  res.render('login', { data: 'This is data from server', session: req.session });
});

app.use(userRouter);
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
app.use('/export', exportRouter);

app.listen(3000, () => {
  console.log('🚀 Server running on port 3000');
});
