function calculateTotal() {
    const costOfBatchBefore = parseFloat(document.getElementById('modal_costOfBatchBefore')?.value) || 0;
    const costOfBatchNew = parseFloat(document.getElementById('modal_costOfBatchNew')?.value) || 0;
    const costOfBatchLabor = parseFloat(document.getElementById('modal_costOfBatchLabor')?.value) || 0;
    const total = costOfBatchBefore + costOfBatchNew + costOfBatchLabor;
    document.getElementById('modal_costOfBatch').value = total.toFixed(2);
}

// ตรวจสอบ element ก่อนเพิ่ม event listener
const costBeforeElement = document.getElementById('modal_costOfBatchBefore');
const costNewElement = document.getElementById('modal_costOfBatchNew');
const costLaborElement = document.getElementById('modal_costOfBatchLabor');

if (costBeforeElement) costBeforeElement.addEventListener('input', calculateTotal);
if (costNewElement) costNewElement.addEventListener('input', calculateTotal);
if (costLaborElement) costLaborElement.addEventListener('input', calculateTotal);

function batchForm(batchYear,number,typeIDs) {
    var year = batchYear || document.getElementById('batchYear')?.value || '';
    var number = number || document.getElementById('number')?.value || '';
    var typeElement = document.getElementById('typeID');
    var type = typeElement ? typeElement.options[typeElement.selectedIndex]?.text : '';
    var typeID = typeIDs && typeIDs.length > 0 ? typeIDs : typeElement?.value;

    if (year && number && type) {
        var batchName = type + '-' + number + '-' + year;
        document.getElementById('batchName').value = batchName;
    }

    fetch(`/batchForm?batchYear=${year}&number=${number}&typeID=${typeElement?.value}`)
        .then(response => response.json())
        .then(data => {
            if (data.batchs) {
                createTable(data.batchs);
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}

function createTable(batchs) {
    var tableHTML = '';

    batchs.forEach((batch, index) => {
        const typeNames = batch.typeID.map(type => type.typeName).join(', ');

        tableHTML += '<tr>';
        tableHTML += `<td>${index + 1}</td>`;
        tableHTML += `<td>${batch.batchName}</td>`;
        tableHTML += `<td>${typeNames}</td>`;
        tableHTML += `<td>${batch.number}</td>`;
        tableHTML += `<td>${batch.batchYear}</td>`;
        tableHTML += `<td>${addCommas(batch.costOfBatch)}</td>`;
        tableHTML += `<td>${batch.costOfBatch > 0 ? 'มีทุน' : 'ไม่มีทุน'}</td>`;
        tableHTML += `<td>${addCommas(batch.costOfBatchBefore)}</td>`;
        tableHTML += `<td>${addCommas(batch.costOfBatchNew)}</td>`;
        tableHTML += `<td>${addCommas(batch.costOfBatchLabor)}</td>`;
        tableHTML += `<td>
            <button type="button" class="btn btn-primary btn-sm" onclick="openEditBatchModal('${batch._id}')">แก้ไข</button>
        </td>`;
        tableHTML += `<td>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteBatch('${batch._id}')">ลบ</button>
        </td>`;
        tableHTML += '</tr>';
    });

    document.getElementById('tableBatch').innerHTML = tableHTML;
}

function openEditBatchModal(batchID) {
    fetch(`/getBatchById?batchID=${batchID}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const batch = data.batch;
                document.getElementById('modal_edit_id').value = batch._id;
                document.getElementById('modal_batchYear').value = batch.batchYear;
                document.getElementById('modal_number').value = batch.number;
                document.getElementById('modal_batchName').value = batch.batchName;
                document.getElementById('modal_costOfBatch').value = batch.costOfBatch;
                document.getElementById('modal_costOfBatchBefore').value = batch.costOfBatchBefore;
                document.getElementById('modal_costOfBatchNew').value = batch.costOfBatchNew;
                document.getElementById('modal_costOfBatchLabor').value = batch.costOfBatchLabor;

                // ตั้งค่า checkbox ให้ถูกเลือกและตรวจสอบเงื่อนไข
                const typeCheckboxes = document.querySelectorAll('input[name="modal_typeID"]');
                const selectedTypeIDs = batch.typeID.map(type => type._id.toString());
                const originCode = batch.typeID[0]?.originID?.originCode; // ใช้ originCode ของ type แรกใน batch
                console.log('originCode:', originCode);
                typeCheckboxes.forEach(checkbox => {
                    const checkboxOriginCode = checkbox.dataset.originCode; // สมมติว่า originCode ถูกเก็บใน data-origin-code
                    checkbox.checked = selectedTypeIDs.includes(checkbox.value);
                    checkbox.disabled = checkboxOriginCode && checkboxOriginCode !== originCode; // disable เฉพาะเมื่อ originCode ไม่ตรงกัน
                });

                // ตรวจสอบว่า Bootstrap ถูกโหลดก่อนใช้งาน
                if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                    const editModal = new bootstrap.Modal(document.getElementById('editBatchModal'));
                    document.getElementById('editBatchModal').removeAttribute('aria-hidden');
                    editModal.show();
                } else {
                    console.error("Bootstrap Modal is not available. Make sure Bootstrap JS is loaded.");
                    alert("ไม่สามารถเปิด Modal ได้: Bootstrap ไม่ถูกโหลด");
                }
            } else {
                alert('ไม่พบข้อมูลชุด');
            }
        })
        .catch(error => console.error('Error:', error));
}



function submitEditBatch() {
    const edit_id = document.getElementById('modal_edit_id').value;
    const batchYear = document.getElementById('modal_batchYear').value;
    const number = document.getElementById('modal_number').value;

    // เก็บค่า checkbox ที่ถูกเลือก
    const typeCheckboxes = document.querySelectorAll('input[name="modal_typeID"]:checked');
    if (typeCheckboxes.length === 0) {
        alert('กรุณาเลือกประเภทอย่างน้อย 1 ค่า');
        return;
    }
    const typeIDs = Array.from(typeCheckboxes).map(cb => cb.value);

    const batchName = document.getElementById('modal_batchName').value;
    const costOfBatchBefore = document.getElementById('modal_costOfBatchBefore').value;
    const costOfBatchNew = document.getElementById('modal_costOfBatchNew').value;
    const costOfBatchLabor = document.getElementById('modal_costOfBatchLabor').value;

    // คำนวณต้นทุนรวม
    const costOfBatch = (
        parseFloat(costOfBatchBefore) +
        parseFloat(costOfBatchNew) +
        parseFloat(costOfBatchLabor)
    ).toFixed(2);

    // สร้างข้อมูลที่ต้องการส่งไปยัง API
    const data = {
        edit_id,
        batchYear,
        number,
        typeIDs,  // ส่ง array ของ typeIDs ที่เลือก
        batchName,
        costOfBatch,
        costOfBatchBefore,
        costOfBatchNew,
        costOfBatchLabor
    };

    fetch('/updateBatch', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('ข้อมูลถูกอัปเดตสำเร็จ!');
                alert('อัพเดทข้อมูลสำเร็จ');
                // window.location.href = `/manageBatch?batchYear=${data.batchYear}&number=${data.number}`;
                batchForm(batchYear,number,typeIDs);
            } else {
                console.error('เกิดข้อผิดพลาด:', data.message);
                alert('เกิดข้อผิดพลาด: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error fetching updateBatch:', error);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
        });
}


function addBatch() {
    var batchYear = document.getElementById('batchYear').value.trim();
    var number = document.getElementById('number').value.trim();
    var typeID = document.getElementById('typeID').value.trim();
    var batchName = document.getElementById('batchName').value.trim();
    var costOfBatchBefore = document.getElementById('costOfBatchBefore').value.trim();
    var costOfBatchNew = document.getElementById('costOfBatchNew').value.trim();
    var costOfBatchLabor = document.getElementById('costOfBatchLabor').value.trim();

    if (!batchYear || !number || !typeID || !batchName) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }

    const data = {
        batchYear,
        number,
        typeID,
        batchName,
        costOfBatchBefore,
        costOfBatchNew,
        costOfBatchLabor
    };

    fetch('/addBatch', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text); });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('เพิ่มสำเร็จ');
                batchForm();
            } else {
                alert('เกิดข้อผิดพลาด: ' + data.message);
            }
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาด:', error);
            alert('เกิดข้อผิดพลาด: ' + error.message);
        });
}

function deleteBatch(id) {
    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?')) {
        fetch('/deleteBatch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ delete_id: id })
        })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => { throw new Error(text); });
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert('ลบข้อมูลสำเร็จ');
                    batchForm();
                } else {
                    alert('เกิดข้อผิดพลาด: ' + data.message);
                }
            })
            .catch(error => {
                console.error('เกิดข้อผิดพลาด:', error);
                alert('เกิดข้อผิดพลาด: ' + error.message);
            });
    }
}
