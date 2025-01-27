function selectedType(typeID, selectedSizeID = '', selectedGradeID = '') {
    // ล้าง HTML ของตาราง
    document.getElementById('tableProduct').innerHTML = '';
    document.getElementById('sizeID').innerHTML = '';
    document.getElementById('gradeID').innerHTML = '';
    // ส่งค่า typeID ไปยัง router โดยใช้ Fetch API
    fetch(`/selectedType?typeID=${typeID}`)
        .then(response => response.json())
        .then(data => {
            // เข้าถึงข้อมูล ที่ส่งมาภายใน JSON object
            const sizes = data.sizes;
            const grades = data.grades;

            // สร้าง HTML สำหรับข้อมูลใน dropdown ของ size
            let sizeDropdownHTML = '<option value=""></option>';
            sizes.forEach(function (size) {
                sizeDropdownHTML += `<option value="${size._id}">${size.sizeName}</option>`;
            });
            // เปลี่ยน HTML ใน dropdown ของ sizeID และตั้งค่าที่เลือกเริ่มต้น
            const sizeDropdown = document.getElementById('sizeID');
            sizeDropdown.innerHTML = sizeDropdownHTML;
            for (let i = 0; i < sizeDropdown.options.length; i++) {
                if (sizeDropdown.options[i].value === selectedSizeID) {
                    sizeDropdown.selectedIndex = i;
                    break;
                }
            }

            // สร้าง HTML สำหรับข้อมูลใน dropdown ของ grade
            let gradeDropdownHTML = '<option value=""></option>';
            grades.forEach(function (grade) {
                gradeDropdownHTML += `<option value="${grade._id}">${grade.gradeName}</option>`;
            });
            // เปลี่ยน HTML ใน dropdown ของ gradeID และตั้งค่าที่เลือกเริ่มต้น
            const gradeDropdown = document.getElementById('gradeID');
            gradeDropdown.innerHTML = gradeDropdownHTML;
            for (let i = 0; i < gradeDropdown.options.length; i++) {
                if (gradeDropdown.options[i].value === selectedGradeID) {
                    gradeDropdown.selectedIndex = i;
                    break;
                }
            }

        })
        .catch(error => console.error('Error fetching data:', error));
}

function selectedProduct(typeID, sizeID, gradeID) {
    // ส่งค่า typeID และ sizeID ไปยัง router โดยใช้ Fetch API
    fetch(`/selectedProduct?typeID=${typeID}&sizeID=${sizeID}&gradeID=${gradeID}`)
        .then(response => response.json())
        .then(data => {
            // เข้าถึงข้อมูล ที่ส่งมาภายใน JSON object ส่งไปสร้างตารางข้อมูล
            createTable(data.products);
        })
        .catch(error => console.error('Error fetching data:', error))
}

function createTable(products) {
    // สร้าง HTML สำหรับข้อมูลใน tableProduct
    var tableHTML = '';
    products.forEach(function (product, index) {
        tableHTML += '<tr>';
        tableHTML += '<td>' + (index + 1) + '</td>';
        if (product.ber == '') {
            tableHTML += '<td>' + product.productName + '</td>';
            tableHTML += '<td> - </td>';
        } else {
            tableHTML += '<td>' + product.ber + ' ' + product.productName + '</td>';
            tableHTML += '<td>' + product.ber + '</td>';
        }
        tableHTML += '<td>' + product.displayName + '</td>';
        tableHTML += '<td>' + product.sizeID.sizeName + '</td>';
        tableHTML += '<td>' + product.typeID.typeName + '</td>';
        tableHTML += '<td>' + product.gradeID.gradeName + '</td>';
        // tableHTML += '<td><button class="btn btn-primary btn-sm" data-toggle="modal" data-target="#updateProductModal" onclick="setModalValues(' + JSON.stringify(product) + ')">แก้ไข</button></td>';
        tableHTML += '<td>' +
            '<form id="editForm" action="/editProduct" method="POST">' +
            '<input type="hidden" name="edit_id" id="edit_id" value="' + product._id + '">' +
            '<button type="submit" class="btn btn-primary btn-sm">แก้ไข</button>' +
            '</form>' +
            '</td>';
        tableHTML += `<td>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteProduct('${product._id}')">
                ลบ
            </button>
        </td>`;

        tableHTML += '</tr>';
    });

    // อัพเดต HTML ของตาราง
    var tableElement = document.getElementById('tableProduct');
    tableElement.innerHTML = tableHTML;
}

async function addProduct() {
    const typeID = document.getElementById('typeID').value;
    const sizeID = document.getElementById('sizeID').value;
    const gradeID = document.getElementById('gradeID').value;
    const missingInputFields = [];

    if (!typeID) {
        missingInputFields.push('ประเภท');
    }

    if (!sizeID) {
        missingInputFields.push('ขนาด');
    }

    if (!gradeID) {
        missingInputFields.push('เกรด');
    }

    if (missingInputFields.length > 0) {
        const missingFieldsMessage = `กรุณากรอกข้อมูลให้ครบถ้วน: ${missingInputFields.join(', ')}`;
        alert(missingFieldsMessage);
        return;
    }

    var formData = {
        typeID: document.getElementById('typeID').value,
        sizeID: document.getElementById('sizeID').value,
        gradeID: document.getElementById('gradeID').value,
    };
    console.log(formData);
    const dataResponse = await fetch('/addProduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });

    if (dataResponse.ok) {
        const data = await dataResponse.json();
        alert('เพิ่มข้อมูลสำเร็จ');
        updateTableProduct();
    } else {
        const errorData = await dataResponse.json();
        console.error('Error fetching add product:', errorData.error);
        alert(errorData.error);
    }
}

function updateTableProduct(type, size, grade) {
    let typeID;
    let sizeID;
    let gradeID;

    // ตรวจสอบว่ามีพารามิเตอร์ส่งมาหรือไม่
    if (type !== undefined && size !== undefined && grade !== undefined) {
        typeID = type;
        sizeID = size;
        gradeID = grade;
    } else {
        // ดึงค่าจาก element HTML
        typeID = document.getElementById('typeID').value;
        sizeID = document.getElementById('sizeID').value;
        gradeID = document.getElementById('gradeID').value;
    }

    fetch('/api/updateTableProduct/' + typeID + '/' + sizeID + '/' + gradeID)
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(products => {
            // การเรียงลำดับ products ตาม sorter จากมากไปหาน้อย
            products.sort((a, b) => {
                return b.sorter - a.sorter; // ถ้าสถานะเท่ากัน ให้เรียงตาม sorter จากมากไปน้อย
            });
            createTable(products);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('Failed to fetch data: ' + error.message);
        });
}

function deleteProduct(id) {

    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?')) {
        fetch('/deleteProduct', {
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
                // ดึงค่าจาก element HTML
                typeID = document.getElementById('typeID').value;
                sizeID = document.getElementById('sizeID').value;
                gradeID = document.getElementById('gradeID').value;
                selectedProduct(typeID, sizeID, gradeID);
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

async function updateProduct() {
    const edit_id = document.getElementById('edit_id').value;
    const ber = document.getElementById('ber').value;
    const sizeID = document.getElementById('sizeID').value;
    const typeID = document.getElementById('typeID').value;
    const gradeID = document.getElementById('gradeID').value;
    const displayName = document.getElementById('displayName').value;

    // เตรียมข้อมูลสำหรับส่งไปยัง router
    const data = {
        edit_id,
        ber,
        sizeID,
        typeID,
        gradeID,
        displayName
    };

    // ส่งข้อมูลไปยัง router /updateProduct
    const response = await fetch('/updateProduct', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    // ตรวจสอบสถานะการตอบกลับ
    if (response.ok) {
        alert('ข้อมูลสินค้าถูกอัปเดต');
        window.location.href = '/manageProduct?typeID=' + typeID + '&sizeID=' + sizeID + '&gradeID=' + gradeID;
    } else {
        // แสดงข้อความแจ้งเตือนตามสถานะการตอบกลับ
        const errorMessage = await response.text();
        alert(errorMessage);
    }
}

// รับพารามิเตอร์กลับมาจากหน้า edit 
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
        const urlParams = new URLSearchParams(window.location.search);
        const typeID = urlParams.get('typeID');
        const sizeID = urlParams.get('sizeID');
        const gradeID = urlParams.get('gradeID');

        // ตั้งค่าค่าเริ่มต้นให้กับ dropdown typeID
        const typeDropdown = document.getElementById('typeID');
        if (typeDropdown) {
            for (let i = 0; i < typeDropdown.options.length; i++) {
                if (typeDropdown.options[i].value === typeID) {
                    typeDropdown.selectedIndex = i;
                    break;
                }
            }
        }

        // เรียกฟังก์ชัน `selectedType` เพื่อโหลดข้อมูล size และ grade ที่เกี่ยวข้อง
        if (typeID) {
            selectedType(typeID, sizeID, gradeID);
        }

        // เรียกใช้เพื่อแสดงข้อมูลผลิตภัณฑ์
        if (typeID && sizeID && gradeID) {
            updateTableProduct(typeID, sizeID, gradeID);
        }
    });
}