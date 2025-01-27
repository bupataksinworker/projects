document.addEventListener('DOMContentLoaded', function () {
    // ดึงค่าจาก URL query parameters ทันทีเมื่อเปิดหน้า
    const urlParams = new URLSearchParams(window.location.search);

    // ดึงค่าของแต่ละ parameter และเช็คว่ามีค่าครบถ้วนหรือไม่
    const batchID = urlParams.get('batchID');
    const typeID = urlParams.get('typeID');
    const sizeID = urlParams.get('sizeID');
    const gradeID = urlParams.get('gradeID');

    // ตรวจสอบว่าทุกค่ามีหรือไม่ก่อนเรียกใช้งาน
    if (batchID && typeID && sizeID && gradeID) {
        updateTableGradeDetails(batchID, typeID, sizeID, gradeID); // โหลดข้อมูลทันทีเมื่อเปิดหน้า
    } else {
        console.error("Required parameters are missing.");
    }
});

async function updateTableGradeDetails(batchID, typeID, sizeID, gradeID) {
    try {
        // ส่งค่าด้วย Fetch API ไปยัง router ที่กำหนดไว้
        const response = await fetch(`/api/getGradeDetails`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ batchID, typeID, sizeID, gradeID })
        });

        // ตรวจสอบว่าได้ค่ากลับมาหรือไม่
        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        // แปลงผลลัพธ์เป็น JSON
        const data = await response.json();

        console.log(data.readyForSale)
        console.log(data.waitingForSale)
        console.log(data.sold)
        // เรียกฟังก์ชันอัปเดตตารางแต่ละตัวด้วยข้อมูลที่ได้มา
        updateTable1('readyForSaleTable', data.readyForSale);
        updateTable2('waitingForSaleTable', data.waitingForSale);
        updateTable3('soldTable', data.sold);

    } catch (error) {
        console.error('Error fetching grade details:', error);
    }
}

// ฟังก์ชันอัปเดตตารางตามข้อมูลที่ได้มา โดยเลือกเฉพาะฟิลด์ที่ต้องการ
function updateTable1(tableId, tableData) {
    const table = document.getElementById(tableId);
    table.innerHTML = ''; // เคลียร์ข้อมูลเดิม

    // สร้างส่วนหัวของตาราง
    table.innerHTML += `
      <thead class="thead-light">
        <tr>
          <th colspan="6" style="padding: 15px" >
            <h4>ประวัติเพิ่มสต๊อก</h4>
          </th>
        </tr>
        <tr>
          <th>ชื่อสินค้า (เพิ่มสต๊อก)</th>
          <th>ต้นทุน (บาท)</th>
          <th>เพิ่มสต๊อก (ก.)</th>
          <th>รวม (บาท)</th>
          <th>วันที่</th>
        </tr>
      </thead>
      <tbody>
    `;

    // วนลูปข้อมูล batch เพื่อสร้างแถวข้อมูล
    tableData.forEach(data => {
        const openRow = `
          <tr>
            <td style="background-color: #f0f0f0;">${data.sizeID.sizeName} ${data.typeID.originID.originCode} ${data.typeID.heatID.heatCode} ${data.gradeID.gradeName}</td>
            <td>${data.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${data.addStock.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${(data.addStock*data.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${formatCustomDateTime(data.stockDate)}</td>
          </tr>
        `;
        table.innerHTML += openRow; // เพิ่มแถวข้อมูลลงในตาราง
      });
}

function updateTable2(tableId, tableData) {
    const table = document.getElementById(tableId);
    table.innerHTML = ''; // เคลียร์ข้อมูลเดิม

    // สร้างส่วนหัวของตาราง
    table.innerHTML += `
      <thead class="thead-light">
        <tr>
          <th colspan="7">
            <h4>รอขาย</h4>
          </th>
        </tr>
        <tr>
          <th>ชื่อสินค้า (รอขาย)</th>
          <th>ต้นทุน (บาท)</th>
          <th>จำนวน (ก.)</th>
          <th>ราคาเปิด (บาท)</th>
          <th>รวม (บาท)</th>
          <th>วันที่</th>
          <th>เปิด</th>
        </tr>
      </thead>
      <tbody>
    `;

    // วนลูปข้อมูล batch เพื่อสร้างแถวข้อมูล
    tableData.forEach(data => {
        const openRow = `
          <tr>
            <td style="background-color: #f0f0f0;">${data.productID.productName}</td>
            <td>${data.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${data.openWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${data.openPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${data.totalPreSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${formatCustomDateTime(data.entryDate)}</td>
            <td><button class='btn btn-primary btn-sm' onclick='openSaleID("${data.saleID._id}")'>ไฟล์</button></td>
          </tr>
        `;
        table.innerHTML += openRow; // เพิ่มแถวข้อมูลลงในตาราง
      });
}

function updateTable3(tableId, tableData) {
    const table = document.getElementById(tableId);
    table.innerHTML = ''; // เคลียร์ข้อมูลเดิม

    // สร้างส่วนหัวของตาราง
    table.innerHTML += `
      <thead class="thead-light">
        <tr>
          <th colspan="7">
            <h4>ขายแล้ว</h4>
          </th>
        </tr>
        <tr>
          <th>ชื่อสินค้า (ขายแล้ว)</th>
          <th>ต้นทุน (บาท)</th>
          <th>จำนวน (ก.)</th>
          <th>ราคาปิด (บาท)</th>
          <th>รวม (บาท)</th>
          <th>วันที่</th>
          <th>เปิด</th>
        </tr>
      </thead>
      <tbody>
    `;

    // วนลูปข้อมูล batch เพื่อสร้างแถวข้อมูล
    tableData.forEach(data => {
        const openRow = `
          <tr>
            <td style="background-color: #f0f0f0;">${data.productID.productName}</td>
            <td>${data.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${data.closeWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${data.closePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${data.totalSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${formatCustomDateTime(data.entryDate)}</td>
            <td><button class='btn btn-primary btn-sm' onclick='openSaleID("${data.saleID._id}")'>ไฟล์</button></td>
          </tr>
        `;
        table.innerHTML += openRow; // เพิ่มแถวข้อมูลลงในตาราง
      });
}
