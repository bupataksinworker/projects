function calculateTotal() {
    const costOfBatchBefore = parseFloat(document.getElementById('costOfBatchBefore').value) || 0;
    const costOfBatchNew = parseFloat(document.getElementById('costOfBatchNew').value) || 0;
    const costOfBatchLabor = parseFloat(document.getElementById('costOfBatchLabor').value) || 0;
    const total = costOfBatchBefore + costOfBatchNew + costOfBatchLabor;
    document.getElementById('costOfBatch').value = total.toFixed(2);
}

document.getElementById('costOfBatchBefore').addEventListener('input', calculateTotal);
document.getElementById('costOfBatchNew').addEventListener('input', calculateTotal);
document.getElementById('costOfBatchLabor').addEventListener('input', calculateTotal);

function batchForm() {
    // รับค่าจาก dropdown ที่เลือก
    var year = document.getElementById('batchYear').value;
    var number = document.getElementById('number').value;
    var typeElement = document.getElementById('typeID');
    var type = typeElement.options[typeElement.selectedIndex].text; // ใช้ .text เพื่อรับข้อความจากตัวเลือกที่ถูกเลือก
    console.log(typeElement.value)
    // สร้างชื่อชุดตามรูปแบบ valueType-Num-Year
    if (year && number && type) {
        var batchName = type + '-' + number + '-' + year;
        document.getElementById('batchName').value = batchName; // อัปเดตค่าในฟิลด์ input สำหรับชื่อชุด
    }

    fetch(`/batchForm?batchYear=${year}&number=${number}&typeID=${typeElement.value}`)
        .then(response => response.json())
        .then(data => {
            if (data.batchs) {
                createTable(data.batchs);
            }
        })
        .catch(error => console.error('Error fetching data:', error));
}

function createTable(batchs) {
    var tableHTML = ''; // สตริงเริ่มต้นสำหรับ HTML

    batchs.forEach((batch, index) => {
        // สร้างสตริงของชื่อประเภททั้งหมด
        const typeNames = batch.typeID.map(type => type.typeName).join(', ');

        tableHTML += '<tr>';
        tableHTML += '<td title="'+batch._id+'">' + (index + 1) + '</td>';
        tableHTML += '<td class="no-wrap">' + batch.batchName + '</td>';
        tableHTML += '<td>' + typeNames + '</td>';
        tableHTML += '<td>' + batch.number + '</td>';
        tableHTML += '<td>' + batch.batchYear + '</td>';
        tableHTML += '<td>' + addCommas(batch.costOfBatch) + '</td>';
        if(batch.costOfBatch > 0){
            tableHTML += '<td> มีทุน </td>'; // สถานะทุน
        }else{
            tableHTML += '<td> ไม่มีทุน </td>'; // สถานะทุน
        }
        tableHTML += '<td>' + addCommas(batch.costOfBatchBefore) + '</td>'; // ทุนชุดก่อนหน้ายกมารวม
        tableHTML += '<td>' + addCommas(batch.costOfBatchNew) + '</td>'; // ทุนของใหม่
        tableHTML += '<td>' + addCommas(batch.costOfBatchLabor) + '</td>'; // รวมทุนทั้งหมดของชุด
        tableHTML += '<td>' +
            '<form id="editForm" action="/editBatch" method="POST">' +
            '<input type="hidden" name="edit_id" id="edit_id" value="' + batch._id + '">' +
            '<button type="submit" class="btn btn-primary btn-sm">แก้ไข</button>' +
            '</form>' +
            '</td>';
        tableHTML += `<td>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteBatch('${batch._id}')">
                ลบ
            </button>
        </td>`;
        tableHTML += '</tr>';
    });

    // อัพเดต HTML ของตาราง
    var tableElement = document.getElementById('tableBatch');
    tableElement.innerHTML = tableHTML;
}

function addBatch() {
    var batchYear = document.getElementById('batchYear').value.trim();
    var number = document.getElementById('number').value.trim();
    var typeID = document.getElementById('typeID').value.trim();
    var batchName = document.getElementById('batchName').value.trim();
    var costOfBatchBefore = document.getElementById('costOfBatchBefore').value.trim();
    var costOfBatchNew = document.getElementById('costOfBatchNew').value.trim();
    var costOfBatchLabor = document.getElementById('costOfBatchLabor').value.trim();

    // ตรวจสอบค่าว่าง
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

function updateBatch() {
    var edit_id = document.getElementById('edit_id').value;
    var batchYear = document.getElementById('batchYear').value;
    var number = document.getElementById('number').value;
    var typeCheckboxes = document.querySelectorAll('input[name="typeID"]:checked');
    var typeIDs = Array.from(typeCheckboxes).map(cb => cb.value);
    var batchName = document.getElementById('batchName').value;

    var costOfBatch = document.getElementById('costOfBatch').value;
    var costOfBatchBefore = document.getElementById('costOfBatchBefore').value;
    var costOfBatchNew = document.getElementById('costOfBatchNew').value;
    var costOfBatchLabor = document.getElementById('costOfBatchLabor').value;


    const data = {
        edit_id,
        batchYear,
        number,
        typeIDs,
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
        .then(response => response.json()) // รับ JSON response
        .then(data => {
            if (data.success) {
                console.log('ข้อมูลถูกอัปเดตสำเร็จ!');
                window.location.href = '/manageBatch?batchYear=' + data.batchYear + '&number=' + data.number + '&typeIDs=' + data.typeIDs;
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

// รับพารามิเตอร์กลับมาจากหน้า edit 
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
        const urlParams = new URLSearchParams(window.location.search);
        const batchYear = urlParams.get('batchYear');
        const number = urlParams.get('number');
        const typeIDs = urlParams.get('typeIDs') ? urlParams.get('typeIDs').split(',') : [];
        const selectedTypeID = typeIDs.length > 0 ? typeIDs[0] : '';

        // ตั้งค่าค่าเริ่มต้นให้กับ dropdown batchYear
        const batchYearDropdown = document.getElementById('batchYear');
        if (batchYearDropdown) {
            for (let i = 0; i < batchYearDropdown.options.length; i++) {
                if (batchYearDropdown.options[i].value === batchYear) {
                    batchYearDropdown.selectedIndex = i;
                    break;
                }
            }
        }

        // ตั้งค่าค่าเริ่มต้นให้กับ dropdown number
        const numberDropdown = document.getElementById('number');
        if (numberDropdown) {
            for (let i = 0; i < numberDropdown.options.length; i++) {
                if (numberDropdown.options[i].value === number) {
                    numberDropdown.selectedIndex = i;
                    break;
                }
            }
        }

        // ตั้งค่าค่าเริ่มต้นให้กับ dropdown typeID
        const typeDropdown = document.getElementById('typeID');
        if (typeDropdown) {
            for (let i = 0; i < typeDropdown.options.length; i++) {
                if (typeDropdown.options[i].value === selectedTypeID) {
                    typeDropdown.selectedIndex = i;
                    break;
                }
            }
        }        
        
        if (batchYearDropdown || numberDropdown) {
            batchForm();
        }

    });
}


  