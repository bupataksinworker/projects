function updateTableType(year, batchID) {
    fetch(`/api/manageStockDetails/${year}/${batchID}`)
        .then(response => response.json())
        .then(data => {
            if (data.batchDetails && data.stockEntries && data.saleEntries) {
                const batchDetails = data.batchDetails;

                // สร้างหัวตาราง
                const table = document.getElementById('typeDetails');
                table.innerHTML = ''; // ล้างข้อมูลเก่าก่อนจะเพิ่มข้อมูลใหม่
                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr class="center">
                        <th colspan="5">ชุด : ${batchDetails.batchName} (${year})</th>
                    </tr>
                    <tr>
                        <th>ประเภท</th>
                        <th>พร้อมขาย</th>
                        <th>รอขาย</th>
                        <th>ขายแล้ว</th>
                        <th>ทั้งหมด</th>
                    </tr>
                `;
                table.appendChild(thead);

                // สร้าง dropdown จาก type.typeName และ type._id
                const dropdown = document.getElementById('typeDetails_dropdown');
                dropdown.innerHTML = ''; // ล้างค่า dropdown ก่อน

                // เพิ่มตัวเลือก "เลือกประเภท" เป็นอันแรก
                const defaultOption = document.createElement('option');
                defaultOption.value = ''; // ให้ค่า value เป็นค่าว่าง
                defaultOption.text = 'เลือกประเภท'; // ข้อความที่แสดงใน dropdown
                defaultOption.disabled = true; // ปิดการใช้งานตัวเลือกนี้
                defaultOption.selected = true; // ตั้งค่าให้เป็นค่า default ที่ถูกเลือก
                // dropdown.appendChild(defaultOption);


                batchDetails.typeID.forEach(type => {
                    const option = document.createElement('option');
                    option.value = type._id;
                    option.text = type.typeName;
                    dropdown.appendChild(option);
                });

                // สร้างตัวตาราง
                const tbody = document.createElement('tbody');
                batchDetails.typeID.forEach(type => {
                    // รวม addStock จาก stockEntries ที่ตรงกับ typeID
                    const addStock = data.stockEntries
                        .filter(stock => stock.typeID._id === type._id)
                        .reduce((sum, stock) => sum + stock.addStock, 0);

                    // คำนวณค่าต่างๆ โดยใช้ saleEntries และ สถานะ C จะไม่ถูกคิดใน stock
                    const waitingForSale = data.saleEntries
                        .filter(entry => (entry.productID.typeID._id === type._id) && (entry.entryStatus === 'N'))
                        .reduce((sum, entry) => sum + entry.openWeight, 0);

                    const sold = data.saleEntries
                        .filter(entry => (entry.productID.typeID._id === type._id) && (entry.entryStatus === 'Y'))
                        .reduce((sum, entry) => sum + entry.closeWeight, 0);

                    // รวม addStock เข้ากับ total
                    const total = 0 + addStock;

                    // คำนวณ readyForSale
                    const readyForSale = total - (waitingForSale + sold);

                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                    const addStockPrice = data.stockEntries
                        .filter(stock => stock.typeID._id === type._id)
                        .reduce((sum, stock) => sum + (stock.addStock * stock.cost), 0);

                    const waitingForSalePrice = data.saleEntries
                        .filter(entry => (entry.productID.typeID._id === type._id) && (entry.entryStatus === 'N'))
                        .reduce((sum, entry) => sum + (entry.openWeight * entry.cost), 0);

                    const soldPrice = data.saleEntries
                        .filter(entry => (entry.productID.typeID._id === type._id) && (entry.entryStatus === 'Y'))
                        .reduce((sum, entry) => sum + (entry.closeWeight * entry.cost), 0);

                    const totalPrice = 0 + addStockPrice;

                    const readyForSalePrice = totalPrice - (waitingForSalePrice + soldPrice);
                    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                    // เงื่อนไข: แสดงเฉพาะแถวที่ readyForSale, waitingForSale, sold, หรือ total ไม่เท่ากับ 0
                    if (readyForSale !== 0 || waitingForSale !== 0 || sold !== 0 || total !== 0) {
                        // สร้างแถวใหม่และเพิ่มฟังก์ชันคลิกเพื่อเปลี่ยนสีพื้นหลัง
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td class="setText auto-shrink">${type.typeName}</td>
                            <td class="setNumber auto-shrink">${readyForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${readyForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                            <td class="setNumber auto-shrink">${waitingForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${waitingForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                            <td class="setNumber auto-shrink">${sold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                            <td class="setNumber auto-shrink">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                        `;

                        row.addEventListener('click', function () {
                            // ลบ class 'selected' ออกจากแถวอื่นๆ ใน tbody
                            document.querySelectorAll('#typeDetails tbody tr').forEach(tr => tr.classList.remove('selected'));
                            // เพิ่ม class 'selected' ให้กับแถวที่ถูกคลิก
                            row.classList.add('selected');

                            // เรียกฟังก์ชัน updateTableSize โดยใช้ batchID, typeID, grainID
                            updateTableSize(batchID, type._id, type.grainID._id);
                            document.querySelector('#gradeDetails tbody').innerHTML = ''; // Clear old table data

                            // อัปเดตค่า selected ใน dropdown ให้ตรงกับแถวที่เลือก
                            dropdown.value = type._id;

                            getCost(); // เรียกราคาต้นทุน

                        });

                        tbody.appendChild(row);
                    }
                });
                table.appendChild(tbody);
            } else {
                console.error('No batchDetails, stockEntries, or saleEntries data found');
            }
        })
        .catch(error => console.error('Error:', error));
}
