function addType() {
    const grain = document.getElementById('grain').value;
    const origin = document.getElementById('origin').value;
    const heat = document.getElementById('heat').value;

    const data = {
        grainID: grain,
        originID: origin,
        heatID: heat
    }

    fetch('/addType', {
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

async function updateType() {
    const edit_id = document.getElementById('edit_id').value;
    const grainID = document.getElementById('grain').value;
    const originID = document.getElementById('origin').value;
    const heatID = document.getElementById('heat').value;

    const data = {
        edit_id,
        grainID,
        originID,
        heatID
    };

    try {
        const response = await fetch('/updateType', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
            alert('ข้อมูลประเภทสินค้าถูกอัปเดตสำเร็จ');
            // หากต้องการ redirect กลับไปยังหน้า manageType
            window.location.href = '/manageType';
        } else {
            alert(`เกิดข้อผิดพลาด: ${result.message}`);
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตประเภทสินค้า:', error);
        alert(`เกิดข้อผิดพลาดในการอัปเดตประเภทสินค้า: ${error.message}`);
    }
}