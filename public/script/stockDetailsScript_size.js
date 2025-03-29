function updateTableSize(batchID, typeID, grainID) {
    console.log("update table size :" + batchID, typeID, grainID)
    fetch(`/api/getSizesByGrain/${batchID}/${typeID}/${grainID}`)
        .then(response => response.json())
        .then(data => {
            const { sizes, saleEntries, stockEntries, products } = data; // Extract sizes, saleEntries, and stockEntries from response
            console.log(data)
            const sizeDetailsBody = document.querySelector('#sizeDetails tbody');
            const sizeDetailsDropdown = document.getElementById('sizeDetails_dropdown');
            sizeDetailsBody.innerHTML = ''; // Clear old table data
            sizeDetailsDropdown.innerHTML = ''; // Clear old dropdown data

            // เพิ่มตัวเลือก "เลือกไซส์" เป็นอันแรก
            const defaultOption = document.createElement('option');
            defaultOption.value = ''; // ให้ค่า value เป็นค่าว่าง
            defaultOption.text = 'เลือกไซส์'; // ข้อความที่แสดงใน dropdown
            defaultOption.disabled = true; // ปิดการใช้งานตัวเลือกนี้
            defaultOption.selected = true; // ตั้งค่าให้เป็นค่า default ที่ถูกเลือก
            // sizeDetailsDropdown.appendChild(defaultOption);


            sizes.forEach((size) => {
                // หาค่า addStock จาก stockEntries ที่ตรงกับ size นี้
                const addStock = stockEntries.filter(stock => stock.sizeID._id === size._id)
                    .reduce((sum, stock) => sum + stock.addStock, 0); // รวมค่า addStock ถ้ามีหลายรายการ

                const total = 0 + addStock; // คำนวณ total โดยรวมค่า addStock

                const waitingForSale = saleEntries.filter(entry =>
                    (entry.productID.sizeID._id === size._id) &&
                    (entry.entryStatus === 'N')
                ).reduce((sum, entry) => sum + entry.openWeight, 0);

                const sold = saleEntries.filter(entry =>
                    (entry.productID.sizeID._id === size._id) &&
                    (entry.entryStatus === 'Y')
                ).reduce((sum, entry) => sum + entry.closeWeight, 0);

                const readyForSale = total - (waitingForSale + sold);

                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                const addStockPrice = stockEntries.filter(stock => stock.sizeID._id === size._id)
                    .reduce((sum, stock) => sum + (stock.addStock*stock.cost), 0); 

                const totalPrice = 0 + addStockPrice; 

                const waitingForSalePrice = saleEntries.filter(entry =>
                    (entry.productID.sizeID._id === size._id) &&
                    (entry.entryStatus === 'N')
                ).reduce((sum, entry) => sum + (entry.openWeight*entry.cost), 0);

                const soldPrice = saleEntries.filter(entry =>
                    (entry.productID.sizeID._id === size._id) &&
                    (entry.entryStatus === 'Y')
                ).reduce((sum, entry) => sum + (entry.closeWeight*entry.cost), 0);

                const readyForSalePrice = totalPrice - (waitingForSalePrice + soldPrice);
                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

                // Add option to dropdown
                const matchingProduct = products.find(product => product.sizeID._id === size._id);
                if (matchingProduct) { // Only add sizes that match products.sizeID._id
                    const option = document.createElement('option');
                    option.value = size._id;
                    option.text = size.sizeName;
                    sizeDetailsDropdown.appendChild(option);
                }

                // Only display rows where readyForSale, waitingForSale, sold, or total are not zero
                if (readyForSale !== 0 || waitingForSale !== 0 || sold !== 0 || total !== 0) {
                    // Create a new row in the table
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="setText auto-shrink">${size.sizeName}</td>
                        <td class="setNumber auto-shrink">${readyForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${readyForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                        <td class="setNumber auto-shrink">${waitingForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${waitingForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                        <td class="setNumber auto-shrink">${sold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                        <td class="setNumber auto-shrink">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                    `;

                    // Add click event listener to the row
                    row.addEventListener('click', function () {
                        // Remove 'selected' class from all rows
                        document.querySelectorAll('#sizeDetails tbody tr').forEach(tr => tr.classList.remove('selected'));

                        // Add 'selected' class to the clicked row
                        row.classList.add('selected');

                        // Update the dropdown to reflect the selected size
                        sizeDetailsDropdown.value = size._id;

                        // Call updateTableGrade using batchID, typeID, and the clicked sizeID
                        updateTableGrade(batchID, typeID, size._id);

                        getCost(); // เรียกราคาต้นทุน

                    });

                    sizeDetailsBody.appendChild(row);
                }
            });
        })
        .catch(error => console.error('Error:', error));
}
