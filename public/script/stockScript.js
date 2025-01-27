document.addEventListener('DOMContentLoaded', function () {
    const yearSelector = document.getElementById('yearSelector');
    const currentYear = moment().year();
    const startYear = currentYear - 2;

    // สร้างตัวเลือกปีใน dropdown
    for (let year = startYear; year <= currentYear; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.text = 'ข้อมูลปี ' + year;
        yearSelector.appendChild(option);
    }

    yearSelector.value = currentYear;

    // ผูกฟังก์ชัน findStock กับปุ่มค้นหา
    document.getElementById('findStockButton').addEventListener('click', findStock);

    // โหลดข้อมูลเริ่มต้น
    findStock(); // โหลดข้อมูลทันทีเมื่อเปิดหน้า
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


// ฟังก์ชันดึงข้อมูลและแสดงผลในตาราง
async function fetchAndDisplayStockData(year, origins, batchID) {
    try {
        // สร้าง query string สำหรับพารามิเตอร์ year, origins, และ batchID
        const params = new URLSearchParams({ year });
        if (origins && origins.length > 0) params.append('origins', origins.join(','));
        if (batchID) params.append('batchID', batchID);

        // Fetch ข้อมูลจาก API
        const response = await fetch(`/api/manageStock?${params.toString()}`);
        const { saleEntries, stockEntries } = await response.json();

        // ล้างข้อมูลเก่าจากตาราง
        const tableBody = document.querySelector('#stockTableBody');
        tableBody.innerHTML = '';

        // แสดงข้อมูลในตาราง
        saleEntries.forEach(saleEntry => {
            const { batchID, batchName, costOfBatch, total, totalPrice, waitingForSale, waitingForSalePrice, sold, soldPrice, sumNetSale } = saleEntry;
            console.log(saleEntry)
            // ค้นหาข้อมูล stock ที่ตรงกับ batchID
            const stocks = stockEntries.filter(stockEntry => stockEntry.batchID._id === batchID);
            console.log(stockEntries)

            // ดึงค่า addStock และคำนวณ totalStock และ totalStockPrice แบบรวมค่า
            const totalStock = stocks.reduce((sum, stock) => sum + (stock.addStock || 0), 0);
            const totalStockPrice = stocks.reduce((sum, stock) => sum + (stock.addStock * stock.cost || 0), 0);

            // คำนวณค่า readyForSale และ readyForSalePrice
            const readyForSale = totalStock + total - (waitingForSale + sold);
            const readyForSalePrice = totalStockPrice + totalPrice - (waitingForSalePrice + soldPrice);

            // คิดกำไรชั่ง
            const sumNetScale = ( ( totalStockPrice + totalPrice ) - costOfBatch );

            // รวมกำไรชั่ง กำไรขาย
            const sumNetAll = sumNetScale + sumNetSale;
            // สร้างแถวในตาราง
            const row = `
                <tr class="stock-row" data-batchid="${batchID}">
                    <td class="setText">${batchName}</td>
                    <td class="setNumber">${readyForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${readyForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                    <td class="setNumber">${waitingForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${waitingForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                    <td class="setNumber">${sold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                    <td class="setNumber">${(totalStock + total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${(totalStockPrice + totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                    <td class="setNumber">${(costOfBatch).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="setNumber">${sumNetScale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="setNumber">${sumNetSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="setNumber">${sumNetAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

        // เพิ่ม event listener ให้กับแถวในตารางใหม่ที่ถูกสร้าง
        addRowClickListeners();

    } catch (error) {
        console.error('Error fetching stock data:', error);
    }
}



