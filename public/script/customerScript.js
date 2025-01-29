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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            alert('เพิ่มสำเร็จ');
            window.location.reload();
        } else {
            alert(result.message || 'ไม่สามารถเพิ่มลูกค้าได้');
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error);
        alert('เกิดข้อผิดพลาดในการเพิ่มลูกค้า');
    }
}


function updateCustomer() {
    const editId = document.getElementById('edit_id').value;
    const customerName = document.getElementById('customerName').value.trim();
    const email = document.getElementById('email').value.trim() || null; // แปลงค่าว่างเป็น null
    const phone = document.getElementById('phone').value.trim() || null; // แปลงค่าว่างเป็น null
    const address = document.getElementById('address').value.trim() || null; // แปลงค่าว่างเป็น null

    const subCustomerElements = document.getElementsByName('subCustomerName[]');
    const subCustomers = Array.from(subCustomerElements).map(el => ({
        id: el.dataset.id || null,
        name: el.value.trim()
    })).filter(subCustomer => subCustomer.name);

    if (!customerName) {
        alert('กรุณากรอกชื่อของลูกค้า');
        return;
    }

    const data = {
        edit_id: editId,
        customerName,
        subCustomers,
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
    const div = document.createElement('div');
    div.classList.add('sub-customer-item', 'd-flex', 'align-items-center');

    div.innerHTML = `
        <input type="text" name="subCustomerName[]" class="form-control mb-2 mr-2" placeholder="Sub-customer Name">
        <button type="button" class="btn btn-danger btn-sm" onclick="removeSubCustomerField(this)">-</button>
    `;

    container.appendChild(div);
}

function showAddSubCustomerPopup() {
    $('#addSubCustomerModal').modal('show');
}

async function addNewSubCustomer() {
    const newSubCustomerName = document.getElementById('newSubCustomerName').value.trim();
    const customerId = document.getElementById('edit_id').value;

    if (!newSubCustomerName) {
        alert('Please enter a sub-customer name');
        return;
    }

    try {
        const response = await fetch('/addSubCustomer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subCustomerName: newSubCustomerName, parentCustomerID: customerId })
        });

        const result = await response.json();

        if (result.success) {
            const container = document.getElementById('subCustomerNamesContainer');
            const div = document.createElement('div');
            div.classList.add('sub-customer-item', 'd-flex', 'align-items-center');

            div.innerHTML = `
                <input type="text" name="subCustomerName[]" class="form-control mb-2 mr-2"
                    value="${result.subCustomer.subCustomerName}" data-id="${result.subCustomer._id}" readonly>
                <button type="button" class="btn btn-danger btn-sm" onclick="removeSubCustomerField(this)">-</button>
            `;

            container.appendChild(div);
            $('#addSubCustomerModal').modal('hide');
            document.getElementById('newSubCustomerName').value = ''; // เคลียร์ช่องกรอกข้อมูล
        } else {
            alert(result.message || 'Failed to add sub-customer');
        }
    } catch (error) {
        console.error('Error adding sub-customer:', error);
        alert('เกิดข้อผิดพลาดในการเพิ่ม Sub-customer');
    }
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
            alert(result.message);
            window.location.reload(); // โหลดหน้าใหม่
        } else {
            alert(result.message || 'ไม่สามารถลบข้อมูลได้');
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error);
        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
}


async function removeSubCustomerField(button) {
    const subCustomerId = button.parentElement.querySelector('input[name="subCustomerName[]"]').dataset.id;

    if (!subCustomerId) {
        button.parentElement.remove();
        return;
    }

    try {
        const response = await fetch(`/deleteSubCustomer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: subCustomerId })
        });

        const result = await response.json();

        if (result.success) {
            button.parentElement.remove();
        } else {
            alert(result.message || 'Failed to delete sub-customer');
        }
    } catch (error) {
        console.error('Error deleting sub-customer:', error);
        alert('เกิดข้อผิดพลาดในการลบ Sub-customer');
    }
}


