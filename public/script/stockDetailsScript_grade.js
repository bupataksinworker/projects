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
                            ${readyForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ก.
                            * ${avgReadyForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n
                            = ${readyForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        ">
                            ${readyForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ก.<br>
                            * ${avgReadyForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
                            = ${readyForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td class="setNumber auto-shrink classTitle" data-tooltip="
                            ${waitingForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ก.\n
                            * ${avgWaitingForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n
                            = ${waitingForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        ">
                            ${waitingForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ก.<br>
                            * ${avgWaitingForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
                            = ${waitingForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td class="setNumber auto-shrink classTitle" data-tooltip="
                            ${sold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ก.\n
                            * ${avgSold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n
                            = ${soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        ">
                            ${sold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ก.<br>
                            * ${avgSold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
                            = ${soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td class="setNumber auto-shrink classTitle" data-tooltip="
                            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ก.\n
                            * ${avgTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n
                            = ${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        ">
                            ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ก.<br>
                            * ${avgTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>
                            = ${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                    `;


                    // สร้างปุ่มและเพิ่มใน document
                    const button = document.createElement('button');
                    button.className = 'circle-button fa fa-arrow-right';
                    button.innerText = ''; // เปลี่ยนเป็นสัญลักษณ์ตามต้องการ
                    button.style.display = 'none'; // ซ่อนปุ่มไว้ก่อน

                    // เพิ่มปุ่มลงใน document body
                    document.body.appendChild(button);

                    // Add click event listener to the row
                    row.addEventListener('click', function () {
                        // Remove 'selected' class from all rows
                        document.querySelectorAll('#gradeDetails tbody tr').forEach(tr => tr.classList.remove('selected'));

                        // Add 'selected' class to the clicked row
                        row.classList.add('selected');

                        // Update dropdown to reflect the selected grade
                        gradeDetailsDropdown.value = grade._id;

                        getCost(); // เรียกราคาต้นทุน

                        // แสดงปุ่มลอยตรงด้านขวาของแถวที่เลือก
                        const rect = row.getBoundingClientRect();
                        button.style.top = `${window.scrollY + rect.top + rect.height / 2 - button.offsetHeight / 2}px`;
                        button.style.left = `${window.scrollX + rect.right + 20}px`; // ปรับระยะห่างทางขวาของปุ่มจากตาราง
                        button.style.display = 'block';
                    });

                    // ซ่อนปุ่มเมื่อคลิกที่อื่นนอกตาราง
                    document.addEventListener('click', function (e) {
                        if (!row.contains(e.target) && !button.contains(e.target)) {
                            button.style.display = 'none';
                        }
                    });

                    button.addEventListener('click', function () {

                        const gradeID = document.getElementById('gradeDetails_dropdown').value;
                        // สร้าง query string สำหรับเปิด URL
                        const queryString = new URLSearchParams({ batchID, typeID, sizeID, gradeID }).toString();
                        window.open(`/gradeDetails?${queryString}`, '_blank');
                    })

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