document.addEventListener('DOMContentLoaded', function () {
    const openBatchMenuBtn = document.getElementById('openBatchMenu');

    // เริ่มต้นปิดการใช้งานปุ่ม
    disableBatchButton();

    // เพิ่ม Event Listener ให้ dropdown typeSelect
    document.getElementById('typeSelect').addEventListener('change', checkBatchSelection);

    // เพิ่ม Event Listener ให้ปุ่มเปิด modal
    openBatchMenuBtn.addEventListener('click', function () {
        if (openBatchMenuBtn.disabled) {
            alert('กรุณาเลือกประเภทก่อน');
        } else {
            openBatchModal();
        }
    });

    function checkBatchSelection() {
        const typeValue = document.getElementById('typeSelect').value;

        if (typeValue) {
            enableBatchButton();
        } else {
            disableBatchButton();
        }
    }

    function enableBatchButton() {
        openBatchMenuBtn.classList.remove('btn-outline-secondary');
        openBatchMenuBtn.classList.add('btn-outline-success');
        openBatchMenuBtn.disabled = false;
    }

    function disableBatchButton() {
        openBatchMenuBtn.classList.remove('btn-outline-success');
        openBatchMenuBtn.classList.add('btn-outline-secondary');
        openBatchMenuBtn.disabled = true;
    }
});

function openBatchModal() {
    const modalHTML = `
        <div id="batchModal" class="modal-overlay batch-modal" onclick="closeBatchModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header" style="background-color: #007bff;color: white;">
                    <h>จัดการข้อมูลชุด</h>
                </div>
                <div class="modal-body">
                    <div id="batchTabContent" class="tab-content active-content"></div>
                </div>
                <div class="modal-footer">
                    <button onclick="closeBatchModal()">เสร็จสิ้น</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // โหลดเนื้อหาของ batch
    loadBatchContent('/manageBatch', '/script/batchScript.js');
}

function loadBatchContent(url, scriptUrl) {
    fetch(url)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const popupContent = doc.querySelector('#popup');

            if (popupContent) {
                document.getElementById('batchTabContent').innerHTML = popupContent.innerHTML;

                // โหลดสคริปต์เพิ่มเติม
                const script = document.createElement('script');
                script.src = scriptUrl;
                document.getElementById('batchTabContent').appendChild(script);
            } else {
                console.error('ไม่พบ #popup ใน HTML ที่โหลดมา');
            }
        })
        .catch(error => console.error('Error loading batch content:', error));
}

function closeBatchModal(event) {
    if (!event || event.target.id === 'batchModal') {
        document.getElementById('batchModal').remove();
        filterBatch();
    }
}

function filterBatch() {
    console.log('เรียกใช้งาน filterBatch() หลังจากปิด modal');
    // เพิ่มโค้ดการกรองข้อมูลหรือการอัปเดตข้อมูลที่จำเป็น
}
