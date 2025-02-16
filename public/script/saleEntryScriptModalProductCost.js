document.addEventListener('DOMContentLoaded', function () {
    const openProductMenuBtn = document.getElementById('openProductMenu');

    disableProductButton();

    // ตรวจสอบ dropdown ที่ต้องใช้
    document.getElementById('typeSelect').addEventListener('change', checkProductSelection);
    document.getElementById('sizeSelect').addEventListener('change', checkProductSelection);

    // เปิด Modal เมื่อคลิกปุ่ม
    openProductMenuBtn.addEventListener('click', function () {
        openProductCostModal();
    });

    function checkProductSelection() {
        const typeValue = document.getElementById('typeSelect').value;
        const sizeValue = document.getElementById('sizeSelect').value;

        typeValue && sizeValue ? enableProductButton() : disableProductButton();
    }

    function enableProductButton() {
        openProductMenuBtn.classList.replace('btn-outline-secondary', 'btn-outline-success');
        openProductMenuBtn.disabled = false;
    }

    function disableProductButton() {
        openProductMenuBtn.classList.replace('btn-outline-success', 'btn-outline-secondary');
        openProductMenuBtn.disabled = true;
    }
});

function openProductCostModal() {
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
    loadProductCostContent();
}

function loadProductCostContent() {
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

            console.log("✅ เนื้อหาของ manageProductCost ถูกโหลดสำเร็จ!");
        })
        .catch(error => console.error('❌ Error loading product cost content:', error));
}


function closeProductCostModal() {
    document.getElementById('productCostModal')?.remove();
}
