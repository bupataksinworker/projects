document.addEventListener('DOMContentLoaded', function () {
    const openProductMenuBtn = document.getElementById('openProductMenu');
    const openCostMenuBtn = document.getElementById('openCostMenu');

    disableProductButton();
    disableCostButton();

    // ตรวจสอบ dropdown ที่ต้องใช้
    document.getElementById('typeSelect').addEventListener('input', function () {
        if (this.value.trim() !== '') {
            checkProductSelection();
        }
    });

    document.getElementById('sizeSelect').addEventListener('input', function () {
        if (this.value.trim() !== '') {
            checkProductSelection();
        }
    });

    document.getElementById('productSelect').addEventListener('input', function () {
        if (this.value.trim() !== '') {
            checkCostSelection();
        }
    });


    // เปิด Modal เมื่อคลิกปุ่ม
    openProductMenuBtn.addEventListener('click', function () {
        openProductCostModal(1);
    });
    openCostMenuBtn.addEventListener('click', function () {
        openProductCostModal(2);
    });

    function checkProductSelection() {
        const typeValue = document.getElementById('typeSelect').value;
        const sizeValue = document.getElementById('sizeSelect').value;

        typeValue && sizeValue ? enableProductButton() : disableProductButton();
    }

    function checkCostSelection() {
        const typeValue = document.getElementById('typeSelect').value;
        const sizeValue = document.getElementById('sizeSelect').value;
        const productValue = document.getElementById('productSelect').value;

        typeValue && sizeValue && productValue ? enableCostButton() : disableCostButton();
    }

    function enableProductButton() {
        openProductMenuBtn.classList.replace('btn-outline-secondary', 'btn-outline-success');
        openProductMenuBtn.disabled = false;
    }

    function disableProductButton() {
        openProductMenuBtn.classList.replace('btn-outline-success', 'btn-outline-secondary');
        openProductMenuBtn.disabled = true;
    }

    function enableCostButton() {
        openCostMenuBtn.classList.replace('btn-outline-secondary', 'btn-outline-success');
        openCostMenuBtn.disabled = false;
    }

    function disableCostButton() {
        openCostMenuBtn.classList.replace('btn-outline-success', 'btn-outline-secondary');
        openCostMenuBtn.disabled = true;
    }
});

function openProductCostModal(code) {

    const modalHTML = `
        <div id="productCostModal" class="modal-overlay product-modal">
            <div class="modal-content">
                <div class="modal-header" style="background-color: #007bff; color: white;">
                </div>
                <div class="modal-body" id="productCostContent"></div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeProductCostModal()">เสร็จสิ้น</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    loadProductCostContent(code);
}

function closeProductCostModal() {
    document.getElementById('productCostModal')?.remove();
}

// function loadProductCostContent(code) {
//     fetch('/manageProductCost')
//         .then(response => response.text())
//         .then(html => {
//             const parser = new DOMParser();
//             const doc = parser.parseFromString(html, 'text/html');

//             // ✅ ลบ navbar ออกจาก HTML ที่โหลดมา
//             const navbar = doc.querySelector('nav');
//             if (navbar) navbar.remove();

//             // ✅ โหลด `manageProductCost` ทั้งหน้า (ยกเว้น nav)
//             document.getElementById('productCostContent').innerHTML = doc.body.innerHTML;

//             // ✅ โหลด Bootstrap JS ถ้ายังไม่มี
//             if (!document.querySelector('script[src="/js/bootstrap.bundle.min.js"]')) {
//                 const bootstrapScript = document.createElement('script');
//                 bootstrapScript.src = '/js/bootstrap.bundle.min.js';
//                 document.body.appendChild(bootstrapScript);
//             }

//             // ✅ โหลด `productCostScript.js` ถ้ายังไม่มี
//             if (!document.querySelector('script[src="/script/productCostScript.js"]')) {
//                 const script = document.createElement('script');
//                 script.src = '/script/productCostScript.js';
//                 script.defer = true;
//                 document.body.appendChild(script);
//             }


//             console.log("✅ เนื้อหาของ manageProductCost ถูกโหลดสำเร็จ!");
//         })
//         .catch(error => console.error('❌ Error loading product cost content:', error));
// }


// ✅ ตรวจสอบว่าฟังก์ชัน `getSelectedValues` มีอยู่ก่อนค่อยเรียก
if (typeof getSelectedValues !== "function") {
    console.warn("⚠️ getSelectedValues ยังไม่ถูกโหลด");
} else {
    console.log("✅ getSelectedValues พร้อมใช้งาน");
}

// ✅ ฟังก์ชันสำหรับดึงค่าจาก dropdown ปัจจุบัน
function getSelectedValues() {
    const typeIDCostValue = document.getElementById('typeSelect')?.value || '';
    const sizeIDCostValue = document.getElementById('sizeSelect')?.value || '';
    const productSelectElement = document.getElementById('productSelect');

    // ✅ ใช้ `dataset.gradeid` เพื่อดึงค่า gradeID
    const gradeIDCostValue = productSelectElement?.selectedOptions[0]?.dataset.gradeid || '';

    console.log("✅ Type:", typeIDCostValue);
    console.log("✅ Size:", sizeIDCostValue);
    console.log("✅ Product ID:", productSelectElement?.value);
    console.log("✅ Grade ID:", gradeIDCostValue);

    return { typeIDCostValue, sizeIDCostValue, gradeIDCostValue };
}


// ✅ ฟังก์ชันสำหรับตั้งค่าค่า dropdown (รอให้ `option` โหลดเสร็จจริงก่อน)
function setDropdownValues() {
    const { typeIDCostValue, sizeIDCostValue, gradeIDCostValue } = getSelectedValues();

    // ✅ ตั้งค่าประเภท (Type)
    if (document.getElementById('typeIDCost')) {
        document.getElementById('typeIDCost').value = typeIDCostValue;
        document.getElementById('typeIDCost').dispatchEvent(new Event('change'));
    }

    // ✅ ตั้งค่าไซส์ (Size) พร้อมตรวจสอบ `option`
    if (document.getElementById('sizeIDCost')) {
        setTimeout(() => {
            const sizeDropdown = document.getElementById('sizeIDCost');
            if ([...sizeDropdown.options].some(option => option.value === sizeIDCostValue)) {
                sizeDropdown.value = sizeIDCostValue;
                sizeDropdown.dispatchEvent(new Event('change'));
                console.log("✅ sizeIDCost ถูกตั้งค่าเป็น:", sizeIDCostValue);
            } else {
                console.warn("⚠️ ไม่พบ sizeIDCost ที่ตรงกับ:", sizeIDCostValue);
            }
        }, 300);
    }

    // ✅ ตั้งค่าเกรด (Grade) โดยใช้ `MutationObserver` รอให้ `option` โหลดเสร็จ
    if (document.getElementById('gradeIDCost')) {
        const gradeDropdown = document.getElementById('gradeIDCost');

        // 🔄 ใช้ `MutationObserver` รอให้ `option` โหลดเสร็จ
        const observer = new MutationObserver(() => {
            if ([...gradeDropdown.options].some(option => option.value === gradeIDCostValue)) {
                gradeDropdown.value = gradeIDCostValue;
                gradeDropdown.dispatchEvent(new Event('change'));
                console.log("✅ gradeIDCost ถูกตั้งค่าเป็น:", gradeIDCostValue);
                observer.disconnect(); // หยุดการฟังเมื่อค่าโหลดเสร็จ
            }
        });

        // ✅ เริ่มฟังการเปลี่ยนแปลงของ dropdown
        observer.observe(gradeDropdown, { childList: true });

        // 🔄 ถ้าค่าโหลดช้า ให้ลองตั้งค่าอีกครั้งหลัง 1 วินาที
        setTimeout(() => {
            if ([...gradeDropdown.options].some(option => option.value === gradeIDCostValue)) {
                gradeDropdown.value = gradeIDCostValue;
                gradeDropdown.dispatchEvent(new Event('change'));
                console.log("✅ gradeIDCost ถูกตั้งค่าเป็น (หลังรอ 1 วินาที):", gradeIDCostValue);
            } else {
                console.warn("⚠️ ยังไม่พบ gradeIDCost ที่ตรงกับ:", gradeIDCostValue);
            }
        }, 1000);
    }

    console.log("✅ ค่า dropdown ใน productCostForm ถูกตั้งค่าใหม่สำเร็จ!");
}


// ✅ โหลดเนื้อหา `manageProductCost`
function loadProductCostContent(code) {
    fetch('/manageProductCost')
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // ✅ ลบ navbar ออกจาก HTML ที่โหลดมา
            const navbar = doc.querySelector('nav');
            if (navbar) navbar.remove();

            // ✅ โหลด `manageProductCost` ทั้งหน้า (ยกเว้น nav)
            document.getElementById('productCostContent').innerHTML = doc.body.innerHTML;

            // ✅ โหลด Bootstrap JS ถ้ายังไม่มี
            if (!document.querySelector('script[src="/js/bootstrap.bundle.min.js"]')) {
                const bootstrapScript = document.createElement('script');
                bootstrapScript.src = '/js/bootstrap.bundle.min.js';
                document.body.appendChild(bootstrapScript);
            }

            // ✅ โหลด `productCostScript.js` ถ้ายังไม่มี
            if (!document.querySelector('script[src="/script/productCostScript.js"]')) {
                const script = document.createElement('script');
                script.src = '/script/productCostScript.js';
                script.defer = true;
                document.body.appendChild(script);
            }

            // ✅ ตั้งค่าค่าที่เลือกหลังจากโหลดเสร็จ 
            // if (code == 2) {
            setTimeout(() => {
                setDropdownValues();
            }, 1000); // 🔄 รอให้ `productCostScript.js` โหลดก่อนเรียก `setDropdownValues()` 
            // }


            console.log("✅ เนื้อหาของ manageProductCost ถูกโหลดสำเร็จ!");
        })
        .catch(error => console.error('❌ Error loading product cost content:', error));
}

/**
 * ✅ ฟังก์ชันอัปเดต dropdown หลังเพิ่มสินค้าและต้นทุน
 */
function updateDropdownSaleEntry(product) {
    if (!product) return;

    // ✅ ดึง Element ของ dropdown
    const productSelect = document.getElementById('productSelect');
    const costSelect = document.getElementById('costSelect');

    // ✅ อัปเดต dropdown สินค้า
    if (productSelect) {
        let productOption = `<option value="${product._id}" data-gradeid="${product.gradeID._id}">${product.productName}</option>`;

        // ตรวจสอบว่ามีอยู่แล้วหรือไม่ ถ้าไม่มีให้เพิ่ม
        if (![...productSelect.options].some(option => option.value === product._id)) {
            productSelect.innerHTML += productOption;
        }

        // ✅ ตั้งค่า selected เป็นค่าที่เพิ่มล่าสุด
        productSelect.value = product._id;

        // ✅ เรียกใช้งาน filterCost() ถ้ามี เพื่อโหลดต้นทุนของสินค้านี้
        if (typeof filterCost === 'function') {
            filterCost();
        }
    }

    // ✅ อัปเดต dropdown ราคาทุน
    if (costSelect) {
        let costOption = `<option value="${product.costID}">${product.costOfProduct}</option>`;

        // ตรวจสอบว่ามีอยู่แล้วหรือไม่ ถ้าไม่มีให้เพิ่ม
        if (![...costSelect.options].some(option => option.value === product.costID)) {
            costSelect.innerHTML += costOption;
        }

        // ✅ ตั้งค่า selected เป็นค่าที่เพิ่มล่าสุด
        costSelect.value = product.costID;

        // ✅ ตั้งค่า openCostMenu ให้คลิกเปิด modal ได้
        const openCostMenuBtn = document.getElementById('openCostMenu');
        openCostMenuBtn.classList.replace('btn-outline-secondary', 'btn-outline-success');
        openCostMenuBtn.disabled = false;
    }
}