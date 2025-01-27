const express = require('express');
const router = express.Router();
const Sale = require('../models/sale');
const SaleEntry = require('../models/saleEntry');
const { checkLoggedIn } = require('../db/authUtils');
const moment = require('moment');

// ตรวจสอบการเข้าสู่ระบบก่อนเข้าถึง router
router.use((req, res, next) => {
    if (!checkLoggedIn(req)) {
        return res.redirect('/login');
    }
    next();
});

// นำเข้าฟังก์ชั่นจากไฟล์ utilityRouter.js
const { getTotalValues } = require('./utilityRouter');

// ฟังก์ชัน fetchSales ดึงข้อมูลยอดขาย
const fetchSales = async (dateStart, dateEnd) => {
    const filter = {};
    if (dateStart && dateEnd) {
        filter['saleDate'] = { $gte: new Date(dateStart), $lte: new Date(dateEnd) };
    }

    try {
        const sales = await Sale.find(filter)
            .populate('customerID')
            .sort({ saleDate: -1 });

        const salesWithTotalAmounts = await Promise.all(sales.map(async sale => {
            const [totalAmount, totalSaleAfterDC, totalValues] = await Promise.all([
                sale.getTotalSaleSum(),
                sale.totalSaleAfterDC(),
                getTotalValues(sale)
            ]);

            return { ...sale.toObject(), totalAmount, totalSaleAfterDC, totalValues };
        }));

        return salesWithTotalAmounts;
    } catch (error) {
        console.error('Error fetching sales:', error);
        throw new Error('Internal Server Error');
    }
};

// ฟังก์ชัน fetchSaleEntries ดึงข้อมูลการขายแต่ละชุด
const fetchSaleEntries = async (dateStart, dateEnd) => {
    const filter = {};
    if (dateStart && dateEnd) {
        filter['entryDate'] = { $gte: new Date(dateStart), $lte: new Date(dateEnd) };
    }

    try {
        const saleEntries = await SaleEntry.find(filter)
            .populate('saleID')
            .sort({ entryDate: -1 });

        return saleEntries;
    } catch (error) {
        console.error('Error fetching sale entries:', error);
        throw new Error('Internal Server Error');
    }
};

// หน้าจัดการ
router.get('/home', async (req, res) => {
    try {
        const dateStart = moment().subtract(1, 'years').startOf('month').toDate();
        const dateEnd = moment().endOf('month').toDate();
        const [salesData, saleEntriesData] = await Promise.all([
            fetchSales(dateStart, dateEnd),
            fetchSaleEntries(dateStart, dateEnd)
        ]);

        res.render('home', {
            data: JSON.stringify({
                sales: salesData,
                saleEntries: saleEntriesData
            })
        });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
