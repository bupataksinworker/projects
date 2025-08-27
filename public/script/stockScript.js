document.addEventListener('DOMContentLoaded', function () {
    const yearSelector = document.getElementById('yearSelector');
    const currentYear = moment().year();
    const startYear = currentYear - 2;

    // สร้างตัวเลือกปีใน dropdown
    for (let year = startYear; year <= currentYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.text = 'ข้อมูลปี ' + year; // ใช้ <b> เพื่อทำให้ตัวอักษรหนา
        yearSelector.appendChild(option);
    }

    yearSelector.value = currentYear;

    // ผูกฟังก์ชัน findStock กับปุ่มค้นหา
    document.getElementById('findStockButton').addEventListener('click', findStock);

    // โหลดข้อมูลเริ่มต้น
    // findStock(); // โหลดข้อมูลทันทีเมื่อเปิดหน้า
});

function addRowClickListeners() {
    // เพิ่ม event listener ให้กับแถวในตาราง
    document.querySelectorAll('.stock-row').forEach(row => {
        row.addEventListener('click', function () {
            const batchID = this.dataset.batchid;
            const year = document.getElementById('yearSelector').value;

            // สร้าง query string สำหรับเปิด URL
            const queryString = new URLSearchParams({ year, batchID }).toString();
            window.open(`/manageStockDetails?${queryString}`, '_blank');
        });
    });
}

// ฟังก์ชันค้นหาข้อมูล stock
function findStock() {
    // ดึงค่าปีที่เลือก
    const selectedYear = document.getElementById('yearSelector').value;

    // ดึงค่า origins ที่ถูกเลือก
    const origins = document.querySelectorAll('input[name="origin"]:checked');
    const selectedOrigins = Array.from(origins).map(origin => origin.value);

    // เรียกฟังก์ชันอัปเดตตาราง stock โดยส่งปีและ origins แยกกัน
    fetchAndDisplayStockData(selectedYear, selectedOrigins);
}


async function fetchAndDisplayStockData(year, origins = [], batchID) {
  try {
    const params = new URLSearchParams();
    if (year) params.set('year', year);
    if (origins?.length) params.set('origins', origins.join(','));

    // sets (ชุด)
    const sets = document.querySelectorAll('input[name="set"]:checked');
    const setNumber = sets.length ? Array.from(sets).map(s => Number(s.value)) : [];
    if (setNumber.length) params.set('setNumber', setNumber.join(','));

    if (batchID) params.set('batchID', batchID);

    const res = await fetch(`/api/manageStock?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { saleEntries = [], stockEntries = [], batchList = [] } = await res.json();

    const yy = year ? (Number(year) - 1957) : null; // ค.ศ. -> ปี พ.ศ.ท้ายสองหลักที่ใช้ใน batch.batchYear
    const setSet = new Set(setNumber);
    const normId = v => String((v && typeof v === 'object') ? (v._id ?? v) : v);

    // ฟังก์ชันเช็คว่า batch เข้าเงื่อนไข year/setNumber ไหม (อาศัยข้อมูลจาก batch ที่มากับเอกสาร)
    const matchFilters = (batchLike) => {
      const b = batchLike?.batchID ?? batchLike; // รองรับทั้งรูป {batchID:{...}} หรือ batch เอง
      const by = Number(b?.batchYear);
      const num = Number(b?.number);
      if (yy !== null && by && by !== yy) return false;
      if (setSet.size && num && !setSet.has(num)) return false;
      return true;
    };

    // ---- รวม STOCK (เฉพาะที่ match เงื่อนไข) ----
    const stockAggByBatch = new Map();
    for (const s of stockEntries) {
      if (!matchFilters(s)) continue; // กรองด้วย year & set
      const id = normId(s.batchID);
      const cur = stockAggByBatch.get(id) || {
        batchID: id,
        batchName: s.batchID?.batchName ?? '(ไม่ทราบชื่อชุด)',
        costOfBatch: Number(s.batchID?.costOfBatch ?? 0),
        totalStock: 0,
        totalStockPrice: 0
      };
      const addStock = Number(s.addStock ?? 0);
      const cost = Number(s.cost ?? 0);
      cur.totalStock += addStock;
      cur.totalStockPrice += addStock * cost;
      stockAggByBatch.set(id, cur);
    }

    // ---- รวม SALE (เฉพาะที่ match เงื่อนไข) ----
    const saleByBatch = new Map(
      saleEntries.filter(e => matchFilters(e.batchID)).map(e => [normId(e.batchID), e])
    );

    // รวม id ที่จะเรนเดอร์ (และถ้ามี batchID ให้ตัดเหลือชุดเดียว)
    let allIds = new Set([...stockAggByBatch.keys(), ...saleByBatch.keys()]);
    if (batchID) {
      // เรนเดอร์เฉพาะเมื่อ batchID นี้ “เข้าเงื่อนไข” year & setNumber
      const okStock = stockEntries.some(s => normId(s.batchID) === String(batchID) && matchFilters(s));
      const okSale  = saleEntries.some(e => normId(e.batchID) === String(batchID) && matchFilters(e.batchID));
      if (okStock || okSale) {
        allIds = new Set([String(batchID)]);
      } else {
        allIds = new Set(); // ไม่เข้าเงื่อนไขก็ไม่แสดง
      }
    }

    const tbody = document.querySelector('#stockTableBody');
    tbody.innerHTML = '';
    const fmt = n => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    for (const id of allIds) {
      const stock = stockAggByBatch.get(id) || { totalStock: 0, totalStockPrice: 0, batchName: '(ไม่ทราบชื่อชุด)', costOfBatch: 0 };
      const sale = saleByBatch.get(id) || {
        batchID: id,
        batchName: stock.batchName,
        costOfBatch: stock.costOfBatch,
        total: 0, totalPrice: 0,
        waitingForSale: 0, waitingForSalePrice: 0,
        sold: 0, soldPrice: 0,
        sumNetSale: 0
      };

      const readyForSale      = (stock.totalStock + sale.total) - (sale.waitingForSale + sale.sold);
      const readyForSalePrice = (stock.totalStockPrice + sale.totalPrice) - (sale.waitingForSalePrice + sale.soldPrice);
      const sumNetScale       = Number(sale.costOfBatch ?? 0) > 0 ? ((stock.totalStockPrice + sale.totalPrice) - Number(sale.costOfBatch ?? 0)) : 0;
      const sumNetAll         = sumNetScale + Number(sale.sumNetSale ?? 0);

      tbody.insertAdjacentHTML('beforeend', `
        <tr class="stock-row" data-batchid="${id}">
          <td class="setText">${sale.batchName}</td>
          <td class="setNumber">${fmt(readyForSale)}<br>(${fmt(readyForSalePrice)})</td>
          <td class="setNumber">${fmt(sale.waitingForSale)}<br>(${fmt(sale.waitingForSalePrice)})</td>
          <td class="setNumber">${fmt(sale.sold)}<br>(${fmt(sale.soldPrice)})</td>
          <td class="setNumber">${fmt(stock.totalStock + sale.total)}<br>(${fmt(stock.totalStockPrice + sale.totalPrice)})</td>
          <td class="setNumber">${fmt(sale.costOfBatch)}</td>
          <td class="setNumber">${fmt(sumNetScale)}</td>
          <td class="setNumber">${fmt(sale.sumNetSale)}</td>
          <td class="setNumber">${fmt(sumNetAll)}</td>
        </tr>
      `);
    }

    // แสดง batch ว่าง (ต้อง match year/setNumber ด้วย) และเฉพาะตอนที่ไม่กรอง batchID
    if (!batchID && Array.isArray(batchList)) {
      const used = new Set([...allIds]);
      for (const b of batchList) {
        if (!matchFilters(b)) continue;
        const id = normId(b._id);
        if (used.has(id)) continue;
        tbody.insertAdjacentHTML('beforeend', `
          <tr class="stock-row unused-batch" data-batchid="${id}">
            <td class="setText">${b.batchName}</td>
            <td class="setNumber" colspan="8" style="text-align:center;color:#888;">ยังไม่มีข้อมูลขายหรือสต๊อก</td>
          </tr>
        `);
      }
    }

    addRowClickListeners();
  } catch (err) {
    console.error('Error fetching stock data:', err);
  }
}





