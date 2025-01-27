async function addCustomer() {
    const customerName = document.getElementById('customerName').value.trim();
    const email = document.getElementById('email').value.trim() || null;
    const phone = document.getElementById('phone').value.trim() || null;
    const address = document.getElementById('address').value.trim() || '';

    if (!customerName) {
        alert('กรุณากรอกชื่อของลูกค้า');
        return;
    }

    const data = {
        customerName,
        email,
        phone,
        address
    };

    try {
        const response = await fetch('/addCustomer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const responseData = await response.json();
        if (responseData.success) {
            alert('เพิ่มสำเร็จ');
            window.location.reload();
        } else {
            alert('เกิดข้อผิดพลาด: ' + responseData.message);
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error);
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
}

function updateCustomer() {
    const editId = document.getElementById('edit_id').value;
    const customerName = document.getElementById('customerName').value.trim();
    const email = document.getElementById('email').value.trim() || null; // แปลงค่าว่างเป็น null
    const phone = document.getElementById('phone').value.trim() || null; // แปลงค่าว่างเป็น null
    const address = document.getElementById('address').value.trim() || null; // แปลงค่าว่างเป็น null

    const subCustomerElements = document.getElementsByName('subCustomerName[]');
    const subCustomerName = Array.from(subCustomerElements).map(el => el.value.trim()).filter(Boolean);

    if (!customerName) {
        alert('กรุณากรอกชื่อของลูกค้า');
        return;
    }

    const data = {
        edit_id: editId,
        customerName,
        subCustomerName,
        email,
        phone,
        address
    };

    fetch('/updateCustomer', {
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
                window.location.href = '/manageCustomer';
            } else {
                alert('เกิดข้อผิดพลาด: ' + data.message);
            }
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาด:', error);
            alert('เกิดข้อผิดพลาด: ' + error.message);
        });
}



function addSubCustomerField() {
    const container = document.getElementById('subCustomerNamesContainer');
    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'subCustomerName[]';
    input.classList.add('form-control', 'mb-2');
    input.placeholder = 'Sub-customer Name';
    container.appendChild(input);
}

function showAddSubCustomerPopup() {
    $('#addSubCustomerModal').modal('show');
}

function addNewSubCustomer() {
    const newSubCustomerName = document.getElementById('newSubCustomerName').value.trim();
    if (!newSubCustomerName) {
        alert('Please enter a sub-customer name');
        return;
    }

    const container = document.getElementById('subCustomerNamesContainer');
    const div = document.createElement('div');
    div.classList.add('sub-customer-item', 'd-flex', 'align-items-center');

    div.innerHTML = `
        <input type="text" name="subCustomerName[]" class="form-control mb-2 mr-2" value="${newSubCustomerName}" placeholder="Sub-customer Name">
        <button type="button" class="btn btn-danger btn-sm" onclick="removeSubCustomerField(this)">-</button>
    `;

    container.appendChild(div);
    $('#addSubCustomerModal').modal('hide');
}

async function deleteCustomer(event) {
    event.preventDefault(); // ป้องกันการส่งฟอร์มแบบปกติ

    const form = event.target;
    const formData = new FormData(form);
    const delete_id = formData.get('delete_id');

    try {
        const response = await fetch('/deleteCustomer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delete_id })
        });

        const result = await response.json();

        if (result.success) {
            alert(result.message); // แสดงข้อความสำเร็จ
            window.location.reload(); // โหลดหน้าใหม่
        } else {
            alert(result.message); // แสดงข้อความแจ้งเตือน
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
}

async function removeSubCustomerField(button) {
    const subCustomerName = button.parentElement.querySelector('input[name="subCustomerName[]"]').value.trim();

    if (!subCustomerName) {
        alert('ไม่สามารถลบช่องที่ไม่มีข้อมูลได้');
        return;
    }

    try {
        // ตรวจสอบกับ API ว่า subCustomerName ถูกใช้อยู่ใน Sale หรือไม่
        const response = await fetch(`/checkSubCustomerUsage?subCustomerName=${encodeURIComponent(subCustomerName)}`);
        const result = await response.json();

        if (!result.success) {
            alert('เกิดข้อผิดพลาดในการตรวจสอบ');
            return;
        }

        if (result.inUse) {
            alert(`ไม่สามารถลบได้ เนื่องจาก "${subCustomerName}" ถูกใช้อยู่ในระบบ`);
        } else {
            // หากไม่ถูกใช้งาน ให้ลบ
            button.parentElement.remove();
        }
    } catch (error) {
        console.error('Error checking subCustomer usage:', error);
        alert('เกิดข้อผิดพลาดในการลบ Sub-customer');
    }
}
