async function updateSubCustomers() {
    const customerId = document.getElementById('customerName').value;
    const subCustomerDropdown = document.getElementById('subCustomerName');

    try {
        const response = await fetch(`/api/subCustomers?customerId=${customerId}`);
        const subCustomers = await response.json();

        subCustomerDropdown.innerHTML = '<option value="">เลือก</option>';
        subCustomers.forEach(subCustomer => {
            const option = document.createElement('option');
            option.value = subCustomer;
            option.text = subCustomer;
            subCustomerDropdown.add(option);
        });
    } catch (error) {
        console.error('Error fetching subCustomers:', error);
    }
}

async function updateSizes() {
    const selectedGrains = Array.from(document.querySelectorAll('input[name="grain"]:checked')).map(cb => cb.value);

    if (selectedGrains.length === 0) {
        document.getElementById('sizeSelectContainer').innerHTML = '<p>-- เลือกประเภทก่อน --</p>';
        return;
    }

    try {
        const response = await fetch(`/api/sizes?grainID=${selectedGrains.join(',')}`);
        const sizes = await response.json();

        const sizeSelectContainer = document.getElementById('sizeSelectContainer');
        sizeSelectContainer.innerHTML = '';

        sizes.forEach(size => {
            const container = document.createElement('span'); // Use 'span' for inline grouping
            container.style.display = 'flex';
            container.style.alignItems = 'center'; // Center align checkbox and label
            container.style.marginRight = '10px'; // Adjust spacing between each pair
        
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'size'; // Set name to 'size'
            checkbox.value = size._id;
            checkbox.id = `size_${size._id}`;
            checkbox.style.marginRight = '5px'; // Adjust spacing between checkbox and label

            // Add event listener to call filterEntries on change
            checkbox.addEventListener('change', filterEntries);
        
            const label = document.createElement('label');
            label.htmlFor = `size_${size._id}`;
            label.textContent = `${size.sizeName}`;
        
            // Set class based on sorter value
            if (size.grainID.sorter === 1) {
                label.classList.add('text-success'); // Green for success
            } else if (size.grainID.sorter === 2) {
                label.classList.add('text-warning'); // Yellow for warning
            } else if (size.grainID.sorter === 3) {
                label.classList.add('text-danger'); // Red for danger
            }
        
            container.appendChild(checkbox);
            container.appendChild(label);
        
            sizeSelectContainer.appendChild(container);
        });              


    } catch (error) {
        console.error('Error fetching sizes:', error);
    }
}



document.querySelectorAll('input[name="grain"]').forEach(cb => {
    cb.addEventListener('change', updateSizes);
});


// async function updateProducts() {
//     const selectedGrains = Array.from(document.querySelectorAll('input[name="grain"]:checked')).map(cb => cb.value);
//     const selectedOrigins = Array.from(document.querySelectorAll('input[name="origin"]:checked')).map(cb => cb.value);
//     const selectedHeats = Array.from(document.querySelectorAll('input[name="heat"]:checked')).map(cb => cb.value);
//     const selectedSize = document.getElementById('sizeSelect').value;

//     let queryParams = [];
//     if (selectedGrains.length > 0) queryParams.push(`grainID=${selectedGrains.join(',')}`);
//     if (selectedOrigins.length > 0) queryParams.push(`originID=${selectedOrigins.join(',')}`);
//     if (selectedHeats.length > 0) queryParams.push(`heatID=${selectedHeats.join(',')}`);
//     if (selectedSize) queryParams.push(`sizeID=${selectedSize}`);

//     const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

//     try {
//         const response = await fetch(`/api/products${queryString}`);
//         if (response.ok) {
//             const products = await response.json();
//             const productSelect = document.getElementById('productSelect');
//             productSelect.innerHTML = '<option value="">-- เลือกสินค้า --</option>';
//             products.forEach(product => {
//                 const option = document.createElement('option');
//                 option.value = product._id;
//                 option.text = product.productName;
//                 productSelect.add(option);
//             });
//         } else {
//             console.error('Failed to fetch products:', response.statusText);
//         }
//     } catch (error) {
//         console.error('Error fetching products:', error);
//     }
// }

// document.querySelectorAll('input[name="grain"]').forEach(cb => {
//     cb.addEventListener('change', updateProducts);
// });

// document.querySelectorAll('input[name="origin"]').forEach(cb => {
//     cb.addEventListener('change', updateProducts);
// });

// document.querySelectorAll('input[name="heat"]').forEach(cb => {
//     cb.addEventListener('change', updateProducts);
// });

// document.getElementById('sizeSelect').addEventListener('change', updateProducts);


async function updateBatchs() {
    const selectedGrains = Array.from(document.querySelectorAll('input[name="grain"]:checked')).map(cb => cb.value);
    let queryParams = [];

    if (selectedGrains.length > 0) {
        queryParams.push(`grainID=${selectedGrains.join(',')}`);
    }

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    try {
        const batchResponse = await fetch(`/api/batchs${queryString}`);
        if (batchResponse.ok) {
            const batchData = await batchResponse.json();
            const batchs = batchData.batchs;

            // สร้าง HTML สำหรับ dropdown ของ batch
            var batchDropdownHTML = '<option value="">-- เลือกชุด --</option>';
            batchs.forEach(function (batch) {
                batchDropdownHTML += `<option value="${batch._id}">${batch.batchName}</option>`;
            });
            document.getElementById('batchSelect').innerHTML = batchDropdownHTML;
        } else {
            console.error('Failed to fetch batches:', batchResponse.statusText);
        }
    } catch (error) {
        console.error('Error fetching batches:', error);
    }
}

// เพิ่ม event listener สำหรับการเปลี่ยนค่าใน grain
document.querySelectorAll('input[name="grain"]').forEach(cb => {
    cb.addEventListener('change', updateBatchs);
});



async function filterEntries() {
    const filterStatus = document.getElementById('filterStatus').value;
    const customerName = document.getElementById('customerName').value;
    const subCustomerName = document.getElementById('subCustomerName').value;
    const selectedBatchs = document.getElementById('batchSelect').value;
    const selectedGrains = Array.from(document.querySelectorAll('input[name="grain"]:checked')).map(cb => cb.value);
    const selectedOrigins = Array.from(document.querySelectorAll('input[name="origin"]:checked')).map(cb => cb.value);
    const selectedHeats = Array.from(document.querySelectorAll('input[name="heat"]:checked')).map(cb => cb.value);
    const selectedSizes = Array.from(document.querySelectorAll('input[name="size"]:checked')).map(cb => cb.value);
    const selectedGrades = Array.from(document.querySelectorAll('input[name="grade"]:checked')).map(cb => cb.value);
    const priceFrom = parseFloat(document.getElementById('priceFrom').value) || 0;
    const priceTo = parseFloat(document.getElementById('priceTo').value) || Infinity;
    const entryDateFrom = document.getElementById('entryDateFrom').value;
    const entryDateTo = document.getElementById('entryDateTo').value;
    const selectedSharps = Array.from(document.querySelectorAll('input[name="sharp"]:checked')).map(cb => cb.value);

    // Log ค่า selectedSharps เพื่อตรวจสอบ
    console.log('selectedSharps:', selectedSharps);

    const filteredEntries = window.allSaleEntries.filter(entry => {
        const entryDate = entry.entryDate.split('T')[0]; // ใช้เฉพาะส่วนวันที่ของ entryDate
        const closePrice = entry.closePrice;
        const openPrice = entry.openPrice;
        const priceToCheck = (closePrice > 0) ? closePrice : openPrice;

        // ตรวจสอบค่า selectedSharps ว่ามีใน entry.sharp หรือไม่
        const isSharpMatched = selectedSharps.length === 0 || selectedSharps.some(sharp => entry.sharp.includes(sharp));

        return (!filterStatus || entry.entryStatus === filterStatus) &&
            (!customerName || entry.saleID.customerID._id === customerName) &&
            (!subCustomerName || entry.saleID.subCustomerName === subCustomerName) &&
            (!selectedBatchs || entry.batchID._id === selectedBatchs) &&
            (selectedGrains.length === 0 || selectedGrains.some(grain => entry.productID.typeID.grainID._id === grain)) &&
            (selectedOrigins.length === 0 || selectedOrigins.some(origin => entry.productID.typeID.originID._id === origin)) &&
            (selectedHeats.length === 0 || selectedHeats.some(heat => entry.productID.typeID.heatID._id === heat)) &&
            (selectedSizes.length === 0 || selectedSizes.some(size => entry.productID.sizeID._id === size)) &&
            (selectedGrades.length === 0 || selectedGrades.some(grade => entry.productID.gradeID._id === grade)) &&
            (entryDate >= entryDateFrom && entryDate <= entryDateTo) && 
            (priceToCheck >= priceFrom && priceToCheck <= priceTo) && 
            isSharpMatched;
    });

    // Log ข้อมูลที่กรองแล้ว
    console.log('Filtered Entries:', filteredEntries);

    // เก็บข้อมูลที่กรองแล้วในตัวแปรของ window
    window.filteredEntries = filteredEntries;

    updateTable(filteredEntries);
}




function updateTable(saleEntries, page = 1) {
    const tableBody = document.querySelector('#entriesTable tbody');
    tableBody.innerHTML = '';

    const pageSize = 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedEntries = saleEntries.slice(startIndex, endIndex);

    paginatedEntries.forEach((entry, index) => {
        const row = document.createElement('tr');
        const statusClass = entry.entryStatus === 'N' ? 'red' : (entry.entryStatus === 'C' ? 'yellow' : 'green');
        row.innerHTML = `
            <td class="setCenter">${startIndex + index + 1}</td>
            <td class="setCenter">${new Date(entry.entryDate).toLocaleDateString('en-GB')}</td>
            <td class="setText">${entry.saleID.customerID.customerName} ${entry.saleID.subCustomerName ? `(${entry.saleID.subCustomerName})` : ''}</td>
            <td class="setText">${entry.batchID.batchName}</td>
            <td class="setText">${entry.productID.productName}</td>
            <td class="setNumber">${addCommas(entry.cost)}</td>
            <td class="setNumber">${addCommas(entry.closeWeight)}</td>
            <td class="setNumber">${addCommas(entry.closePrice)}</td>
            <td class="setNumber">${addCommas(entry.totalSale)}</td>
            <td class="sharp" style="white-space: nowrap;overflow: hidden;text-overflow: ellipsis;max-width: 100px;" title="${entry.sharp.join(', ')}">${entry.sharp.join(', ')}</td>
            <td>
                <button class="entry-status-button ${statusClass}" title="Y สิ้นสุด N รอจัดการ C คืนสินค้า">
                  ${entry.entryStatus}
                </button>
                        ${entry.note
                ? `<button class="entry-status-button gray" title="หมายเหตุ: ${entry.note}" onclick="showNotePopup('${entry.note}')" ${entry.note === ' ' ? 'hidden' : ''}>T</button>`
                : ''
            }
            </td>
            <td class="setCenter"><button class='btn btn-primary btn-sm' onclick='openFile("${entry.saleID._id}")'>เปิดไฟล์</button></td>
        `;
        tableBody.appendChild(row);
    });

    renderPagination(saleEntries.length, pageSize, page);
}

function renderPagination(totalEntries, pageSize, currentPage) {
    const paginationContainer = document.querySelector('#pagination');
    paginationContainer.innerHTML = '';

    // แสดงจำนวนรายการทั้งหมด
    const totalEntriesText = document.createElement('span');
    totalEntriesText.innerText = `ทั้งหมด: ${totalEntries} รายการ`;
    paginationContainer.appendChild(totalEntriesText);

    // สร้างการแบ่งหน้า
    const totalPages = Math.ceil(totalEntries / pageSize);
    for (let page = 1; page <= totalPages; page++) {
        const pageButton = document.createElement('button');
        pageButton.className = 'btn btn-secondary btn-sm';
        pageButton.innerText = page;
        pageButton.disabled = (page === currentPage);
        pageButton.style.marginLeft = '10px'; // เพิ่มช่องว่าง 1 tab (10px) ระหว่างปุ่ม
        pageButton.onclick = () => updateTable(window.filteredEntries, page); // ใช้ข้อมูลที่กรองแล้ว
        paginationContainer.appendChild(pageButton);
    }
}


function openFile(saleId) {
    // URL ที่จะเปิดขึ้นอยู่กับ _id ของการขาย
    const url = `/manageSaleEntry/${saleId}`;
    // เปิด URL ในแท็บใหม่
    window.open(url, '_blank');
}

// // เพิ่ม event listener สำหรับการเปลี่ยนค่าใน grade
// document.querySelectorAll('input[name="grade"]').forEach(cb => {
//     cb.addEventListener('change', filterEntries);
// });

// // เพิ่ม event listener สำหรับการเปลี่ยนค่าใน sharp
// document.querySelectorAll('input[name="sharp"]').forEach(cb => {
//     cb.addEventListener('change', filterEntries);
// });

function showNotePopup(note) {
    alert(`หมายเหตุ: ${note}`);
}

// document.getElementById('filterStatus').addEventListener('change', filterEntries);
// document.getElementById('customerName').addEventListener('change', filterEntries);
// document.getElementById('subCustomerName').addEventListener('change', filterEntries);
// document.getElementById('batchSelect').addEventListener('change', filterEntries);
// document.querySelectorAll('input[name="size"]').forEach(cb => cb.addEventListener('change', filterEntries));
// document.querySelectorAll('input[name="grade"]').forEach(cb => cb.addEventListener('change', filterEntries));
// document.querySelectorAll('input[name="grain"]').forEach(cb => cb.addEventListener('change', filterEntries));
// document.querySelectorAll('input[name="origin"]').forEach(cb => cb.addEventListener('change', filterEntries));
// document.querySelectorAll('input[name="heat"]').forEach(cb => cb.addEventListener('change', filterEntries));
// document.querySelectorAll('input[name="sharp"]').forEach(cb => cb.addEventListener('change', filterEntries));
// document.getElementById('priceFrom').addEventListener('change', filterEntries);
// document.getElementById('priceTo').addEventListener('change', filterEntries);
// document.getElementById('entryDateFrom').addEventListener('change', filterEntries);
// document.getElementById('entryDateTo').addEventListener('change', filterEntries);

async function fetchAllEntries() {
    try {
        const response = await fetch('/api/saleEntries');
        const saleEntries = await response.json();
        window.allSaleEntries = saleEntries;
        filterEntries(); // เรียกใช้ filterEntries ทันทีหลังจากโหลดข้อมูลทั้งหมด
    } catch (error) {
        console.error('Error fetching all sale entries:', error);
    }
}

window.onload = function () {
    // fetchAllEntries();
}
