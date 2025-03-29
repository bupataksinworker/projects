// --------------------------   สำหรับการทำงานของ toggle menu add saleEntry ----------------------------------
const topSection = document.querySelector('.top-section');
const toggleButton = document.querySelector('.toggle-top-section');

let isVisible = true; // ตัวแปรเพื่อติดตามสถานะการแสดงผล

toggleButton.addEventListener('click', () => {
  if (isVisible) {
    topSection.style.display = 'none';
    isVisible = false;
  } else {
    topSection.style.display = 'block';
    isVisible = true;
  }
});

function clickToggleButton() {
  const toggleButton = document.getElementById('btnToggle');
  if (toggleButton) {
    toggleButton.click();
  }
}

// ---------------------------------   สำหรับการทำงานของ popup Sharp ------------------------------------------------
document.getElementById('openCheckList').addEventListener('click', function () {
  document.getElementById('checkListPopup').style.display = 'block';
});

document.getElementById('closePopup').addEventListener('click', function () {
  var selectedShapes = [];
  document.querySelectorAll('input[name="shapeSelect[]"]:checked').forEach(function (checkbox) {
    selectedShapes.push(checkbox.value);
  });
  document.getElementById('selectedShapes').value = selectedShapes.join(', ');
  document.getElementById('checkListPopup').style.display = 'none';
});

// Icon Home 
document.getElementById('homeIcon').addEventListener('click', function () {
  window.location.href = '/manageSale';
});

//--------------------------------- สำหรับการทำงานของ menu dropdown ต่างๆ -----------------------------------------
function filterSizeAndBatch(typeID) {
  // ส่งค่า typeID ไปยัง router โดยใช้ Fetch API
  // console.log("saleEntryScript filterSizeAndBatch : " + typeID)
  filterProduct();
  if (typeID === '') {
    var sizeDropdownHTML = '<option value="">-- เลือกไซส์ --</option>';
    // var gradeDropdownHTML = '<option value="">-- เลือกเกรด --</option>';
    var batchDropdownHTML = '<option value="">-- เลือกชุด --</option>';
    $('#sizeSelect').html(sizeDropdownHTML);
    // $('#gradeSelect').html(gradeDropdownHTML);
    $('#batchSelect').html(batchDropdownHTML);
  } else {
    (async function fetchData() {
      try {
        // Fetch ข้อมูลสำหรับ size --------------------------------------------------------------
        const sizeResponse = await fetch(`/selectedType?typeID=${typeID}`);
        if (sizeResponse.ok) {
          const sizeData = await sizeResponse.json();
          const sizes = sizeData.sizes;

          // สร้าง HTML สำหรับ dropdown ของ size
          var sizeDropdownHTML = '<option value="">-- เลือกไซส์ --</option>';
          sizes.forEach(function (size) {
            sizeDropdownHTML += `<option value="${size._id}">${size.sizeName}</option>`;
          });
          $('#sizeSelect').html(sizeDropdownHTML);
        } else {
          console.error('Error fetching size data:', sizeResponse.statusText);
        }
    
        // Fetch ข้อมูลสำหรับ batch --------------------------------------------------------------
        const batchResponse = await fetch(`/batchForm?typeID=${typeID}`);
        if (batchResponse.ok) {
          const batchData = await batchResponse.json();
          const batchs = batchData.batchs;

          if (batchs.length === 0) {
            $('#batchSelect').html('<option value="">-- ไม่มีชุดที่ใช้ได้ --</option>');
            return;
          }

          // ✅ เรียง `batchs` ตาม `batchYear` มากไปน้อย และ `number` มากไปน้อย
          batchs.sort((a, b) => {
            if (b.batchYear !== a.batchYear) {
              return b.batchYear - a.batchYear; // ปีมาก่อน
            }
            return b.number - a.number; // sorter มากไปน้อย
          });

          // ✅ เลือก `batch` ล่าสุดโดยอัตโนมัติ
          const latestBatchID = batchs[0]._id;

          // ✅ สร้าง HTML สำหรับ dropdown
          var batchDropdownHTML = '<option value="">-- เลือกชุด --</option>';
          batchs.forEach(function (batch) {
            batchDropdownHTML += `<option value="${batch._id}" ${batch._id === latestBatchID ? 'selected' : ''}>${batch.batchName}</option>`;
          });

          $('#batchSelect').html(batchDropdownHTML);
        } else {
          console.error('Error fetching batch data:', batchResponse.statusText);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      }
    })();
  }
}

// async function filterProduct() {
//   resetFormCost();
//   var typeID = document.getElementById('typeSelect').value;
//   var sizeID = document.getElementById('sizeSelect').value;
//   // var gradeID = document.getElementById('gradeSelect').value;
//   // ส่งค่า typeID และ sizeID ไปยัง router โดยใช้ Fetch API
//   const productResponse = await fetch(`/selectedProduct?typeID=${typeID}&sizeID=${sizeID}`);
//   if (productResponse.ok) {
//     const productData = await productResponse.json();
//     const products = productData.products;

//     // สร้าง HTML สำหรับ dropdown ของ product
//     var productDropdownHTML = '<option value="">-- เลือกสินค้า --</option>';
//     products.forEach(function (product) {
//       productDropdownHTML += `<option value="${product._id}">${product.productName}</option>`;
//     });
//     $('#productSelect').html(productDropdownHTML);
//   } else {
//     console.error('Error fetching product data:', productResponse.statusText);
//   }
// }

async function filterProduct() {
  resetFormCost();
  var typeID = document.getElementById('typeSelect').value;
  var sizeID = document.getElementById('sizeSelect').value;

  const productResponse = await fetch(`/selectedProduct?typeID=${typeID}&sizeID=${sizeID}`);
  if (productResponse.ok) {
    const productData = await productResponse.json();
    const products = productData.products;

    // ✅ เรียง products ตามค่า product.gradeID.sorter จากน้อยไปมาก
    products.sort((a, b) => {
      const sorterA = a.gradeID ? a.gradeID.sorter : 0;
      const sorterB = b.gradeID ? b.gradeID.sorter : 0;
      return sorterA - sorterB; // เรียงจากน้อยไปมาก
    });

    // ✅ สร้าง dropdown product โดยเพิ่ม `data-gradeid`
    var productDropdownHTML = '<option value="">-- เลือกสินค้า --</option>';
    products.forEach(function (product) {
      productDropdownHTML += `
        <option value="${product._id}" data-gradeid="${product.gradeID ? product.gradeID._id : ''}">
          ${product.productName}
        </option>`;
    });
    $('#productSelect').html(productDropdownHTML);
  } else {
    console.error('Error fetching product data:', productResponse.statusText);
  }
}


async function filterCost() {
  var productID = document.getElementById('productSelect').value;

  const costResponse = await fetch('/getCost', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ productID: productID })
  });
  if (costResponse.ok) {
    const costData = await costResponse.json();
    const costs = costData.costs;

    // เรียงลำดับ costs ตาม sorter จากมากไปหาน้อย
    costs.sort((a, b) => b.sorter - a.sorter);

    // สร้าง HTML สำหรับ dropdown ของ cost
    var costDropdownHTML = '<option value="">-- เลือกราคาทุน --</option>';
    costs.forEach(function (cost, index) {
      // เลือกค่าเริ่มต้นเป็น cost ที่มีค่า sorter สูงสุด
      if (index === 0) {
        costDropdownHTML += `<option value="${cost.costOfProduct}" selected>${addCommas(cost.costOfProduct)}</option>`;
      } else {
        costDropdownHTML += `<option value="${cost.costOfProduct}">${addCommas(cost.costOfProduct)}</option>`;
      }
    });
    $('#costSelect').html(costDropdownHTML);
  } else {
    console.error('Error fetching cost data:', costResponse.statusText);
  }
}

function resetFormCost() {
  var costDropdownHTML = '<option value="">-- เลือกราคาทุน --</option>';
  $('#costSelect').html(costDropdownHTML);
}

async function addSaleEntry() {
  // ดึงค่า sharp ที่เลือก
  var sharpCheckboxes = document.querySelectorAll('input[name="shapeSelect[]"]:checked');
  var sharpValues = Array.from(sharpCheckboxes).map(function (checkbox) {
    return checkbox.value;
  });

  // ดึงค่าจากฟอร์ม
  const saleID = document.getElementById('saleID').value;
  const batchID = document.getElementById('batchSelect').value;
  const productID = document.getElementById('productSelect').value;
  const cost = document.getElementById('costSelect').value;
  let openWeight = document.getElementById('openWeight').value;
  let openPrice = document.getElementById('openPrice').value;
  let closeWeight = 0;
  let closePrice = openPrice;
  const note = document.getElementById('note').value;

  // ตรวจสอบฟิลด์ที่ต้องไม่เป็นค่าว่าง
  if (!saleID || !batchID || !productID || !cost || !openWeight || !openPrice) {
    alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    return;
  }

  // ตรวจสอบและแก้ไขค่าที่เป็นค่าลบ
  openWeight = openWeight < 0 ? 0 : openWeight;
  openPrice = openPrice < 0 ? 0 : openPrice;
  closeWeight = closeWeight < 0 ? 0 : closeWeight;
  closePrice = closePrice < 0 ? 0 : closePrice;

  // สร้าง formData object
  const formData = {
    saleID,
    batchID,
    productID,
    cost,
    sharp: sharpValues,
    note,
    openWeight,
    openPrice,
    closeWeight,
    closePrice
  };

  // ลบฟิลด์ที่ไม่มีค่าออกจาก formData (ยกเว้น note และ sharp)
  Object.keys(formData).forEach(key => {
    if (key !== 'note' && key !== 'sharp' && (formData[key] === '' || (Array.isArray(formData[key]) && formData[key].length === 0))) {
      delete formData[key];
    }
  });

  try {
    console.log(formData);
    const entryResponse = await fetch('/addSaleEntry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (entryResponse.ok) {
      const entryData = await entryResponse.json();

      // ✅ รีเซ็ตค่า input ให้กลับไปเป็นค่าเริ่มต้น
      document.getElementById('openWeight').value = '';
      document.getElementById('openPrice').value = '';
      document.getElementById('note').value = '';
      document.getElementById('selectedShapes').value = '';
      document.getElementsByName('shapeSelect[]').value = '';

      // ✅ เคลียร์ checkbox รูปร่างที่เลือก
      document.querySelectorAll('input[name="shapeSelect[]"]:checked').forEach(checkbox => checkbox.checked = false);

      updateTable();
      document.getElementById('footer').scrollIntoView();
    } else {
      const errorData = await entryResponse.json();
      console.error('Error fetching entry data:', errorData.error);
      alert('Failed to add entry: ' + errorData.error);
    }
  } catch (error) {
    console.error('Network error or server is down:', error);
    alert('Failed to add entry: Network error or server is down.');
  }
}

// --------------------------------------------- UPDATE TABLE ------------------------------------//
function updateTable() {
  const saleID = document.getElementById('saleID').value;
  fetch('/api/saleEntries/' + saleID)
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(entries => {
      const table = document.getElementById('salesEntryTableBody');
      table.innerHTML = '';  // Clear the existing table
      entries.forEach((entry, index) => {
        const statusClass = entry.entryStatus === 'N' ? 'red' : (entry.entryStatus === 'C' ? 'yellow' : 'green');
        const isDisabled = entry.entryStatus === 'Y' || entry.entryStatus === 'C' ? 'disabled' : '';

        const closeWeightValue = entry.entryStatus === 'N' && entry.closeWeight === 0 ? 0 : entry.closeWeight;
        const closeWeightTd = entry.entryStatus === 'N'
          ? `<td class="setNumber text-danger"><input id="closeWeight-${entry._id}" style="padding: 0px;" class="setNumber form-control" aria-label="Small" type="number" value="${closeWeightValue}" onfocus="selectInput(this)" onblur="updateTotalSale(this, '${entry._id}', 'closeWeight', ${index})"></td>`
          : `<td class="setNumber text-danger">${addCommas(entry.closeWeight)}</td>`;

        const closePriceValue = entry.entryStatus === 'N' && entry.closePrice === 0 ? entry.openPrice : entry.closePrice;
        const closePriceTd = entry.entryStatus === 'N'
          ? `<td class="setNumber text-danger"><input id="closePrice-${entry._id}" style="padding: 0px;" class="setNumber form-control" aria-label="Small" type="number" value="${closePriceValue}" data-open-price="${entry.openPrice}" onfocus="selectInput(this)" onblur="updateTotalSale(this, '${entry._id}', 'closePrice', ${index})"></td>`
          : `<td class="setNumber text-danger">${addCommas(entry.closePrice)}</td>`;

        const totalSaleTd = entry.entryStatus === 'N'
          ? `<td class="setNumber text-danger" id="totalSale-${entry._id}">${addCommas(entry.closeWeight * entry.closePrice)}</td>`
          : `<td class="setNumber text-danger">${addCommas(entry.totalSale)}</td>`;

        const row = `
            <tr>
              <td>${index + 1}</td>
              <td class="setText wrap" style="white-space: nowrap;overflow: hidden;text-overflow: ellipsis;max-width: auto;" 
                  title="${entry.productID.ber} ${entry.productID.productName} ${entry.sharp}">
                  ${entry.productID.ber} ${entry.productID.productName} ${entry.sharp}</td>
              <td class="setText wrap">${entry.displayName}</td>
              <td class="setText">${entry.batchID.batchName}</td>
              <td class="setNumber">${addCommas(entry.cost)}</td>
              <td class="setNumber text-success">
              <input id="openWeight-${entry._id}" style="border: none; background: transparent; padding: 0px;" class="setNumber form-control" aria-label="Small" type="text" value="${addCommas(entry.openWeight)}" readonly>
</td>
              <td class="setNumber text-success">${addCommas(entry.openPrice)}</td>
              <td class="setNumber text-success">${addCommas(entry.totalPreSale)}</td>
              ${closeWeightTd}
              ${closePriceTd}
              ${totalSaleTd}
              <td>
                <button class="entry-status-button ${statusClass}" title="Y สิ้นสุด N รอจัดการ C คืนสินค้า">
                  ${entry.entryStatus}
                </button>
                ${entry.note
            ? `<button class="entry-status-button gray" title="หมายเหตุ: ${entry.note}" onclick="showNotePopup('${entry.note}')" ${entry.note === ' ' ? 'hidden' : ''}>T</button>`
            : ''
          }
              </td>
              <td>
                <button class="btn-saleEntry btn ${entry.entryStatus === 'N' ? 'btn-success' : 'btn-light'} btn-sm" onclick="okSaleEntry('${entry._id}')" ${entry.entryStatus === 'N' ? '' : 'hidden'}>ตกลง</button>
                <button class="btn-saleEntry btn ${entry.entryStatus === 'C' ? 'btn-light' : (entry.entryStatus === 'Y' ? 'btn-warning' : 'btn-light')} btn-sm" onclick="cancelSaleEntry('${entry._id}')" ${entry.entryStatus === 'N' ? 'hidden' : ''} ${entry.entryStatus === 'C' ? 'disabled' : ''}>คืน</button>
                <form id="editSaleEntryForm" action="/editSaleEntry" method="POST" style="display: inline">
                    <input type="hidden" name="edit_id1" id="edit_id1" value="${entry._id}">
                    <button type="submit" class="btn ${entry.entryStatus === 'C' ? 'btn-light' : 'btn-primary'} btn-sm" ${entry.entryStatus === 'C' ? 'disabled' : ''}>แก้ไข</button>
                </form>
                <button class="btn btn-danger btn-sm" onclick="deleteSaleEntry('${entry._id}')">ลบ</button>
              </td>
            </tr>`;

        table.innerHTML += row;

        // Disable increasePercen and decreasePercen buttons if entryStatus is 'Y' or 'C'
        if (entry.entryStatus === 'Y' || entry.entryStatus === 'C') {
          document.getElementById('increasePercen').disabled = true;
          document.getElementById('decreasePercen').disabled = true;
        }
      });
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data: ' + error.message);
    });
  updateTableFoot();
  updateTableBatch();
}

function selectInput(input) {
  input.select();
}

function updateTotalSale(input, id, field, index) {
  const value = parseFloat(input.value);
  const totalSaleElement = document.getElementById(`totalSale-${id}`);

  const closeWeightInput = document.querySelector(`#closeWeight-${id}`);
  const closePriceInput = document.querySelector(`#closePrice-${id}`);

  if (closeWeightInput && closePriceInput && totalSaleElement) {
    const closeWeight = parseFloat(closeWeightInput.value);
    const closePrice = parseFloat(closePriceInput.value);
    const totalSale = closeWeight * closePrice;
    totalSaleElement.innerText = addCommas(totalSale);
  }

  fetch(`/api/inputSaleEntries/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ [field]: value })
  })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      updateTable();
      return response.json();
    })
    .then(data => {
      console.log('Data saved:', data);
    })
    .catch(error => {
      console.error('Error saving data:', error);
      alert('Failed to save data: ' + error.message);
    });
}



// --------------------------------------------- UPDATE TABLE -----------------------------------//

function updateTableFoot() {
  const saleID = document.getElementById('saleID').value;
  fetch('/api/saleResult/' + saleID)
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      const { sale, totalValues } = data;
      const table = document.getElementById('tableFootResult');
      table.innerHTML = '';  // Clear the existing table

      const openRow = `
        <tbody>
          <tr class="form-control btn btn-outline-success">
            <td>เปิด</td>
            <td>รวมขายได้ : ${addCommas(totalValues.totalPreSaleSum)} บาท
            <input type="hidden"  id="totalPreSaleSum" value="${totalValues.totalPreSaleSum}"></td>
            <td>หัก ${sale.discount}% เหลือ : ${addCommas(totalValues.totalPreSaleAfterDC)} บาท</td>
            <td>ต้นทุน : ${addCommas(totalValues.totalPreSaleCost)} บาท</td>
            <td>กำไร : ${addCommas(totalValues.totalPreSaleProfit)} บาท</td>
          </tr>
          <tr class="form-control btn btn-outline-danger">
            <td>ปิด</td>
            <td>รวมขายได้ : ${addCommas(totalValues.totalSaleSum)} บาท</td>
            <td>หัก ${sale.discount}% เหลือ : ${addCommas(totalValues.totalSaleAfterDC)} บาท</td>
            <td>ต้นทุน : ${addCommas(totalValues.totalSaleCost)} บาท</td>
            <td>กำไร : ${addCommas(totalValues.totalSaleProfit)} บาท</td>
          </tr>
        </tbody>`;

      table.innerHTML += openRow;  // Add new rows to the table
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data: ' + error.message);
    });
}

function updateTableBatch() {
  const saleID = document.getElementById('saleID').value;
  fetch('/api/saleResult/' + saleID)
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      const { sale, totalValues } = data;
      const table = document.getElementById('tableBatchResult');
      table.innerHTML = ''; // Clear the existing table
      table.innerHTML += `
          <thead class="thead-light">
          <tr>
            <th rowspan="2" style="vertical-align: middle; text-align: center;background-color: #f0f0f0;">ชุด</th>
            <th colspan="4" class="bg-success text-white">เปิด</th>
            <th colspan="4" class="bg-danger text-white">ปิด</th>
          </tr>
          <tr>
            <th>รวมขายได้(บาท)</th>
            <th>หัก ${sale.discount} % เหลือ(บาท)</th>
            <th>ต้นทุน(บาท)</th>
            <th>กำไร(บาท)</th>
            <th>รวมขายได้(บาท)</th>
            <th>หัก ${sale.discount} % เหลือ(บาท)</th>
            <th>ต้นทุน(บาท)</th>
            <th>กำไร(บาท)</th>
          </tr>
        </thead>
        <tbody>
        `;
      totalValues.getTotalSumByBatch.forEach(batch => {
        const openRow = `
          <tr>
            <td style="background-color: #f0f0f0;">${batch.batchName}</td>
            <td>${addCommas(batch.totalPreSumByBatch)}</td>
            <td>${addCommas(batch.totalPreAfterDcByBatch)}</td>
            <td>${addCommas(batch.totalPreCostByBatch)}</td>
            <td>${addCommas(batch.totalPreProfitByBatch)}</td>
            <td>${addCommas(batch.totalSumByBatch)}</td>
            <td>${addCommas(batch.totalAfterDcByBatch)}</td>
            <td>${addCommas(batch.totalCostByBatch)}</td>
            <td>${addCommas(batch.totalProfitByBatch)}</td>
          </tr>`;
        table.innerHTML += openRow; // Add new rows to the table
      });

      const endRow = `
        <tr>
          <td style="background-color: #f0f0f0;">รวม</td>
          <td>${addCommas(totalValues.totalPreSaleSum)}</td>
          <td>${addCommas(totalValues.totalPreSaleAfterDC)}</td>
          <td>${addCommas(totalValues.totalPreSaleCost)}</td>
          <td>${addCommas(totalValues.totalPreSaleProfit)}</td>
          <td>${addCommas(totalValues.totalSaleSum)}</td>
          <td>${addCommas(totalValues.totalSaleAfterDC)}</td>
          <td>${addCommas(totalValues.totalSaleCost)}</td>
          <td>${addCommas(totalValues.totalSaleProfit)}</td>
        </tr>
      `;
      table.innerHTML += endRow; // Add the summary row at the end
      table.innerHTML += `</tbody>`;
    })
    .catch(error => {
      console.error('Error fetching data:', error);
      alert('Failed to fetch data: ' + error.message);
    });
}

function showNotePopup(note) {
  alert(`หมายเหตุ: ${note}`);
}

window.onload = function () {
  updateTable();
  closeFunction();
};

// ---------------------------------   สำหรับการทำงานของ updateSaleEntry จากหน้า editSaleEntry ------------------------------------------------
async function updateSaleEntry() {
  // ดึงค่า sharp ที่เลือก
  const sharpCheckboxes = document.querySelectorAll('input[name="shapeSelectEdit[]"]:checked');
  const sharpValues = Array.from(sharpCheckboxes).map(cb => cb.value);

  // ดึงค่าจากฟอร์ม
  const saleEntryID = document.getElementById('saleEntryID').value;
  const batchID = document.getElementById('batchSelect').value;
  const productID = document.getElementById('productSelect').value;
  const cost = document.getElementById('costSelect').value;
  let openWeight = document.getElementById('openWeight').value;
  let openPrice = document.getElementById('openPrice').value;
  let closeWeight = document.getElementById('closeWeight').value || 0;
  let closePrice = document.getElementById('closePrice').value || 0;
  const note = document.getElementById('note').value;
  const displayName = document.getElementById('displayName').value;

  // ตรวจสอบฟิลด์ที่ต้องไม่เป็นค่าว่าง
  if (!saleEntryID || !batchID || !productID || !cost || !openWeight || !openPrice || !displayName) {
    alert('กรุณากรอกข้อมูลให้ครบถ้วน');
    return;
  }

  // ตรวจสอบและแก้ไขค่าที่เป็นค่าลบ
  openWeight = openWeight < 0 ? 0 : openWeight;
  openPrice = openPrice < 0 ? 0 : openPrice;
  closeWeight = closeWeight < 0 ? 0 : closeWeight;
  closePrice = closePrice < 0 ? 0 : closePrice;

  // สร้าง formData object
  const formData = {
    saleEntryID,
    batchID,
    productID,
    cost,
    sharp: sharpValues,
    note,
    openWeight,
    openPrice,
    closeWeight,
    closePrice,
    displayName
  };

  // ดึงค่า saleID เพื่อใช้ใน URL
  const saleID = document.getElementById('saleID').value;
  console.log(saleID);

  // ลบฟิลด์ที่ไม่มีค่าออกจาก formData (ยกเว้น note และ sharp)
  Object.keys(formData).forEach(key => {
    if (key !== 'note' && key !== 'sharp' && (formData[key] === '' || (Array.isArray(formData[key]) && formData[key].length === 0))) {
      delete formData[key];
    }
  });

  try {
    const response = await fetch('/updateSaleEntry', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      const result = await response.json();
      alert('ข้อมูลถูกอัพเดทเรียบร้อยแล้ว');
      window.location.href = '/manageSaleEntry/' + saleID;
    } else {
      const error = await response.json();
      console.error('Error:', error); // แสดงข้อผิดพลาดใน console
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  } catch (error) {
    console.error('Error:', error); // แสดงข้อผิดพลาดใน console
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
  }
}

async function filterBatch() {
  const typeID = document.getElementById('typeID').value;
  const batchID = document.getElementById('batchID').value;
  const batchResponse = await fetch(`/batchForm?typeID=${typeID}`);

  if (batchResponse.ok) {
    const batchData = await batchResponse.json();
    const batchs = batchData.batchs;

    // สร้าง HTML สำหรับ dropdown ของ batch
    var batchDropdownHTML = '<option value="">-- เลือกชุด --</option>';
    batchs.forEach(function (batch) {
      batchDropdownHTML += `<option value="${batch._id}" ${batch._id === batchID ? 'selected' : ''}>${batch.batchName}</option>`;
    });
    $('#batchSelect').html(batchDropdownHTML);
  } else {
    console.error('Error fetching batch data:', batchResponse.statusText);
  }
}
// ---------------------------------   สำหรับการทำงานของ deleteSaleEntry ------------------------------------------------

async function deleteSaleEntry(id) {
  if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?')) {

    try {
      const response = await fetch(`/deleteSaleEntry/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // alert('ข้อมูลถูกลบเรียบร้อยแล้ว');
        // ทำการอัพเดทหน้าเว็บ หรือรีเฟรชรายการ
        // location.reload(); // ตัวอย่างการรีเฟรชหน้าเว็บ
        updateTable();

      } else {
        const error = await response.json();
        console.error('Error:', error); // แสดงข้อผิดพลาดใน console
        alert('เกิดข้อผิดพลาด: ' + error.message);
      }
    } catch (error) {
      console.error('Error:', error); // แสดงข้อผิดพลาดใน console
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    }
  }
}

// ---------------------------------   สำหรับการทำงานของ okSaleEntry ------------------------------------------------
async function okSaleEntry(id) {
  let openWeight = parseFloat(document.querySelector(`#openWeight-${id}`).value);
  let closeWeight = parseFloat(document.querySelector(`#closeWeight-${id}`).value);
  let closePrice = parseFloat(document.querySelector(`#closePrice-${id}`).value);

  if (closeWeight === 0) {
    closeWeight = openWeight;
  }

  try {
    const response = await fetch(`/okSaleEntry/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ closeWeight, closePrice })
    });

    if (response.ok) {
      const result = await response.json();
      // alert('อัพเดทสำเร็จ');
      // ทำการอัพเดทหน้าเว็บ หรือรีเฟรชรายการ
      // location.reload(); // ตัวอย่างการรีเฟรชหน้าเว็บ
      updateTable();
    } else {
      const error = await response.json();
      console.error('Error:', error); // แสดงข้อผิดพลาดใน console
      alert('เกิดข้อผิดพลาด: ' + error.message + ' โปรดใช้ปุ่มแก้ไข');
    }
  } catch (error) {
    console.error('Error:', error); // แสดงข้อผิดพลาดใน console
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
  }
}

async function okAllSaleEntry(saleID) {
  if (confirm('ยืนยันใช้ ตกลงทั้งหมด ในใบขายนี้?')) {
    try {
      // ตรวจสอบว่ามี entry ที่มี entryStatus เป็น Y หรือไม่
      const entries = document.querySelectorAll('#tableSaleEntry .btn-saleEntry');
      for (const entry of entries) {
        const onclickAttr = entry.getAttribute('onclick');
        if (onclickAttr) {
          const match = onclickAttr.match(/okSaleEntry\('(.+?)'\)/);
          if (match && match[1]) {
            const entryID = match[1];
            const entryStatus = await getEntryStatus(entryID);
            if (entryStatus === 'Y') {
              alert('มีรายการที่มีสถานะเป็น Y จะไม่สามารถใช้ฟังก์ชั่นนี้ได้');
              return;
            }
          } else {
            console.error('Error: Cannot extract entryID from onclick attribute');
            continue;
          }
        } else {
          console.error('Error: Missing onclick attribute');
        }
      }

      // ค้นหาปุ่มทั้งหมดในตารางที่มีสถานะเป็น N
      const buttons = document.querySelectorAll('#tableSaleEntry .btn-saleEntry.btn-success');
      if (buttons.length === 0) {
        alert('ไม่มีรายการที่สามารถใช้ฟังก์ชั่นนี้ได้');
        return;
      }

      for (const button of buttons) {
        const onclickAttr = button.getAttribute('onclick');
        if (onclickAttr) {
          const match = onclickAttr.match(/okSaleEntry\('(.+?)'\)/);
          if (match && match[1]) {
            const entryID = match[1];
            await okSaleEntry(entryID);
          } else {
            console.error('Error: Cannot extract entryID from onclick attribute');
          }
        } else {
          console.error('Error: Missing onclick attribute');
        }
      }

      // อัพเดทตารางหลังจากทำการอัพเดททั้งหมด
      updateTable();

    } catch (error) {
      console.error('Error:', error); // แสดงข้อผิดพลาดใน console
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    }
  }
}


// ฟังก์ชั่นสำหรับดึงสถานะ entry จากเซิร์ฟเวอร์
async function getEntryStatus(entryID) {
  try {
    const response = await fetch(`/getEntryStatus/${entryID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      return result.entryStatus;
    } else {
      const error = await response.json();
      console.error('Error:', error);
      alert('เกิดข้อผิดพลาดในการดึงสถานะ: ' + error.message);
      return null;
    }
  } catch (error) {
    console.error('Error:', error);
    alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    return null;
  }
}

async function cancelSaleEntry(id) {
  if (confirm('ยืนยันการคืนสินค้า?')) {
    try {
      const response = await fetch(`/cancelSaleEntry/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        // alert('อัพเดทสำเร็จ');
        // ทำการอัพเดทหน้าเว็บ หรือรีเฟรชรายการ
        // location.reload(); // ตัวอย่างการรีเฟรชหน้าเว็บ
        updateTable();
      } else {
        const error = await response.json();
        console.error('Error:', error); // แสดงข้อผิดพลาดใน console
        alert('เกิดข้อผิดพลาด: ' + error.message);
      }
    } catch (error) {
      console.error('Error:', error); // แสดงข้อผิดพลาดใน console
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
    }
  }
}

// ---------------------- ฟังก์ชั่นสำหรับปิดบิล คือไม่มีการแก้ไขอะไรในบิลนี้แล้ว -------------------------
function closeBill(id) {
  if (confirm('ยืนยันการ ปิดบิล จะไม่สามารถแก้ไขได้อีก ?')) {

    var className = "onProcess";
    let elements = document.getElementsByClassName(className);
    for (let i = 0; i < elements.length; i++) {
      elements[i].disabled = true;
    }

    // Send the request to the server
    fetch('/closeBill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id: id })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('Bill closed successfully');
          // Hide the top section
          // const topSection = document.querySelector('.top-section');
          // if (topSection) {
          //   topSection.style.display = 'none';
          // }
          location.reload();
        } else {
          console.error('Failed to close bill');
        }
      })
      .catch(error => console.error('Error:', error));
  }
}

function closeFunction() {
  var billStatus = document.getElementById('billStatus').value;
  if (billStatus == "เปิด") {
    return;
  } else {
    var className = "onProcess";
    let elements = document.getElementsByClassName(className);
    for (let i = 0; i < elements.length; i++) {
      elements[i].disabled = true;
    }
    const topSection = document.querySelector('.top-section');
    if (topSection) {
      topSection.style.display = 'none';
    }
  }

}

document.addEventListener('DOMContentLoaded', (event) => {
  var tableFootResult = document.getElementById('tableFootResult');
  var popupBatchResultTable = document.getElementById('popupBatchResultTable');
  var closeBtn = document.getElementById('closeBtn');

  tableFootResult.onclick = function () {
    popupBatchResultTable.style.display = 'block';
  }

  closeBtn.onclick = function () {
    popupBatchResultTable.style.display = 'none';
  }

  window.onclick = function (event) {
    if (event.target == popupBatchResultTable) {
      popupBatchResultTable.style.display = 'none';
    }
  }
});

// ----------------------------- เพิ่ม ลด ส่วนลดเงินสด เป็น % ----------------------
function changePercen(num, saleID) {
  var inputPercen = parseFloat(document.getElementById('inputPercen').value); // รับค่าเป็นเลข
  var totalPreSaleSum = parseFloat(document.getElementById('totalPreSaleSum').value); // ผลลัพพ์เริ่มต้น

  if (isNaN(inputPercen) || isNaN(totalPreSaleSum)) {
    alert('กรุณากรอกตัวเลขที่ถูกต้อง');
    return;
  }

  var finalSum;
  if (num == 1) {
    // เพิ่มผลลัพพ์ทั้งหมดอีกเป็น %
    finalSum = totalPreSaleSum * (1 + inputPercen / 100);
    alert('เพิ่มราคาปิด ' + inputPercen + '% ยอดขายได้ : ' + addCommas(finalSum)); // แสดงผลลัพธ์ที่ได้เป็น popup
    changeClosePrice(num, inputPercen, saleID);
  } else if (num == 2) {
    // ลดผลลัพพ์ทั้งหมดอีกเป็น %
    finalSum = totalPreSaleSum * (1 - inputPercen / 100);
    alert('ลดราคาปิด ' + inputPercen + '% ยอดขายได้ : ' + addCommas(finalSum)); // แสดงผลลัพธ์ที่ได้เป็น popup
    changeClosePrice(num, inputPercen, saleID);
  }
}

function changeClosePrice(num, percen, saleID) {
  fetch('/api/changeClosePrice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      num,
      percen,
      saleID,
    }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.message === 'Update successful') {
        alert('Update successful');

        // Update the input fields with the new closePrice values
        data.updatedEntries.forEach(entry => {
          const closePriceInput = document.querySelector(`#closePrice-${entry._id}`);
          const closeWeightInput = document.querySelector(`#closeWeight-${entry._id}`);
          const totalSaleElement = document.getElementById(`totalSale-${entry._id}`);

          if (closePriceInput) {
            closePriceInput.value = entry.closePrice.toFixed(2);
          }

          if (closeWeightInput && totalSaleElement) {
            const closeWeight = parseFloat(closeWeightInput.value);
            const totalSale = closeWeight * entry.closePrice;
            totalSaleElement.innerText = addCommas(totalSale);
          }
        });
      } else {
        alert('Update failed: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('An error occurred: ' + error.message);
    });
}

//---------------------------- printing ----------------------------------------
document.getElementById('openPrintPopup').addEventListener('click', function () {
  document.getElementById('printPopup').style.display = 'block';
  document.getElementById('printOverlay').style.display = 'block';
});

document.getElementById('closePrintPopup').addEventListener('click', function () {
  document.getElementById('printPopup').style.display = 'none';
  document.getElementById('printOverlay').style.display = 'none';
});

document.getElementById('printOverlay').addEventListener('click', function () {
  document.getElementById('printPopup').style.display = 'none';
  document.getElementById('printOverlay').style.display = 'none';
});

function openWithParams(id, code, element) {
  const pElement = element.querySelector('span'); // ดึงค่าใน <p> ภายใน <td>
  const textContent = pElement ? pElement.textContent.trim() : '';
  const extraParam = encodeURIComponent(textContent); // แปลงข้อความเป็น URL-encoded

  // ตรวจสอบค่า code และกำหนด URL ที่ถูกต้อง
  const url = (code >= 1 && code <= 6)
    ? `/printing/${id}?extraParam=${extraParam}&code=${code}`
    : `/printingSize/${id}?extraParam=${extraParam}&code=${code}`;

  window.open(url, '_blank');
}

async function filterCostEdit(costEdit) {
  console.log(costEdit)
  var productID = document.getElementById('productSelect').value;
  const costResponse = await fetch('/getCost', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ productID: productID })
  });
  if (costResponse.ok) {
    const costData = await costResponse.json();
    const costs = costData.costs;

    // เรียงลำดับ costs ตาม sorter จากมากไปหาน้อย
    costs.sort((a, b) => b.sorter - a.sorter);

    // สร้าง HTML สำหรับ dropdown ของ cost
    var costDropdownHTML = '';
    costs.forEach(function (cost) {
      console.log(cost.costOfProduct);
      // เปรียบเทียบด้วยการแปลงค่าทั้งสองเป็น string
      if (String(cost.costOfProduct) === String(costEdit)) {
        costDropdownHTML += `<option value="${cost.costOfProduct}" selected>${addCommas(cost.costOfProduct)}</option>`;
      } else {
        costDropdownHTML += `<option value="${cost.costOfProduct}">${addCommas(cost.costOfProduct)}</option>`;
      }
    });
    $('#costSelect').html(costDropdownHTML);
  } else {
    console.error('Error fetching cost data:', costResponse.statusText);
  }
}

