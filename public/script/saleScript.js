function openModalCreateBill() {
  document.getElementById('createBillModal').style.display = 'block';
}

function closeModalCreateBill() {
  document.getElementById('createBillModal').style.display = 'none';
}

function submitCreateBill() {
  const customerID = document.getElementById('inputCustomerName').value;
  const subCustomerName = document.getElementById('inputSubCustomerName').value;
  const saleDate = document.getElementById('inputDate').value;
  const discount = document.getElementById('inputDiscount').value;

  if (!customerID || customerID.trim() === '') {
    alert('Customer name is required.');  // แสดง alert แจ้งเตือน
    document.getElementById('inputCustomerName').focus(); // ให้โฟกัสไปที่อินพุต
    return;
  } else {
    console.log('Customer ID is valid:', customerID);

  }

  const saleData = {
    customerID,
    subCustomerName,
    saleDate,
    discount
  };

  fetch('/addSale', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(saleData)
  })
    .then(response => response.json())
    .then(data => {
      alert('บิลได้ถูกสร้างเรียบร้อยแล้ว');
      closeModalCreateBill(); // ปิด modal หลังจากส่งข้อมูลสำเร็จ
      location.reload();
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('เกิดข้อผิดพลาดในการสร้างบิล');
    });
}

function updateSubCustomerNames() {
  const customerId = document.getElementById('inputCustomerName').value;
  const subCustomerSelect = document.getElementById('inputSubCustomerName');
  subCustomerSelect.innerHTML = ''; // Clear existing options

  // เพิ่มตัวเลือกค่าว่างเป็นค่าแรก
  subCustomerSelect.add(new Option('เลือกรายย่อย', '', true, true));

  if (customerId) {
    fetch(`/getSubCustomers/${customerId}`)
      .then(response => response.json())
      .then(data => {
        if (data.subCustomerNames && data.subCustomerNames.length) {
          subCustomerSelect.disabled = false; // Enable sub-customer dropdown
          data.subCustomerNames.forEach(name => {
            const option = new Option(name, name);
            subCustomerSelect.add(option);
          });
        } else {
          subCustomerSelect.add(new Option('ไม่มีรายย่อย', ''));
          subCustomerSelect.disabled = true;
        }
      })
      .catch(error => console.error('Error fetching sub customers:', error));
  } else {
    subCustomerSelect.disabled = true;
  }
}

function openFile(saleId) {
  // URL ที่จะเปิดขึ้นอยู่กับ _id ของการขาย
  const url = `/manageSaleEntry/${saleId}`;
  // เปิด URL ในแท็บใหม่
  window.open(url, '_blank');
}

let currentPage = 1;  // Track the current page
let totalSales = 0;  // Track the total number of entries
const pageSize = 10;  // Define the page size

function loadSales(page = 1) {
  const customerID = document.getElementById('customerDropdown').value;
  const subCustomerName = document.getElementById('subCustomerDropdown').value;
  const inputDateStart = document.getElementById('inputDateStart').value;
  const inputDateEnd = document.getElementById('inputDateEnd').value;

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const dateStart = inputDateStart || oneYearAgo.toISOString().split('T')[0];
  const dateEnd = inputDateEnd || new Date().toISOString().split('T')[0];

  const query = new URLSearchParams({
    page,
    customerID,
    subCustomerName,
    dateStart,
    dateEnd
  });

  fetch(`/fetchSales?${query.toString()}`)
    .then(response => response.json())
    .then(data => {
      totalSales = data.totalSales;  // Update the total number of entries

      const tableBody = document.getElementById('salesTable').querySelector('tbody');
      tableBody.innerHTML = ''; // Clear existing rows
      const indexOffset = (page - 1) * pageSize;

      // Sort sales data
      const sortedSales = data.sales.sort((a, b) => {
        const dateComparison = new Date(b.saleDate) - new Date(a.saleDate);
        return dateComparison !== 0 ? dateComparison : b.sorter - a.sorter;
      });

      // Generate new rows
      const rowsHtml = sortedSales.map((sale, index) => `
        <tr style="text-align: center;">
          <td>${indexOffset + index + 1}</td>
          <td>${new Date(sale.saleDate).toLocaleDateString('en-GB')}</td>
          <td>${sale.customerID.customerName}</td>
          <td>${sale.subCustomerName || '-'}</td>
          <td style="text-align: right;">${addCommas(sale.totalAmount)}</td>
          <td style="text-align: right;">${sale.discount}%</td>
          <td style="text-align: right;">${addCommas(sale.totalSaleAfterDC)}</td>
          <td>${sale.billStatus}</td>
          <td>
            <button class='btn btn-primary btn-sm' onclick='openFile("${sale._id}")'>เปิดไฟล์</button>
          </td>
        </tr>
      `).join('');

      tableBody.innerHTML = rowsHtml;

      // Update pagination
      renderPagination(totalSales, pageSize, page);
    })
    .catch(error => console.error('Error loading sales:', error));
}

// Function to render pagination
function renderPagination(totalSales, pageSize, currentPage) {
  const paginationContainer = document.querySelector('#pagination');
  paginationContainer.innerHTML = '';

  const totalSalesText = document.createElement('span');
  totalSalesText.innerText = `ทั้งหมด: ${totalSales} รายการ`;
  paginationContainer.appendChild(totalSalesText);

  const totalPages = Math.ceil(totalSales / pageSize);
  for (let page = 1; page <= totalPages; page++) {
    const pageButton = document.createElement('button');
    pageButton.className = 'btn btn-secondary btn-sm';
    pageButton.innerText = page;
    pageButton.disabled = (page === currentPage);
    pageButton.style.marginLeft = '10px'; // เพิ่มช่องว่าง 1 tab (10px) ระหว่างปุ่ม
    pageButton.onclick = () => loadSales(page);
    paginationContainer.appendChild(pageButton);
  }
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;

  // ตรวจสอบ URL ว่าเป็นหน้าที่ต้องการหรือไม่
  if (currentPath === '/manageSale') {
    loadSales(currentPage);
  }
});


function getSubCustomerNames() {  // Filter Report Sale
  const customerId = document.getElementById('customerDropdown').value;
  const subCustomerSelect = document.getElementById('subCustomerDropdown');
  subCustomerSelect.innerHTML = ''; // Clear existing options

  // เพิ่มตัวเลือกค่าว่างเป็นค่าแรก
  subCustomerSelect.add(new Option('เลือกรายย่อย', '', true, true));

  if (customerId) {
    fetch(`/getSubCustomers/${customerId}`)
      .then(response => response.json())
      .then(data => {
        if (data.subCustomerNames && data.subCustomerNames.length) {
          subCustomerSelect.disabled = false; // Enable sub-customer dropdown
          data.subCustomerNames.forEach(name => {
            const option = new Option(name, name);
            subCustomerSelect.add(option);
          });
        } else {
          subCustomerSelect.add(new Option('ไม่มีรายย่อย', ''));
          subCustomerSelect.disabled = true;
        }
      })
      .catch(error => console.error('Error fetching sub customers:', error));
  } else {
    subCustomerSelect.disabled = true;
  }
}
// --------------------------------- Go Down for editSale --------------------------------------------------------------------

function updateSale(saleId) {
  console.log("update SaleId : " + saleId);
  // Prevent the default form submission behavior
  event.preventDefault();

  // Collect form data
  const formData = {
    saleID: document.getElementById('saleID').value,
    customerID: document.getElementById('customerDropdown').value,
    subCustomerName: document.getElementById('subCustomerDropdown').value,
    billStatus: document.getElementById('billStatus').value,
    discount: document.getElementById('discount').value,
    saleDate: document.getElementById('saleDate').value
  };

  // Use fetch API to send the POST request
  fetch('/updateSale', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      return response.json();
    })
    .then(data => {
      console.log('Update successful:', data);
      alert('อัพเดทสำเร็จ!');
      // Optionally refresh the page or handle navigation
      const url = `/manageSaleEntry/${saleId}`;
      window.location.href = url;

    })
    .catch(error => {
      console.error('Update failed:', error);
      alert('Error updating sale. Please try again.');
    });
}

function loadSubCustomers() {
  var customerId = document.getElementById('customerDropdown').value;
  var subCustomerDropdown = document.getElementById('subCustomerDropdown');
  
  // ล้างตัวเลือกเดิมใน dropdown
  subCustomerDropdown.innerHTML = '';

  // เพิ่มตัวเลือกแรกที่มีข้อความว่า "เลือกรายย่อย" และไม่มีค่า
  let defaultOption = document.createElement('option');
  defaultOption.textContent = 'เลือกรายย่อย';
  defaultOption.value = '';
  subCustomerDropdown.appendChild(defaultOption);

  // ส่งคำขอไปยัง server ที่ endpoint เพื่อรับ subCustomerNames
  fetch(`/getSubCustomers/${customerId}`)
      .then(response => response.json())
      .then(data => {
          if (data && data.subCustomerNames && data.subCustomerNames.length > 0) {
              data.subCustomerNames.forEach(subCustomer => {
                  let option = document.createElement('option');
                  option.value = subCustomer;
                  option.textContent = subCustomer;
                  subCustomerDropdown.appendChild(option);
              });
          } else {
              let noOption = document.createElement('option');
              noOption.textContent = 'ไม่มี Sub Customers';
              noOption.value = '';
              subCustomerDropdown.appendChild(noOption);
          }
      })
      .catch(error => {
          console.error('Error loading sub customers:', error);
          let errorOption = document.createElement('option');
          errorOption.textContent = 'Error loading sub customers';
          errorOption.value = '';
          subCustomerDropdown.appendChild(errorOption);
      });
}


// --------------------------------- Go Down for deleteSale --------------------------------------------------------------------

function deleteSale(deleteId) {
  if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?')) {
      fetch('/deleteSale', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ delete_id: deleteId })
      })
      .then(response => response.json())
      .then(data => {
          if (data.success) {
              alert('ลบข้อมูลสำเร็จ');
              // window.location.reload(); // รีเฟรชหน้าเว็บ
              const url = `/manageSale`;
              window.location.href = url;
          } else {
              alert('ไม่สามารถลบใบขายได้ หากยังมีสินค้าอยู่ในรายการ');
          }
      })
      .catch(error => console.error('Error:', error));
  }
}
