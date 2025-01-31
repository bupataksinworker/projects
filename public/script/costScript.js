function clearCostOfProduct() {
    document.getElementById('productID').value = '';
    document.getElementById('costOfProduct').value = '';
}

function resetSelectGradeToFirstOption() {
    document.getElementById('gradeID').selectedIndex = 0;
}

function selectedType(typeID, selectedSizeID = '', selectedGradeID = '') {
    // ล้าง HTML ของตาราง
    document.getElementById('tableProductGroups').innerHTML = '';
    document.getElementById('sizeID').innerHTML = '';
    document.getElementById('gradeID').innerHTML = '';
    
    // ล้างข้อมูลในช่องต้นทุนสินค้า
    clearCostOfProduct();

    // ส่งค่า typeID ไปยัง router โดยใช้ Fetch API
    fetch(`/selectedType?typeID=${typeID}`)
        .then(response => response.json())
        .then(data => {
            const sizes = data.sizes;
            const grades = data.grades;

            // สร้าง HTML สำหรับ dropdown size
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

            // สร้าง HTML สำหรับ dropdown grade
            let gradeDropdownHTML = '<option value=""></option>';
            grades.forEach(function (grade) {
                gradeDropdownHTML += `<option value="${grade._id}">${grade.gradeName}</option>`;
            });

            // เปลี่ยน HTML ใน dropdown ของ gradeID
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
    // ล้างข้อมูลในช่องต้นทุนสินค้า
    clearCostOfProduct();

    // ส่งค่า typeID, sizeID, gradeID ไปยัง router โดยใช้ Fetch API
    fetch(`/selectedProduct?typeID=${typeID}&sizeID=${sizeID}&gradeID=${gradeID}`)
        .then(response => response.json())
        .then(data => {
            const products = data.products;

            // สร้าง HTML สำหรับข้อมูลใน dropdown
            let productDropdownHTML = '<option value=""></option>';
            products.forEach(function (product) {
                productDropdownHTML += `<option value="${product._id}">${product.productName}</option>`;
            });

            // เปลี่ยน HTML ใน dropdown ของ productID
            document.getElementById('productID').innerHTML = productDropdownHTML;

            // สร้าง HTML สำหรับแสดงในตาราง
            let tableHTML = '';
            products.forEach(function (product, index) {
                tableHTML += '<tr>';
                tableHTML += '<td>' + (index + 1) + '</td>';
                tableHTML += '<td>' + (product.ber || '') + ' ' + product.productName + '</td>';
                tableHTML += '<td>' + (product.ber || '') + '</td>';
                tableHTML += '<td>' + product.displayName + '</td>';
                tableHTML += '<td>' + product.sizeID.sizeName + '</td>';
                tableHTML += '<td>' + product.typeID.typeName + '</td>';
                tableHTML += '<td>' + product.gradeID.gradeName + '</td>';
                tableHTML += '<td>' +
                    '<form id="editForm" action="/editProduct" method="POST">' +
                    '<input type="hidden" name="edit_id" value="' + product._id + '">' +
                    '<button type="submit" class="btn btn-primary">แก้ไข</button>' +
                    '</form>' +
                    '</td>';
                tableHTML += '<td>' +
                    '<form action="/deleteProduct" method="POST">' +
                    '<input type="hidden" name="delete_id" value="' + product._id + '">' +
                    '<button type="submit" class="btn btn-danger ml-2" onclick="return confirm(\'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?\')">ลบ</button>' +
                    '</form>' +
                    '</td>';
                tableHTML += '</tr>';
            });

            // แทรก HTML ลงในตาราง
            document.getElementById('tableProductGroups').innerHTML = tableHTML;
        })
        .catch(error => console.error('Error fetching data:', error));
}

function fetchProductGroups(typeID, sizeID, gradeID) {
    // ตรวจสอบว่ามีพารามิเตอร์ส่งมาหรือไม่
    if (typeID !== undefined && sizeID !== undefined && gradeID !== undefined) {
        typeID = typeID;
        sizeID = sizeID;
        gradeID = gradeID;
    } else {
        // ดึงค่าจาก element HTML
        typeID = document.getElementById('typeID').value;
        sizeID = document.getElementById('sizeID').value;
        gradeID = document.getElementById('gradeID').value;
    }
    fetch(`/productGroup?typeID=${typeID}&sizeID=${sizeID}&gradeID=${gradeID}`)
        .then(response => response.json())
        .then(data => {
            // เข้าถึงข้อมูล productGroups จาก response
            const productGroups = data.productGroups;

            // สร้าง HTML สำหรับข้อมูลใน tableProductGroups
            let tableHTML = '';

            // วน loop เพื่อสร้างแถวของตารางสำหรับแต่ละผลิตภัณฑ์
            let currentIndex = 0;
            Object.keys(productGroups).forEach(function (productName, index) {
                if (`${typeID}` === `${productGroups[productName].typeID._id}` &&
                    `${sizeID}` === `${productGroups[productName].sizeID._id}` &&
                    (`${gradeID}` === `${productGroups[productName].gradeID._id}` || !gradeID)) {
                    currentIndex++; // เพิ่ม index ทุกครั้งที่ข้อมูลตรงกับเงื่อนไข
                    tableHTML += '<tr>';
                    tableHTML += '<td>' + currentIndex + '</td>';
                    // tableHTML += '<td>' + productGroups[productName].typeID._id + '</td>';
                    // tableHTML += '<td>' + productGroups[productName].sizeID._id + '</td>';
                    // tableHTML += '<td>' + productGroups[productName].gradeID._id + '</td>';
                    // tableHTML += '<td>' + productGroups[productName].ber + '</td>';
                    tableHTML += '<td title="product._id : ' + productGroups[productName].productId._id + '">' + productName + '</td>';
                    tableHTML += '<td title="cost._id : ' + productGroups[productName].costId + '">' + addCommas(productGroups[productName].latestCost) + '</td>';
                    tableHTML += '<td>' +
                        '<form id="editForm" action="/editCost" method="POST">' +
                        '<input type="hidden" name="edit_id1" value="' + productGroups[productName].productId._id + '">' +
                        '<input type="hidden" name="edit_id2" value="' + productName + '">' +
                        '<input type="hidden" name="edit_id3" value="' + productGroups[productName].costId + '">' +
                        '<button type="submit" class="btn btn-primary">แก้ไข</button>' +
                        '</form>' +
                        '</td>';
                        tableHTML += `<td>
                        <button type="button" class="btn btn-danger btn-sm" onclick="deleteCostAll('${productGroups[productName].productId._id}')">
                            ลบ
                        </button>
                    </td>`;
                    tableHTML += '</tr>';
                }
            });



            // แทรก HTML ลงในตาราง
            $('#tableProductGroups').html(tableHTML);
        })
        .catch(error => console.error('Error fetching product groups:', error))
}


function addCost() {
    const productID = document.getElementById('productID').value;
    const costOfProduct = parseFloat(document.getElementById('costOfProduct').value);

    const data = {
        productID: productID,
        costOfProduct: costOfProduct
    };

    fetch('/addCost', { 
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
            alert('เพิ่มราคาต้นทุนสินค้าสำเร็จ');
            fetchProductGroups();
        } else {
            alert('เกิดข้อผิดพลาด: ' + data.message);
        }
    })
    .catch(error => {
        console.error('เกิดข้อผิดพลาด:', error);
        alert('เกิดข้อผิดพลาด: ' + error.message);
    });
}

function addNewCost() {
    const costOfProduct = document.getElementById('newCostOfProduct').value;
    const productID = document.getElementById('productID').value;
    const data = {
        productID: productID,
        costOfProduct: costOfProduct
    };

    fetch('/addCost', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (response.ok) {
                return response.json(); // รับ JSON response
            } else {
                console.error('เกิดข้อผิดพลาด:', response.status);
                throw new Error('Response not ok');
            }
        })
        .then(data => {
            if (data.success) {
                console.log('ข้อมูลถูกส่งสำเร็จ!', data.newCost);
                console.log('เรียกค่า typeID:', data.typeID);
                console.log('เรียกค่า sizeID:', data.sizeID);
                console.log('เรียกค่า gradeID:', data.gradeID);

                // ใช้ข้อมูลที่ได้รับในที่นี้
                // document.getElementById('newCostDisplay').innerText = `ต้นทุนใหม่ถูกเพิ่ม: ${JSON.stringify(data.newCost)}\nTypeID: ${data.typeID}\nSizeID: ${data.sizeID}\nGradeID: ${data.gradeID}`;
                window.location.href = '/manageCost?typeID=' + data.typeID + '&sizeID=' + data.sizeID + '&gradeID=' + data.gradeID;
                // window.location.reload(); // รีเฟรชหน้าเว็บหากต้องการ
            } else {
                console.error('เกิดข้อผิดพลาด:', data.message);
            }
        })
        .catch(error => console.error('Error fetching addNewCost:', error));
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

        if (typeID && sizeID) {
            fetchProductGroups(typeID, sizeID, gradeID);
        }
    });
}

function deleteCostOne(costID) {
    const result = confirm('ต้องการลบราคาสินค้านี้? ' + costID);
    if (result) {
        fetch('/deleteID', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ delete_id: costID })
        })
            .then(response => {
                if (response.ok) {
                    console.log('ลบข้อมูลถูกสำเร็จ!');
                    window.location.reload(); // รีเฟรชหน้าเว็บ
                } else {
                    console.error('เกิดข้อผิดพลาด: ', response.status);
                }
            })
            .catch(error => console.error('Error fetching deleteCostOne:', error));
    } else {
        console.log('ผู้ใช้ยกเลิกการลบ');
    }
}

function deleteCostAll(id) {

    if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้?')) {
        fetch('/deleteCostAll', {
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
                fetchProductGroups(typeID, sizeID, gradeID);
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

function updateCost() {
    const costIdOld = document.getElementById('costIdOld').value;
    const costID = document.getElementById('costID').value;
    const productID = document.getElementById('productID').value;

    const data = {
        productID: productID,
        costID: costID,
        costIdOld: costIdOld
    };

    fetch('/updateCost', { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (response.ok) {
                return response.json(); // รับ JSON response
            } else {
                console.error('เกิดข้อผิดพลาด:', response.status);
                throw new Error('Response not ok');
            }
        })
        .then(data => {
            if (data.success) {
                console.log('ข้อมูลถูกอัปเดตสำเร็จ!');
                console.log('เรียกค่า typeID:', data.typeID);
                console.log('เรียกค่า sizeID:', data.sizeID);
                console.log('เรียกค่า gradeID:', data.gradeID);

                // เปลี่ยนเส้นทางไปที่หน้าจัดการต้นทุน
                window.location.href = '/manageCost?typeID=' + data.typeID + '&sizeID=' + data.sizeID + '&gradeID=' + data.gradeID;
            } else {
                console.error('เกิดข้อผิดพลาด:', data.message);
            }
        })
        .catch(error => console.error('Error fetching updateCost:', error));
}
