function checkElementsExist() {
    const elements = [
        'modal_edit_id', 'modal_ber', 'modal_sizeID',
        'modal_typeID', 'modal_gradeID', 'modal_displayName',
        'costTableBody', 'modal_newCostOfProduct'
    ];

    elements.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`❌ Element not found: '${id}'`);
        } else {
            console.log(`✅ Element found: '${id}' (Value: '${element.value || "N/A"}')`);
        }
    });
}

// ✅ ตรวจสอบว่า modal โหลดเสร็จก่อนใช้งาน
document.addEventListener('DOMContentLoaded', checkElementsExist);
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('modal_editProductCost').addEventListener('shown.bs.modal', function () {
        console.log("✅ Modal is now visible");
    });
});



window.onload = async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const typeID = urlParams.get('typeID');
    const sizeID = urlParams.get('sizeID');
    const gradeID = urlParams.get('gradeID');

    if (typeID) {
        document.getElementById('typeIDCost').value = typeID;
        await selectedTypeCost(typeID);

        if (sizeID) {
            document.getElementById('sizeIDCost').value = sizeID;
            await selectedSizeCost();

            if (gradeID) {
                document.getElementById('gradeIDCost').value = gradeID;
            }
        }
        updateTableProductCost();
    }
};

let allGrades = [];

async function selectedTypeCost(typeID) {
    document.getElementById('sizeIDCost').innerHTML = '<option value=""></option>';
    document.getElementById('gradeIDCost').innerHTML = '<option value=""></option>';
    document.getElementById('costOfProductCost').value = '';

    try {
        const response = await fetch(`/selectedType?typeID=${typeID}`);
        const data = await response.json();

        allGrades = data.grades || [];

        let sizeOptions = '<option value=""></option>';
        data.sizes.forEach(size => {
            sizeOptions += `<option value="${size._id}">${size.sizeName}</option>`;
        });
        document.getElementById('sizeIDCost').innerHTML = sizeOptions;
    } catch (error) {
        console.error('Error fetching sizes and grades:', error);
    }
}

async function selectedSizeCost() {
    document.getElementById('gradeIDCost').innerHTML = '<option value=""></option>';
    document.getElementById('costOfProductCost').value = '';

    let gradeOptions = '<option value=""></option>';
    allGrades.forEach(grade => {
        gradeOptions += `<option value="${grade._id}">${grade.gradeName}</option>`;
    });
    document.getElementById('gradeIDCost').innerHTML = gradeOptions;

    updateTableProductCost();
}

function selectedGradeCost() {
    document.getElementById('costOfProductCost').value = '';
    updateTableProductCost();
}

async function addCostProduct() {
    const typeID = document.getElementById('typeIDCost').value;
    const sizeID = document.getElementById('sizeIDCost').value || null;
    const gradeID = document.getElementById('gradeIDCost').value || null;
    const costOfProduct = parseFloat(document.getElementById('costOfProductCost').value);

    if (!typeID || !costOfProduct) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }

    try {
        const response = await fetch('/addProductCost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ typeID, sizeID, gradeID, costOfProduct })
        });

        const result = await response.json();
        alert(result.message);
        updateTableProductCost();

        // ✅ ถ้ามีฟังก์ชัน `updateDropdownSaleEntry()` ให้เรียกใช้งาน สำหรับ popup หน้า manageSaleEntry
        if (typeof updateDropdownSaleEntry === 'function') {
            updateDropdownSaleEntry(result.product);
        }

    } catch (error) {
        console.error('Error adding product cost:', error);
    }
}

function updateTableProductCost() {
    const typeID = document.getElementById('typeIDCost').value;
    const sizeID = document.getElementById('sizeIDCost').value || '';
    const gradeID = document.getElementById('gradeIDCost').value || '';

    fetch(`/api/updateTableProductCost?typeID=${typeID}&sizeID=${sizeID}&gradeID=${gradeID}`)
        .then(response => response.json())
        .then(data => {
            let tableHTML = data.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.ber || ''} ${item.productName || '-'}</td>
                    <td>${item.ber || '-'}</td>
                    <td>${item.displayName || '-'}</td>
                    <td>${item.sizeName || '-'}</td>
                    <td>${item.typeName || '-'}</td>
                    <td>${item.gradeName || '-'}</td>
                    <td>${item.latestCost ? item.latestCost.toFixed(2) : '-'}</td>
                    <td>
                        <button class="btn btn-primary" onclick="openEditProductCostModal('${item.id}')">
                            แก้ไข
                        </button>
                    </td>
                    <td>
                        <button class='btn btn-danger' onclick="deleteProductCost('${item.id}')">ลบ</button>
                    </td>
                </tr>
            `).join('');
            document.getElementById('tableProductCostData').innerHTML = tableHTML;
        })
        .catch(error => console.error('Error updating table:', error));
}


async function openEditProductCostModal(productID) {
    try {
        const response = await fetch(`/api/getProductCostById?productID=${productID}`);
        const data = await response.json();

        if (data.success) {
            const product = data.product;
            const costs = data.costs || []; // ✅ ตรวจสอบว่ามี `costs` หรือไม่

            // กำหนดค่าให้ฟอร์มใน Modal
            document.getElementById('modal_edit_id').value = product._id;
            document.getElementById('modal_ber').value = product.ber || '';
            document.getElementById('modal_sizeID').value = product.sizeID?._id || '';
            document.getElementById('modal_typeID').value = product.typeID?._id || '';
            document.getElementById('modal_gradeID').value = product.gradeID?._id || '';
            document.getElementById('modal_displayName').value = product.displayName || '';

            // ✅ แสดงข้อมูลต้นทุนในตาราง
            let costTableHTML = costs.map((cost, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${cost.costDate}</td>
                    <td>${cost.costOfProduct}</td>
                    <td>
                        <button class="btn btn-danger" onclick="deleteProductCostOne('${cost._id}')">ลบ</button>
                    </td>
                </tr>
            `).join('');
            document.getElementById('costTableBody').innerHTML = costTableHTML;

            // แสดง Modal
            const editModal = new bootstrap.Modal(document.getElementById('modal_editProductCost'));
            editModal.show();
        } else {
            alert('ไม่พบข้อมูลสินค้า');
        }
    } catch (error) {
        console.error('Error fetching product data:', error);
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูลสำหรับแก้ไข');
    }
}

async function updateCostTable(productID) {
    try {
        const response = await fetch(`/api/getProductCostById?productID=${productID}`);
        const data = await response.json();

        if (data.success) {
            const costs = data.costs || [];

            // ✅ อัปเดตข้อมูลในตาราง `costTableBody`
            let costTableHTML = costs.map((cost, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${cost.costDate}</td>
                    <td>${cost.costOfProduct}</td>
                    <td>
                        <button class="btn btn-danger" onclick="deleteProductCostOne('${cost._id}')">ลบ</button>
                    </td>
                </tr>
            `).join('');
            document.getElementById('costTableBody').innerHTML = costTableHTML;

            console.log('✅ อัปเดตตารางต้นทุนสำเร็จ!');
        } else {
            console.error('❌ ไม่พบข้อมูลต้นทุน');
        }
    } catch (error) {
        console.error('❌ Error updating cost table:', error);
    }
}

async function deleteProductCost(id) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้? ' + id)) return;

    try {
        const response = await fetch('/deleteProductCost', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ delete_id: id })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
        }

        const data = await response.json();

        if (data.success) {
            alert('ลบข้อมูลสำเร็จ');
            // ดึงค่า type, size, grade จาก HTML และอัปเดตตาราง
            const typeID = document.getElementById('typeIDCost').value;
            const sizeID = document.getElementById('sizeIDCost').value;
            const gradeID = document.getElementById('gradeIDCost').value;
            updateTableProductCost(typeID, sizeID, gradeID);
        } else {
            alert('เกิดข้อผิดพลาด: ' + data.message);
        }
    } catch (error) {
        console.error('เกิดข้อผิดพลาด:', error);
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
}

function deleteProductCostOne(costID) {
    const result = confirm('ต้องการลบราคาสินค้านี้? ' + costID);
    const productIDInput = document.getElementById('modal_edit_id');
    const productID = productIDInput.value;
    
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
                    // window.location.reload(); // รีเฟรชหน้าเว็บ

                    // ✅ อัปเดตตารางข้อมูลโดยไม่ต้องรีโหลดหน้า
                    updateTableProductCost();

                    // ✅ อัปเดตตารางข้อมูลต้นทุนทันทีหลังจากเพิ่ม
                    updateCostTable(productID);

                } else {
                    console.error('เกิดข้อผิดพลาด: ', response.status);
                }
            })
            .catch(error => console.error('Error fetching deleteCostOne:', error));
    } else {
        console.log('ผู้ใช้ยกเลิกการลบ');
    }
}

async function updateProductCostOnly() {
    const productIDInput = document.getElementById('modal_edit_id');
    const berInput = document.getElementById('modal_ber');
    const sizeIDInput = document.getElementById('modal_sizeID');
    const typeIDInput = document.getElementById('modal_typeID');
    const gradeIDInput = document.getElementById('modal_gradeID');
    const displayNameInput = document.getElementById('modal_displayName');

    if (!productIDInput || !berInput || !sizeIDInput || !typeIDInput || !gradeIDInput || !displayNameInput) {
        console.error("❌ Element not found in updateProductCostOnly()");
        throw new Error("One or more input fields are missing");
    }

    const data = {
        productID: productIDInput.value,
        ber: berInput.value,
        sizeID: sizeIDInput.value,
        typeID: typeIDInput.value,
        gradeID: gradeIDInput.value,
        displayName: displayNameInput.value
    };

    const response = await fetch('/api/updateProduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error(await response.text());
    }
}

async function updateCostProductOnly() {
    const costIdOld = document.getElementById('costIdOld').value;
    const costID = document.getElementById('costID').value;
    const productID = document.getElementById('productID').value;

    const data = { productID, costID, costIdOld };

    const response = await fetch('/updateCost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!result.success) {
        throw new Error(result.message);
    }
}

function goBackToManage() {
    const typeID = document.getElementById('typeID').value;
    const sizeID = document.getElementById('sizeID').value;
    const gradeID = document.getElementById('gradeID').value;

    // ส่งค่ากลับไปยัง manageProductCost พร้อมพารามิเตอร์
    const queryParams = new URLSearchParams({ typeID, sizeID, gradeID });
    window.location.href = `/manageProductCost?${queryParams.toString()}`;
}

async function addNewProductCost() {
    // ✅ ตรวจสอบว่า element มีอยู่ใน DOM หรือไม่
    const costInput = document.getElementById('modal_newCostOfProduct');
    const productIDInput = document.getElementById('modal_edit_id');

    if (!costInput || !productIDInput) {
        console.error("❌ Element not found: 'modal_newCostOfProduct' or 'modal_edit_id'");
        alert("เกิดข้อผิดพลาด: ไม่สามารถดึงข้อมูลสินค้าได้ กรุณาลองใหม่");
        return;
    }

    const costOfProduct = costInput.value;
    const productID = productIDInput.value;

    if (!costOfProduct || !productID) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }

    const data = { productID, costOfProduct: parseFloat(costOfProduct) };

    try {
        const response = await fetch('/addCost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(errorMessage || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
        }

        const result = await response.json();

        if (result.success) {
            console.log('✅ เพิ่มข้อมูลสำเร็จ!', result.newCost);

            // ✅ อัปเดตตารางข้อมูลโดยไม่ต้องรีโหลดหน้า
            updateTableProductCost();

            // ✅ อัปเดตตารางข้อมูลต้นทุนทันทีหลังจากเพิ่ม
            updateCostTable(productID);

            // ✅ ล้างค่า input
            costInput.value = '';

            alert('เพิ่มข้อมูลต้นทุนสำเร็จ');
        } else {
            alert(`เกิดข้อผิดพลาด: ${result.message}`);
        }
    } catch (error) {
        console.error('❌ Error adding new cost:', error);
        alert('เกิดข้อผิดพลาดในการเพิ่มข้อมูลต้นทุน');
    }
}

async function updateProductAndCost() {
    try {
        // ✅ ตรวจสอบว่า element มีอยู่ใน DOM ก่อนใช้งาน
        const productIDInput = document.getElementById('modal_edit_id');
        const berInput = document.getElementById('modal_ber');
        const sizeIDInput = document.getElementById('modal_sizeID');
        const typeIDInput = document.getElementById('modal_typeID');
        const gradeIDInput = document.getElementById('modal_gradeID');
        const displayNameInput = document.getElementById('modal_displayName');

        if (!productIDInput || !berInput || !sizeIDInput || !typeIDInput || !gradeIDInput || !displayNameInput) {
            console.error("❌ Element not found: One or more input fields are missing");
            alert("เกิดข้อผิดพลาด: ไม่พบข้อมูลสินค้า กรุณาลองใหม่");
            return;
        }

        console.log("✅ Product ID:", productIDInput.value);
        console.log("✅ ข้อมูลที่กำลังอัปเดต:", {
            ber: berInput.value,
            sizeID: sizeIDInput.value,
            typeID: typeIDInput.value,
            gradeID: gradeIDInput.value,
            displayName: displayNameInput.value
        });

        // ✅ อัปเดตข้อมูลสินค้า
        try {
            await updateProductCostOnly();
            console.log("✅ อัปเดตข้อมูลสินค้าเสร็จสิ้น");
        } catch (error) {
            console.error("❌ Error updating product:", error);
            alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูลสินค้า");
            return;
        }

        // ✅ อัปเดตข้อมูลตารางหลังจากแก้ไข
        try {
            await updateCostTable(productIDInput.value);
            console.log("✅ ตารางข้อมูลต้นทุนถูกอัปเดตเรียบร้อยแล้ว");
        } catch (error) {
            console.error("❌ Error updating cost table:", error);
            alert("เกิดข้อผิดพลาดในการอัปเดตตารางข้อมูลต้นทุน");
        }

        updateTableProductCost();
        alert('✅ อัปเดตข้อมูลสำเร็จ!');
    } catch (error) {
        console.error('❌ Error in updateProductAndCost:', error);
        alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
    }
}

