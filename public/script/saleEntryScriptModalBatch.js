document.addEventListener('DOMContentLoaded', function () {
    const openBatchMenuBtn = document.getElementById('openBatchMenu');

    disableBatchButton();
    document.getElementById('typeSelect').addEventListener('change', checkBatchSelection);

    openBatchMenuBtn.addEventListener('click', function () {
        if (openBatchMenuBtn.disabled) {
            alert('กรุณาเลือกประเภทก่อน');
        } else {
            openBatchModal();
        }
    });

    function checkBatchSelection() {
        const typeValue = document.getElementById('typeSelect').value;
        typeValue ? enableBatchButton() : disableBatchButton();
    }

    function enableBatchButton() {
        openBatchMenuBtn.classList.replace('btn-outline-secondary', 'btn-outline-success');
        openBatchMenuBtn.disabled = false;
    }

    function disableBatchButton() {
        openBatchMenuBtn.classList.replace('btn-outline-success', 'btn-outline-secondary');
        openBatchMenuBtn.disabled = true;
    }
});

function openBatchModal() {
    const modalHTML = `
        <div id="batchModal" class="modal-overlay batch-modal" onclick="closeBatchModal(event)">
            <div class="modal-content" onclick="event.stopPropagation()">
                <div class="modal-header" style="background-color: #007bff; color: white;">
                </div>
                <div class="modal-body" id="batchTabContent"></div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeBatchModal()">เสร็จสิ้น</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    loadBatchContent();
}

function loadBatchContent() {
    fetch('/manageBatch')
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // ลบ navbar ออกจาก HTML ที่โหลดมา
            const navbar = doc.querySelector('nav');
            if (navbar) navbar.remove();

            // โหลด manageBatch ทั้งหน้า
            document.getElementById('batchTabContent').innerHTML = doc.body.innerHTML;

            // โหลด Bootstrap JS ถ้ายังไม่มี
            if (!document.querySelector('script[src="/js/bootstrap.bundle.min.js"]')) {
                const bootstrapScript = document.createElement('script');
                bootstrapScript.src = '/js/bootstrap.bundle.min.js';
                document.body.appendChild(bootstrapScript);
            }

            // โหลด batchScript.js เพื่อให้สคริปต์ทำงาน
            const script = document.createElement('script');
            script.src = '/script/batchScript.js';
            document.body.appendChild(script);

        })
        .catch(error => console.error('Error loading batch content:', error));
}


async function closeBatchModal(event) {
    if (!event || event.target.id === 'batchModal') {
        document.getElementById('batchModal')?.remove();

        // ดึง typeID จาก dropdown
        const typeID = document.getElementById('typeSelect').value;
        if (typeID) {
            try {
                // Fetch ข้อมูลสำหรับ batch
                const batchResponse = await fetch(`/batchForm?typeID=${typeID}`);
                if (batchResponse.ok) {
                    const batchData = await batchResponse.json();
                    const batchs = batchData.batchs;

                    if (batchs.length === 0) {
                        $('#batchSelect').html('<option value="">-- ไม่มีชุดที่ใช้ได้ --</option>');
                        return;
                    }

                    // เรียง `batchs` ตาม `batchYear` มากไปน้อย และ `number` มากไปน้อย
                    batchs.sort((a, b) => {
                        if (b.batchYear !== a.batchYear) {
                            return b.batchYear - a.batchYear; // ปีมาก่อน
                        }
                        return b.number - a.number; // sorter มากไปน้อย
                    });

                    // เลือก `batch` ล่าสุดโดยอัตโนมัติ
                    const latestBatchID = batchs[0]._id;

                    // สร้าง HTML สำหรับ dropdown
                    var batchDropdownHTML = '<option value="">-- เลือกชุด --</option>';
                    batchs.forEach(function (batch) {
                        batchDropdownHTML += `<option value="${batch._id}" ${batch._id === latestBatchID ? 'selected' : ''}>${batch.batchName}</option>`;
                    });

                    $('#batchSelect').html(batchDropdownHTML);
                } else {
                    console.error('Error fetching batch data:', batchResponse.statusText);
                }
            } catch (error) {
                console.error('Error loading batch content:', error);
            }
        }
    }
}
