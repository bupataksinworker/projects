document.addEventListener('DOMContentLoaded', function () {
    // ดึง batchID จาก URL ที่ตำแหน่งที่ 3
    const pathname = window.location.pathname;
    const pathParts = pathname.split('/');
    const batchID = pathParts[2]; // batchID อยู่ในตำแหน่งที่ 3 ของ URL
    console.log(batchID);

    // เรียก API พร้อมส่ง batchID ไปด้วย
    fetch(`/api/getAllStock/${batchID}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const stocks = data.data;
                const tableBody = document.querySelector('#transactionTable tbody');
                tableBody.innerHTML = '';

                stocks.forEach(stock => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${stock.batchID.batchName}</td>
                        <td>${stock.typeID.typeName}</td>
                        <td>${stock.sizeID.sizeName}</td>
                        <td>${stock.gradeID.gradeName}</td>
                        <td style="text-align: right;">${stock.cost}</td>
                        <td style="text-align: right;">${stock.addStock}</td>
                        <td>${stock.comment}</td>
                        <td style="text-align: center;">${new Date(stock.stockDate).toLocaleString()}</td>
                        <td style="text-align: center;">
                            <button class="btn btn-danger btn-sm btn-delete" data-id="${stock._id}">ลบ</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });

                // เพิ่ม EventListener สำหรับปุ่มลบ
                document.querySelectorAll('.btn-delete').forEach(button => {
                    button.addEventListener('click', function () {
                        const stockID = this.getAttribute('data-id');

                        // เปิด prompt ให้ผู้ใช้กรอกคำว่า "ยืนยัน" เพื่อทำการลบ
                        const confirmation = prompt('กรุณาใส่ "ยืนยัน" เพื่อยืนยันการลบข้อมูลนี้');

                        // ตรวจสอบว่าผู้ใช้กรอก "ยืนยัน" ถูกต้องหรือไม่
                        if (confirmation === 'ยืนยัน') {
                            fetch(`/api/deleteStock/${stockID}`, {
                                method: 'DELETE'
                            })
                                .then(response => response.json())
                                .then(result => {
                                    if (result.success) {
                                        alert('ลบข้อมูลสำเร็จ');
                                        // Refresh table
                                        location.reload(); // รีเฟรชหน้าเว็บหลังจากลบสำเร็จ
                                    } else {
                                        alert('เกิดข้อผิดพลาดในการลบข้อมูล');
                                    }
                                })
                                .catch(error => console.error('Error:', error));
                        } else {
                            alert('การลบถูกยกเลิกเนื่องจากไม่ได้ใส่คำว่า "ยืนยัน"');
                        }
                    });
                });
            } else {
                console.error('Error retrieving stock data');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
});
