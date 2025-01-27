function addCommas(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatNumber(n) {
    return parseFloat(n).toFixed(2);
}

function createPageHeader(pageNum, totalPages, sale) {
    return `
        <div class="header">
            <span>หน้า ${pageNum}/${totalPages}</span>
        </div>
        <table>
            <thead>
                <tr>
                    <td>ใบเสนอขาย PO (สำหรับเรา)</td>
                    <td>วันที่ : ${new Date(sale.saleDate).toLocaleDateString('en-GB')}</td>
                    <td>คุณ : ${sale.customerID.customerName} ${sale.subCustomerName ? `(${sale.subCustomerName})` : ''}</td>
                </tr>
            </thead>
        </table>
    `;
}

function createEntriesTable(entries) {
    let rows = entries.map(entry => `
        <tr>
            <td>${entry.sizeName}</td>
            <td>${entry.grade}</td>
            <td>${entry.cost}</td>
            <td>${entry.weight}</td>
            <td>x</td>
            <td>${entry.price}</td>
            <td>=</td>
            <td>${entry.total}</td>
        </tr>
    `).join('');

    let totalItems = entries.length;
    let totalSale = entries.reduce((sum, entry) => sum + entry.total, 0);

    return `
        <table>
            <thead>
                <tr>
                    <th>ชื่อไซส์</th>
                    <th>เกรด</th>
                    <th>ต้นทุน</th>
                    <th>น้ำหนัก(ก.)</th>
                    <th>x</th>
                    <th>ราคา(บาท)</th>
                    <th>=</th>
                    <th>รวม(บาท)</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="7">รวม ${totalItems} รายการ</td>
                    <td>${addCommas(formatNumber(totalSale))}</td>
                </tr>
            </tfoot>
        </table>
    `;
}

function createSummaryTable(pagesSummary) {
    let rows = pagesSummary.map((summary, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${summary.totalItems}</td>
            <td>${addCommas(formatNumber(summary.totalSale))}</td>
        </tr>
    `).join('');

    let grandTotalItems = pagesSummary.reduce((sum, summary) => sum + summary.totalItems, 0);
    let grandTotalSale = pagesSummary.reduce((sum, summary) => sum + summary.totalSale, 0);
    let discountAmount = grandTotalSale * (sale.discount / 100);
    let finalAmount = grandTotalSale - discountAmount;

    return `
        <table>
            <thead>
                <tr>
                    <td>หน้า</td>
                    <td>จำนวนรายการ</td>
                    <td>รวมราคา</td>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
            <tfoot>
                <tr>
                    <td>รวมทั้งหมด ${pagesSummary.length} หน้า</td>
                    <td>รวมทั้งหมด ${grandTotalItems} รายการ</td>
                    <td>${addCommas(formatNumber(grandTotalSale))}</td>
                </tr>
                <tr>
                    <td>หัก ${sale.discount}% เป็นเงิน ${addCommas(formatNumber(discountAmount))} บาท</td>
                    <td></td>
                    <td>เหลือเงินหลังหัก ${addCommas(formatNumber(finalAmount))} บาท</td>
                </tr>
            </tfoot>
        </table>
    `;
}

function createBatchSummaryTable(batchSummaries) {
    let rows = batchSummaries.map(batch => `
        <tr>
            <td>${batch.batchID}</td>
            <td>${addCommas(formatNumber(batch.totalSale))}</td>
            <td>${addCommas(formatNumber(batch.discountedSale))}</td>
            <td>${addCommas(formatNumber(batch.cost))}</td>
            <td>${addCommas(formatNumber(batch.profit))}</td>
        </tr>
    `).join('');

    return `
        <table>
            <thead>
                <tr>
                    <th>ชุด</th>
                    <th>รวมขายได้(บาท)</th>
                    <th>หัก ${sale.discount}% เหลือ(บาท)</th>
                    <th>ต้นทุน(บาท)</th>
                    <th>กำไร(บาท)</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

function renderReceipts(entries, sale) {
    let container = document.getElementById('dataContainer');
    let entriesPerPage = 25;
    let totalPages = Math.ceil(entries.length / entriesPerPage);
    let pagesSummary = [];

    for (let i = 0; i < totalPages; i++) {
        let pageEntries = entries.slice(i * entriesPerPage, (i + 1) * entriesPerPage);
        let pageSummary = {
            totalItems: pageEntries.length,
            totalSale: pageEntries.reduce((sum, entry) => sum + entry.total, 0)
        };
        pagesSummary.push(pageSummary);

        let pageContent = `
            <div class="page">
                ${createPageHeader(i + 1, totalPages, sale)}
                ${createEntriesTable(pageEntries)}
            </div>
        `;
        container.insertAdjacentHTML('beforeend', pageContent);
    }

    let summaryContent = `
        <div class="page">
            ${createPageHeader(totalPages + 1, totalPages + 1, sale)}
            ${createSummaryTable(pagesSummary)}
        </div>
    `;
    container.insertAdjacentHTML('beforeend', summaryContent);

    // Render batch summary table if necessary
    let batchSummaries = calculateBatchSummaries(entries, sale);
    let batchSummaryContent = `
        <div class="page">
            ${createPageHeader(totalPages + 2, totalPages + 2, sale)}
            ${createBatchSummaryTable(batchSummaries)}
        </div>
    `;
    container.insertAdjacentHTML('beforeend', batchSummaryContent);
}

function calculateBatchSummaries(entries, sale) {
    // Implement batch summaries calculation logic here
    // This is a placeholder function
    return [];
}

document.addEventListener('DOMContentLoaded', () => {
    let dataContainer = document.getElementById('dataContainer');
    let entries = JSON.parse(decodeURIComponent(dataContainer.getAttribute('data-entries')));
    let sale = JSON.parse(decodeURIComponent(dataContainer.getAttribute('data-sale')));
    renderReceipts(entries, sale);
});