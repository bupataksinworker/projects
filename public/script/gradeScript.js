function addGrade() {
    const gradeName = document.getElementById('gradeName').value;

    const data = {
        gradeName: gradeName
    }

    fetch('/addGrade', {
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
                window.location.reload();
            } else {
                alert('เกิดข้อผิดพลาด: ' + data.message);
            }
        })
        .catch(error => {
            console.error('เกิดข้อผิดพลาด:', error);
            alert('เกิดข้อผิดพลาด: ' + error.message);
        });
}

async function updateGrade() {
    const edit_id = document.getElementById('edit_id').value;
    const gradeName = document.getElementById('gradeName').value;

    const data = {
        edit_id,
        gradeName
    };

    try {
        const response = await fetch('/updateGrade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
            alert('อัปเดตสำเร็จ');
            // หากต้องการ redirect กลับไปยังหน้า manageGrade
            window.location.href = '/manageGrade';
        } else {
            alert(`เกิดข้อผิดพลาด: ${result.message}`);
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตประเภทสินค้า:', error);
        alert(`เกิดข้อผิดพลาดในการอัปเดตประเภทสินค้า: ${error.message}`);
    }
}
