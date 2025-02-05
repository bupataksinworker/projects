document.addEventListener('DOMContentLoaded', function () {
    // เริ่มต้นด้วยการตั้งค่าปุ่มให้ไม่สามารถคลิกได้
    const openProductMenuBtn = document.getElementById('openProductMenu');
    const openCostMenuBtn = document.getElementById('openCostMenu');

    disableButtons();

    // เพิ่ม Event Listener ให้กับ dropdown
    document.getElementById('typeSelect').addEventListener('change', checkSelections);
    document.getElementById('sizeSelect').addEventListener('change', checkSelections);

    // เพิ่ม Event Listener ให้ปุ่มเมื่อเปิดใช้งานได้
    openProductMenuBtn.addEventListener('click', function () {
        openProductCostModal('productTab');
    });

    openCostMenuBtn.addEventListener('click', function () {
        openProductCostModal('costTab');
    });

    function checkSelections() {
        const typeValue = document.getElementById('typeSelect').value;
        const sizeValue = document.getElementById('sizeSelect').value;

        if (typeValue && sizeValue) {
            enableButtons();
        } else {
            disableButtons();
        }
    }

    function enableButtons() {
        openProductMenuBtn.classList.remove('btn-outline-secondary');
        openProductMenuBtn.classList.add('btn-outline-success');
        openProductMenuBtn.disabled = false;

        openCostMenuBtn.classList.remove('btn-outline-secondary');
        openCostMenuBtn.classList.add('btn-outline-success');
        openCostMenuBtn.disabled = false;
    }

    function disableButtons() {
        openProductMenuBtn.classList.remove('btn-outline-success');
        openProductMenuBtn.classList.add('btn-outline-secondary');
        openProductMenuBtn.disabled = true;

        openCostMenuBtn.classList.remove('btn-outline-success');
        openCostMenuBtn.classList.add('btn-outline-secondary');
        openCostMenuBtn.disabled = true;
    }
});


function openProductCostModal(defaultTab) {
    // สร้าง modal และแท็บ
    const modalHTML = `
        <div id="productCostModal" class="modal-overlay product-modal" onclick="closeProductCostModal(event)">
        <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <button id="productTabBtn" class="active-tab" onclick="switchTab('productTab', '/manageProduct', '/script/productScript.js')">จัดการข้อมูลสินค้า</button>
                    <button id="costTabBtn" onclick="switchTab('costTab', '/manageCost', '/script/costScript.js')">จัดการต้นทุนสินค้า</button>
                </div>
                <div class="modal-body">
                    <div id="productTab" class="tab-content"></div>
                    <div id="costTab" class="tab-content"></div>
                </div>
                <div class="modal-footer">
                    <button onclick="closeProductCostModal()">เสร็จสิ้น</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // เลือกแท็บเริ่มต้นตามค่า defaultTab
    if (defaultTab === 'costTab') {
        switchTab('costTab', '/manageCost', '/script/costScript.js');
    } else {
        switchTab('productTab', '/manageProduct', '/script/productScript.js');
    }
}


function switchTab(tabId, url, scriptUrl) {
    // ล้างเนื้อหาในแท็บทั้งหมดก่อน
    document.querySelectorAll('.tab-content').forEach(tab => tab.innerHTML = '');

    // แสดงเฉพาะแท็บที่เลือก
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active-content'));
    document.querySelectorAll('.modal-header button').forEach(btn => btn.classList.remove('active-tab'));

    document.getElementById(tabId).classList.add('active-content');
    document.getElementById(tabId + 'Btn').classList.add('active-tab');

    // โหลดข้อมูลใหม่ในแท็บที่เลือก
    loadTabContent(tabId, url, scriptUrl);
}

function loadTabContent(tabId, url, scriptUrl) {
    fetch(url)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const popupContent = doc.querySelector('#popup');

            if (popupContent) {
                document.getElementById(tabId).innerHTML = popupContent.innerHTML;

                // โหลดสคริปต์เพิ่มเติม
                const script = document.createElement('script');
                script.src = scriptUrl;
                document.getElementById(tabId).appendChild(script);
            } else {
                console.error(`ไม่พบ #popup ใน ${url}`);
            }
        })
        .catch(error => console.error(`Error loading ${tabId}:`, error));
}

function closeProductCostModal(event) {
    if (!event || event.target.id === 'productCostModal') {
        document.getElementById('productCostModal').remove();
        filterProduct();
    }
}
