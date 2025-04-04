function updateTableGrade(batchID, typeID, sizeID) {
    fetch(`/api/getGradeBySize/${batchID}/${typeID}/${sizeID}`)
        .then(response => response.json())
        .then(data => {
            const { grades, saleEntries, stockEntries } = data; // Extract grades, saleEntries, and stockEntries from response

            const gradeDetailsBody = document.querySelector('#gradeDetails tbody');
            const gradeDetailsDropdown = document.getElementById('gradeDetails_dropdown');
            gradeDetailsBody.innerHTML = ''; // Clear old table data
            gradeDetailsDropdown.innerHTML = ''; // Clear old dropdown data

            // เพิ่มตัวเลือก "เลือกเกรด" เป็นอันแรก
            const defaultOption = document.createElement('option');
            defaultOption.value = ''; // ให้ค่า value เป็นค่าว่าง
            defaultOption.text = 'เลือกเกรด'; // ข้อความที่แสดงใน dropdown
            defaultOption.disabled = true; // ปิดการใช้งานตัวเลือกนี้
            defaultOption.selected = true; // ตั้งค่าให้เป็นค่า default ที่ถูกเลือก
            gradeDetailsDropdown.appendChild(defaultOption);

            grades.forEach((grade) => {
                // Filter saleEntries ที่ตรงกับ grade ปัจจุบัน
                const gradeEntries = saleEntries.filter(entry => entry.productID.gradeID._id === grade._id);

                // หาค่า addStock จาก stockEntries ที่ตรงกับ size นี้
                const addStock = stockEntries.filter(stock => stock.gradeID._id === grade._id)
                    .reduce((sum, stock) => sum + stock.addStock, 0); // รวมค่า addStock ถ้ามีหลายรายการ

                // คำนวณค่าต่างๆ โดยใช้ saleEntries และ สถานะ C จะไม่ถูกคิดใน stock
                const total = 0 + addStock; // รวมค่า addStock

                const waitingForSale = gradeEntries.filter(entry => entry.entryStatus === 'N')
                    .reduce((sum, entry) => sum + entry.openWeight, 0);

                const sold = gradeEntries.filter(entry => entry.entryStatus === 'Y')
                    .reduce((sum, entry) => sum + entry.closeWeight, 0);

                const readyForSale = total - (waitingForSale + sold);

                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                const addStockPrice = stockEntries.filter(stock => stock.gradeID._id === grade._id)
                    .reduce((sum, stock) => sum + (stock.addStock * stock.cost), 0);

                const totalPrice = 0 + addStockPrice;

                const waitingForSalePrice = gradeEntries.filter(entry => entry.entryStatus === 'N')
                    .reduce((sum, entry) => sum + (entry.openWeight * entry.cost), 0);

                const soldPrice = gradeEntries.filter(entry => entry.entryStatus === 'Y')
                    .reduce((sum, entry) => sum + (entry.closeWeight * entry.cost), 0);

                const readyForSalePrice = totalPrice - (waitingForSalePrice + soldPrice);

                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                // คำนวณค่าเฉลี่ยของ cost และตรวจสอบ NaN
                const avgReadyForSale = isNaN(readyForSalePrice / readyForSale) ? 0 : readyForSalePrice / readyForSale;
                const avgWaitingForSale = isNaN(waitingForSalePrice / waitingForSale) ? 0 : waitingForSalePrice / waitingForSale;
                const avgSold = isNaN(soldPrice / sold) ? 0 : soldPrice / sold;
                const avgTotal = isNaN(totalPrice / total) ? 0 : totalPrice / total;
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                // Add option to dropdown
                const option = document.createElement('option');
                option.value = grade._id;
                option.text = grade.gradeName;
                gradeDetailsDropdown.appendChild(option);

                // Only display rows where readyForSale, waitingForSale, sold, or total are not zero
                if (readyForSale !== 0 || waitingForSale !== 0 || sold !== 0 || total !== 0) {
                    // Create a new row in the table
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="setText auto-shrink">${grade.gradeName}</td>
                        <td class="setNumber auto-shrink classTitle" data-tooltip="
                            จำนวน: ${readyForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n
                            ต้นทุน: ${avgReadyForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n
                            มูลค่า: ${readyForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        ">
                            จำนวน: ${readyForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
                            ต้นทุน: ${avgReadyForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
                            มูลค่า: ${readyForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td class="setNumber auto-shrink classTitle" data-tooltip="
                            จำนวน: ${waitingForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n
                            ต้นทุน: ${avgWaitingForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n
                            มูลค่า: ${waitingForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        ">
                            จำนวน: ${waitingForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
                            ต้นทุน: ${avgWaitingForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
                            มูลค่า: ${waitingForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td class="setNumber auto-shrink classTitle" data-tooltip="
                            จำนวน: ${sold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n
                            ต้นทุน: ${avgSold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n
                            มูลค่า: ${soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        ">
                            จำนวน: ${sold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
                            ต้นทุน: ${avgSold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
                            มูลค่า: ${soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td class="setNumber auto-shrink classTitle" data-tooltip="
                            จำนวน: ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n
                            ต้นทุน: ${avgTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n
                            มูลค่า: ${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        ">
                            จำนวน: ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
                            ต้นทุน: ${avgTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
                            มูลค่า: ${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    `;


                    // Add click event listener to the row
                    row.addEventListener('click', function () {
                        // Remove 'selected' class from all rows
                        document.querySelectorAll('#gradeDetails tbody tr').forEach(tr => tr.classList.remove('selected'));

                        // Add 'selected' class to the clicked row
                        row.classList.add('selected');

                        // Update dropdown to reflect the selected grade
                        gradeDetailsDropdown.value = grade._id;

                        getCost(); // เรียกราคาต้นทุน

                    });

                    gradeDetailsBody.appendChild(row);
                    // เรียกใช้ setTitleFromContent() หลังจากสร้าง elements เหล่านั้น
                    setTitleFromContent();
                }
            });
        })
        .catch(error => console.error('Error fetching grades:', error));
}

// ฟังก์ชันตั้งค่า title ให้กับทุกองค์ประกอบที่มีคลาส .classTitle
function setTitleFromContent() {
    document.querySelectorAll('.classTitle').forEach(element => {
      element.title = element.textContent.trim(); // กำหนด title จากข้อความภายในคลาสนั้น
    });
  }
  
  // เรียกฟังก์ชันหลังจากสร้างเนื้อหาใน elements เหล่านั้น
  setTitleFromContent();