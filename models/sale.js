const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
const SaleEntry = require('./saleEntry'); // นำเข้าโมดูล SaleEntry

// ออกแบบ schema
const saleSchema = new mongoose.Schema({
  customerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
    autopopulate: true
  },
  subCustomerID: { // ✅ อ้างอิงไปยัง SubCustomer
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCustomer', 
    autopopulate: true
  },
  billStatus: {
    type: String,
    required: true,
    enum: ['เปิด', 'ปิด'],
    default: 'เปิด',
  },
  discount: {
    type: Number,
    min: 0,
    default: 0, // ค่าเริ่มต้นเป็น 0 หรือตามค่าที่เหมาะสม
  },
  saleDate: {
    type: Date, // วันที่เริ่มสถานะเป็น close
    required: function () {
      return this.billStatus === 'ปิด'; // ระบุเฉพาะเมื่อสถานะเป็น close
    }
  },
  totalAmount: {
    type: Number,
    required: true,
    default: 0,
    min: 0, // ยอดรวมเงินของบิล (ไม่ติดลบ)
    validate: {
      validator: function (value) {
        return Number.isInteger(value) && value >= 0;
      },
      message: props => `${props.value} is not a valid total amount!`
    }
  },
  sorter: {
    type: Number,
    default: 0 // ค่าเริ่มต้นของ sorter เป็น 0
  }
});

saleSchema.plugin(autopopulate); // ใช้งาน plugin กับ schema

// เพิ่ม pre-save hook เพื่อกำหนดค่า sorter
saleSchema.pre('save', async function (next) {
  if (!this.sorter) {
    const count = await this.constructor.countDocuments();
    this.sorter = count + 1;
  }
  next();
});

// เพิ่ม instance method เพื่อคำนวณ totalPreSaleSum (OPEN)
saleSchema.methods.getTotalPreSaleSum = async function () {
  const saleEntries = await SaleEntry.aggregate([
    { $match: { saleID: this._id } },
    {
      $group: {
        _id: null,
        total: { $sum: { $multiply: ['$openWeight', '$openPrice'] } }
      }
    }
  ]);

  return saleEntries.length > 0 ? saleEntries[0].total : 0;
};

// เพิ่ม instance method เพื่อคำนวณ totalSaleSum (CLOSE)
saleSchema.methods.getTotalSaleSum = async function () {
  const saleEntries = await SaleEntry.aggregate([
    { $match: { saleID: this._id } },
    {
      $group: {
        _id: null,
        total: { $sum: { $multiply: ['$closeWeight', '$closePrice'] } }
      }
    }
  ]);

  return saleEntries.length > 0 ? saleEntries[0].total : 0;
};

// เพิ่ม instance method เพื่อคำนวณ totalPreSaleAfterDC
saleSchema.methods.totalPreSaleAfterDC = async function () {
  const totalPreSaleSum = await this.getTotalPreSaleSum();
  const discountFactor = (100 - this.discount) / 100;
  return totalPreSaleSum * discountFactor;
};

// เพิ่ม instance method เพื่อคำนวณ totalSaleAfterDC
saleSchema.methods.totalSaleAfterDC = async function () {
  const totalSaleSum = await this.getTotalSaleSum();
  const discountFactor = (100 - this.discount) / 100;
  return totalSaleSum * discountFactor;
};

// เพิ่ม instance method เพื่อคำนวณ totalPreSaleCost
saleSchema.methods.totalPreSaleCost = async function () {
  const saleEntries = await SaleEntry.aggregate([
    {
      $match: {
        saleID: this._id,
        openWeight: { $gt: 0 },
        openPrice: { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: { $multiply: ['$openWeight', '$cost'] } }
      }
    }
  ]);

  return saleEntries.length > 0 ? saleEntries[0].total : 0;
};

// เพิ่ม instance method เพื่อคำนวณ totalSaleCost
saleSchema.methods.totalSaleCost = async function () {
  const saleEntries = await SaleEntry.aggregate([
    {
      $match: {
        saleID: this._id,
        closeWeight: { $gt: 0 },
        closePrice: { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: { $multiply: ['$closeWeight', '$cost'] } }
      }
    }
  ]);

  return saleEntries.length > 0 ? saleEntries[0].total : 0;
};



// เพิ่ม instance method เพื่อคำนวณ totalPreSaleProfit
saleSchema.methods.totalPreSaleProfit = async function () {
  const totalPreSaleAfterDC = await this.totalPreSaleAfterDC();
  const totalSaleCost = await this.totalSaleCost();
  return totalPreSaleAfterDC - totalSaleCost;
};

// เพิ่ม instance method เพื่อคำนวณ totalSaleProfit
saleSchema.methods.totalSaleProfit = async function () {
  const totalSaleAfterDC = await this.totalSaleAfterDC();
  const totalSaleCost = await this.totalSaleCost();
  return totalSaleAfterDC - totalSaleCost;
};

// ------------------------ Result By Batch --------------------------
saleSchema.methods.getTotalSumByBatch = async function () {
  const discountFactor = (100 - this.discount) / 100;

  const saleEntries = await SaleEntry.aggregate([
    { $match: { saleID: this._id } },
    {
      $lookup: {
        from: 'batchs', // ชื่อ collection ของ batchs
        localField: 'batchID',
        foreignField: '_id',
        as: 'batchInfo'
      }
    },
    { $unwind: '$batchInfo' }, // แยก array batchInfo เพื่อเข้าถึง batchName
    {
      $group: {
        _id: '$batchID',
        batchName: { $first: '$batchInfo.batchName' },
        batchYear: { $first: '$batchInfo.batchYear' }, // เพิ่ม field batchYear
        number: { $first: '$batchInfo.number' }, // เพิ่ม field number
        sorter: { $first: '$batchInfo.sorter' }, // เพิ่ม field sorter
        totalPreSumByBatch: { $sum: { $multiply: ['$openWeight', '$openPrice'] } }, // จากน้ำหนักเปิดและราคาเปิด
        totalSumByBatch: { $sum: { $multiply: ['$closeWeight', '$closePrice'] } }, // จากน้ำหนักปิดและราคาปิด
        totalPreCostByBatch: {
          $sum: {
            $cond: {
              if: { $gt: [{ $multiply: ['$openWeight', '$openPrice'] }, 0] },
              then: { $multiply: ['$openWeight', '$cost'] },
              else: 0
            }
          }
        },
        totalCostByBatch: {
          $sum: {
            $cond: {
              if: { $gt: [{ $multiply: ['$closeWeight', '$closePrice'] }, 0] },
              then: { $multiply: ['$closeWeight', '$cost'] },
              else: 0
            }
          }
        }
      }
    },
    {
      $project: {
        batchID: '$_id',
        batchName: 1,
        batchYear: 1,
        number: 1,
        sorter: 1,
        totalPreSumByBatch: 1,
        totalPreAfterDcByBatch: { $multiply: ['$totalPreSumByBatch', discountFactor] },
        totalPreCostByBatch: 1,
        totalPreProfitByBatch: { $subtract: [{ $multiply: ['$totalPreSumByBatch', discountFactor] }, '$totalPreCostByBatch'] },
        totalSumByBatch: 1,
        totalAfterDcByBatch: { $multiply: ['$totalSumByBatch', discountFactor] },
        totalCostByBatch: 1,
        totalProfitByBatch: { $subtract: [{ $multiply: ['$totalSumByBatch', discountFactor] }, '$totalCostByBatch'] }
      }
    },
    { $sort: { batchYear: -1, number: 1, sorter: 1 } }, // เรียงลำดับโดย batchYear จากมากไปน้อย, number จากน้อยไปมาก, sorter จากน้อยไปมาก
    {
      $group: {
        _id: null,
        totals: {
          $push: {
            batchID: '$batchID',
            batchName: '$batchName',
            batchYear: '$batchYear',
            number: '$number',
            sorter: '$sorter',
            totalPreSumByBatch: '$totalPreSumByBatch',
            totalPreAfterDcByBatch: '$totalPreAfterDcByBatch',
            totalPreCostByBatch: '$totalPreCostByBatch',
            totalPreProfitByBatch: '$totalPreProfitByBatch',
            totalSumByBatch: '$totalSumByBatch',
            totalAfterDcByBatch: '$totalAfterDcByBatch',
            totalCostByBatch: '$totalCostByBatch',
            totalProfitByBatch: '$totalProfitByBatch'
          }
        }
      }
    }
  ]);

  return saleEntries.length > 0 ? saleEntries[0].totals : [];
};




//สร้าง models ใส่ collection
const Sale = mongoose.model('Sale', saleSchema, 'sales'); // ใช้ 'sales' เป็นชื่อคอลเลคชัน

module.exports = Sale;
