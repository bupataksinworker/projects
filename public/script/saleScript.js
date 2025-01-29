function openModalCreateBill() {
  document.getElementById('createBillModal').style.display = 'block';
}

function closeModalCreateBill() {
  document.getElementById('createBillModal').style.display = 'none';
}

function submitCreateBill() {
  const customerID = document.getElementById('inputCustomerName').value.trim();
  const subCustomerID = document.getElementById('subCustomerDropdown').value.trim();
  const saleDate = document.getElementById('inputDate').value;
  let discount = document.getElementById('inputDiscount').value;

  // ✅ ตรวจสอบค่าและแก้ไขรูปแบบให้ถูกต้อง
  if (!customerID) {
    alert('กรุณาเลือกชื่อลูกค้า');
    return;
  }

  if (!saleDate) {
    alert('กรุณาเลือกวันที่ขาย');
    return;
  }

  if (!discount) {
    discount = 0;
  } else {
    discount = parseFloat(discount);
    if (isNaN(discount)) {
      alert('กรุณากรอกส่วนลดให้ถูกต้อง');
      return;
    }
  }

  const saleData = {
    customerID,
    subCustomerID: subCustomerID ? subCustomerID : null, // ✅ ถ้าไม่ได้เลือก subCustomer ให้เป็น null
    saleDate: new Date(saleDate), // ✅ แปลงเป็น Date
    discount
  };

  console.log("🚀 Sending Sale Data:", saleData);

  fetch('/addSale', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(saleData),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => Promise.reject(err));
      }
      return response.json();
    })
    .then((data) => {
      alert('บิลได้ถูกสร้างเรียบร้อยแล้ว');
      closeModalCreateBill();
      location.reload();
    })
    .catch((error) => {
      console.error('❌ Error:', error);
      alert(`เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถสร้างบิลได้'}`);
    });
}


function updateSubCustomerNames() { //หน้าสร้างบิล
  const customerId = document.getElementById('inputCustomerName').value;
  const subCustomerSelect = document.getElementById('subCustomerDropdown');

  if (!subCustomerSelect) {
    console.error('Element with id "subCustomerDropdown" not found.');
    return;
  }

  subCustomerSelect.innerHTML = ''; // ล้าง dropdown
  subCustomerSelect.add(new Option('เลือกรายย่อย', '', true, true)); // เพิ่มตัวเลือกเริ่มต้น

  if (customerId) {
    fetch(`/getSubCustomers/${customerId}`)
      .then(response => response.json())
      .then(data => {
        if (data.subCustomerNames && data.subCustomerNames.length > 0) {
          subCustomerSelect.disabled = false;
          data.subCustomerNames.forEach(sub => {
            const option = new Option(sub.name, sub.id);
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

function getSubCustomerNames() { // หน้าแสดงรายการ
  const customerId = document.getElementById('customerDropdown').value;
  const subCustomerSelect = document.getElementById('subCustomerID');

  if (!subCustomerSelect) {
    console.error('Element with id "subCustomerID" not found.');
    return;
  }

  subCustomerSelect.innerHTML = ''; // ล้าง dropdown
  subCustomerSelect.add(new Option('เลือกรายย่อย', '', true, true));

  if (customerId) {
    fetch(`/getSubCustomers/${customerId}`)
      .then(response => response.json())
      .then(data => {
        if (data.subCustomerNames && data.subCustomerNames.length > 0) {
          subCustomerSelect.disabled = false;
          data.subCustomerNames.forEach(sub => {
            const option = new Option(sub.name, sub.id);
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
  const url = `/manageSaleEntry/${saleId}`;
  window.open(url, '_blank');
}

let currentPage = 1;
let totalSales = 0;
const pageSize = 10;

function loadSales(page = 1) {
  const customerID = document.getElementById('customerDropdown').value;
  const subCustomerSelect = document.getElementById('subCustomerID');

  if (!subCustomerSelect) {
    console.error('Element with id "subCustomerID" not found.');
    return;
  }

  const subCustomerID = subCustomerSelect.value;
  const dateStart = document.getElementById('inputDateStart').value;
  const dateEnd = document.getElementById('inputDateEnd').value;

  const query = new URLSearchParams({
    page,
    customerID,
    subCustomerID,
    dateStart,
    dateEnd,
  });
  console.log("ค่าที่ส่งไป : "+query)
  fetch(`/fetchSales?${query.toString()}`)
    .then(response => response.json())
    .then(data => {
      const tableBody = document.getElementById('salesTable').querySelector('tbody');
      tableBody.innerHTML = ''; // Clear table rows
      const indexOffset = (page - 1) * pageSize;
      console.log("ค่าที่รับกลับมา : ")
      console.log(data)
      const rowsHtml = data.sales.map((sale, index) => `
        <tr style="text-align: center;">
          <td>${indexOffset + index + 1}</td>
          <td>${new Date(sale.saleDate).toLocaleDateString('en-GB')}</td>
          <td>${sale.customerID.customerName}</td>
          <td>${sale.subCustomerID ? sale.subCustomerID.subCustomerName : '-'}</td>
          <td style="text-align: right;">${sale.totalAmount.toLocaleString()}</td>
          <td style="text-align: right;">${sale.discount}%</td>
          <td style="text-align: right;">${sale.totalSaleAfterDC.toLocaleString()}</td>
          <td>${sale.billStatus}</td>
          <td>
            <button class='btn btn-primary btn-sm' onclick='openFile("${sale._id}")'>เปิดไฟล์</button>
          </td>
        </tr>
      `).join('');

      tableBody.innerHTML = rowsHtml;
      renderPagination(data.totalSales, pageSize, page);
    })
    .catch(error => console.error('Error loading sales:', error));
}

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
    pageButton.style.marginLeft = '10px';
    pageButton.onclick = () => loadSales(page);
    paginationContainer.appendChild(pageButton);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const currentPath = window.location.pathname;

  if (currentPath === '/manageSale') {
    loadSales(currentPage);
  }
});

function deleteSale(deleteId) {
  if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?')) {
    fetch('/deleteSale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ delete_id: deleteId }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('ลบข้อมูลสำเร็จ');
          window.location.href = '/manageSale';
        } else {
          alert('ไม่สามารถลบใบขายได้ หากยังมีสินค้าอยู่ในรายการ');
        }
      })
      .catch(error => console.error('Error:', error));
  }
}

function submitEditSale() {
  setTimeout(() => {
    const saleIDElement = document.getElementById('saleID');
    const customerDropdownElement = document.getElementById('customerDropdown');
    const subCustomerDropdownElement = document.getElementById('subCustomerDropdown');
    const billStatusElement = document.getElementById('billStatus');
    const discountElement = document.getElementById('discount'); // ✅ เปลี่ยนจาก inputDiscount เป็น discount
    const saleDateElement = document.getElementById('saleDate'); // ✅ เปลี่ยนจาก inputDate เป็น saleDate

    console.log("✅ Checking Elements:", {
      saleIDElement,
      customerDropdownElement,
      subCustomerDropdownElement,
      billStatusElement,
      discountElement,
      saleDateElement
    });

    if (!saleIDElement || !customerDropdownElement || !billStatusElement || !discountElement || !saleDateElement) {
      alert('เกิดข้อผิดพลาด: ไม่พบ Element บางตัวใน DOM');
      return;
    }

    const saleID = saleIDElement.value;
    const customerID = customerDropdownElement.value;
    const subCustomerID = subCustomerDropdownElement ? subCustomerDropdownElement.value.trim() : null;
    const billStatus = billStatusElement.value;
    let discount = discountElement.value;
    const saleDate = saleDateElement.value;

    if (!saleID || !customerID) {
      alert('กรุณาเลือกชื่อลูกค้า');
      return;
    }

    if (!saleDate) {
      alert('กรุณาเลือกวันที่ขาย');
      return;
    }

    const saleData = {
      saleID,
      customerID,
      subCustomerID: subCustomerID ? subCustomerID : null,
      billStatus,
      discount: parseFloat(discount) || 0,
      saleDate: new Date(saleDate)
    };

    console.log("🚀 Sending Sale Data:", saleData);

    fetch('/updateSale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((err) => Promise.reject(err));
        }
        return response.json();
      })
      .then((data) => {
        alert('อัปเดตบิลสำเร็จ');
        window.location.href = `/manageSaleEntry/${saleID}`;
      })
      .catch((error) => {
        console.error('❌ Error:', error);
        alert(`เกิดข้อผิดพลาด: ${error.message || 'ไม่สามารถอัปเดตบิลได้'}`);
      });
  }, 100);
}


