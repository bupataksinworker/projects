function fetchSizes(grainID) {
    // ส่งค่า grainID ไปยัง router โดยใช้ Fetch API
    fetch(`/sizeTableBody?grainID=${grainID}`)
        .then(response => response.json())
        .then(data => {
            // เข้าถึงข้อมูล sizes ภายใน JSON object
            var sizes = data.sizes;
            // สร้าง HTML สำหรับข้อมูลใน tbody
            var html = '';
            sizes.forEach(function (size, index) {
                html += '<tr>';
                html += '<td>' + (index + 1) + '</td>';
                html += '<td>' + size.grainID.grainName + '</td>';
                html += '<td>' + size.sizeName + '</td>';
                html += '<td>' +
                    '<form class="editForm" action="/editSize" method="POST">' +
                    '<input type="hidden" name="edit_id" value="' + size._id + '">' +
                    '<button type="submit" class="btn btn-primary">แก้ไข</button>' +
                    '</form>' +
                    '</td>';
                html += `<td>
                    <button type="button" class="btn btn-danger btn-sm" onclick="deleteSize('${size._id}')">
                        ลบ
                    </button>
                </td>`;
                html += `<td>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="moveSize('${size._id}', 'up')" ${index === 0 ? 'disabled' : ''} title="เลื่อนขึ้น">&#8593;</button>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="moveSize('${size._id}', 'down')" ${index === sizes.length - 1 ? 'disabled' : ''} title="เลื่อนลง">&#8595;</button>
                </td>`;
                html += '</tr>';
            });

            // แทรก HTML ลงใน tbody
            $('#sizeTableBody').html(html);
        })
        .catch(error => console.error('Error fetching data:', error))
}

function addSize() {
    const grainID = document.getElementById('grainID').value;
    const sizeName = document.getElementById('sizeName').value;

    const data = {
        grainID: grainID,
        sizeName: sizeName
    }

    fetch('/addSize', {
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
                fetchSizes(data.grainID); // อัปเดตรายการขนาดโดยการเรียกใช้ `fetchSizes`
            } else {
                alert('เกิดข้อผิดพลาด: ' + data.message);
            }
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาด:', error);
            alert('เกิดข้อผิดพลาด: ' + error.message);
        });
}

function deleteSize(id) {
    const sizeID = id;
    const grainID = document.getElementById('grainID').value;

    const data = {
        sizeID: sizeID,
        grainID: grainID
    }

    fetch('/deleteSize', {
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
                alert('ลบสำเร็จ');
                fetchSizes(data.grainID); // อัปเดตรายการขนาดโดยการเรียกใช้ `fetchSizes`
            } else {
                alert('เกิดข้อผิดพลาด: ' + data.message);
            }
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาด:', error);
            alert('เกิดข้อผิดพลาด: ' + error.message);
        });
}

async function updateSize() {
    const sizeID = document.getElementById('edit_id').value;
    const sizeName = document.getElementById('sizeName').value;
    const grainID = document.getElementById('grainID').value;

    // เตรียมข้อมูลสำหรับส่งไปยัง router
    const data = {
        edit_id: sizeID,
        grainID: grainID,
        sizeName: sizeName
    };

    // ส่งข้อมูลไปยัง router /updateSize
    fetch('/updateSize', {
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
                alert('อัพเดทสำเร็จ');
                fetchSizes(data.grainID); // อัปเดตรายการขนาดโดยการเรียกใช้ `fetchSizes`
                window.location.href = '/manageSize?grainID=' + grainID;

            } else {
                alert('เกิดข้อผิดพลาด: ' + data.message);
            }
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาด:', error);
            alert('เกิดข้อผิดพลาด: ' + error.message);
        });
}

// รับพารามิเตอร์กลับมาจากหน้า edit 
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
        const urlParams = new URLSearchParams(window.location.search);
        const grainID = urlParams.get('grainID');

        if (grainID) {
            // ตั้งค่าค่าเริ่มต้นให้กับ dropdown
            const grainDropdown = document.getElementById('grainID');
            for (let i = 0; i < grainDropdown.options.length; i++) {
                if (grainDropdown.options[i].value === grainID) {
                    grainDropdown.selectedIndex = i;
                    break;
                }
            }

            // เรียกใช้ fetchSizes เพื่อแสดงข้อมูล
            fetchSizes(grainID);
        }
    });
}

function moveSize(sizeID, direction) {
    const grainID = document.getElementById('grainID').value;

    fetch('/moveSize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sizeID, direction, grainID })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            fetchSizes(grainID); // รีเฟรชตารางหลังสลับ
        } else {
            alert('เกิดข้อผิดพลาด: ' + (data.message || 'ไม่สามารถสลับลำดับได้'));
        }
    })
    .catch(error => {
        console.error('เกิดข้อผิดพลาด:', error);
        alert('เกิดข้อผิดพลาด: ' + error.message);
    });
}