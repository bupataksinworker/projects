document.getElementById('yearSelector').addEventListener('change', updateBatchTable);

document.querySelectorAll('input[name="set"]').forEach(checkbox => {
    checkbox.addEventListener('change', updateBatchTable);
});

async function updateBatchTable() {
    const year = document.getElementById('yearSelector').value;
    const selectedSets = Array.from(document.querySelectorAll('input[name="set"]:checked')).map(cb => cb.value);

    console.log('Selected Year:', year);
    console.log('Selected Sets:', selectedSets);

    if (!year || selectedSets.length === 0) {
        document.getElementById('batchProfitOriginTableBody').innerHTML = '<tr><td colspan="8">กรุณาเลือกปีและชุด</td></tr>';
        return;
    }

    try {
        console.log('Fetching data from /api/batches with:', { year, sets: selectedSets.join(',') });
        const response = await fetch(`/api/batches?year=${year}&sets=${selectedSets.join(',')}`);

        if (!response.ok) {
            throw new Error('Failed to fetch batch data');
        }

        const { saleEntries, stockEntries } = await response.json();

        if (!saleEntries || !Array.isArray(saleEntries)) {
            console.error('Invalid saleEntries data:', saleEntries);
            return;
        }

        // ล้างข้อมูลเก่าจากตาราง
        const tableBody = document.querySelector('#batchProfitOriginTableBody');
        tableBody.innerHTML = '';

        // Group by number and then by originCode
        const numberGroups = {};
        saleEntries.forEach(entry => {
            if (!numberGroups[entry.number]) numberGroups[entry.number] = [];
            numberGroups[entry.number].push(entry);
        });

        // เตรียมตัวแปรรวมข้ามชุด
        let totalMyn = {cost:0, total:0, totalPrice:0, waiting:0, waitingPrice:0, sold:0, soldPrice:0, netSale:0, stock:0, stockPrice:0};
        let totalMoz = {cost:0, total:0, totalPrice:0, waiting:0, waitingPrice:0, sold:0, soldPrice:0, netSale:0, stock:0, stockPrice:0};

        // เพิ่ม modal popup สำหรับแสดงแถวปกติ
        if (!document.getElementById('detailModal')) {
            const modalHtml = `
            <div id="detailModal" style="display:none;position:fixed;z-index:9999;left:0;top:0;width:100vw;height:100vh;background:rgba(0,0,0,0.3);align-items:center;justify-content:center;">
              <div style="background:#fff;padding:24px 16px;min-width:320px;max-width:90vw;max-height:90vh;overflow:auto;border-radius:8px;position:relative;">
                <button id="closeDetailModal" style="position:absolute;top:8px;right:12px;font-size:18px;">&times;</button>
                <div id="detailModalContent"></div>
              </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            document.getElementById('closeDetailModal').onclick = function() {
              document.getElementById('detailModal').style.display = 'none';
            };
        }

        Object.entries(numberGroups).forEach(([number, entries]) => {
            // Group by originCode in this number
            const originGroups = {};
            entries.forEach(entry => {
                const origin = entry.originCode || 'อื่นๆ';
                if (!originGroups[origin]) originGroups[origin] = [];
                originGroups[origin].push(entry);
            });
            // สร้าง summary row สำหรับแต่ละ originCode (แสดง numberCell เฉพาะแถวแรกและ rowspan = จำนวน originGroups)
            Object.entries(originGroups).forEach(([origin, originEntries], idxOrigin) => {
                // รวมค่าทุกคอลัมป์
                let sumCostOfBatch = 0, sumTotal = 0, sumTotalPrice = 0, sumWaitingForSale = 0, sumWaitingForSalePrice = 0, sumSold = 0, sumSoldPrice = 0, sumSumNetSale = 0, sumTotalStock = 0, sumTotalStockPrice = 0;
                originEntries.forEach(saleEntry => {
                    const stocks = stockEntries.filter(stockEntry => stockEntry.batchID._id === saleEntry.batchID);
                    sumCostOfBatch += saleEntry.costOfBatch || 0;
                    sumTotal += saleEntry.total || 0;
                    sumTotalPrice += saleEntry.totalPrice || 0;
                    sumWaitingForSale += saleEntry.waitingForSale || 0;
                    sumWaitingForSalePrice += saleEntry.waitingForSalePrice || 0;
                    sumSold += saleEntry.sold || 0;
                    sumSoldPrice += saleEntry.soldPrice || 0;
                    sumSumNetSale += saleEntry.sumNetSale || 0;
                    sumTotalStock += stocks.reduce((sum, stock) => sum + (stock.addStock || 0), 0);
                    sumTotalStockPrice += stocks.reduce((sum, stock) => sum + (stock.addStock * stock.cost || 0), 0);
                });
                const readyForSale = sumTotalStock + sumTotal - (sumWaitingForSale + sumSold);
                const readyForSalePrice = sumTotalStockPrice + sumTotalPrice - (sumWaitingForSalePrice + sumSoldPrice);
                const sumNetScale = ((sumTotalStockPrice + sumTotalPrice) - sumCostOfBatch);
                const sumNetAll = sumNetScale + sumSumNetSale;
                // ชื่อ origin
                let originName = origin;
                if (origin === 'Myn') originName = 'พม่า';
                if (origin === 'Moz') originName = 'โมซัมบิก';
                // summary row (ใช้ numberCell เหมือนแถวปกติ)
                let numberCell = '';
                if (idxOrigin === 0) {
                    numberCell = `<td class="setCenter" rowspan="${Object.keys(originGroups).length}">${number}</td>`;
                }
                const summaryRow = `
                    <tr class="stock-row summary-row" data-number="${number}">
                        ${numberCell}
                        <td class="setText">${originName}</td>
                        <td class="setNumber">${sumCostOfBatch.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="setNumber">${(sumTotalStock + sumTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${(sumTotalStockPrice + sumTotalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                        <td class="setNumber">${readyForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${readyForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                        <td class="setNumber">${sumSold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${sumSoldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                        <td class="setNumber">${sumNetScale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="setNumber">${sumSumNetSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="setNumber">${sumNetAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', summaryRow);

                // เพิ่ม event ให้ summary row แรกของแต่ละชุด
                if (idxOrigin === 0) {
                    setTimeout(() => {
                        const summaryRow = document.querySelector(`tr.summary-row[data-number='${number}']`);
                        if (summaryRow) {
                            summaryRow.style.cursor = 'pointer';
                            summaryRow.onclick = function() {
                                // แยก detail row ตาม originCode
                                const detailByOrigin = { Myn: [], Moz: [], Other: [] };
                                entries.forEach((saleEntry) => {
                                    const origin = saleEntry.originCode === 'Myn' ? 'Myn' : saleEntry.originCode === 'Moz' ? 'Moz' : 'Other';
                                    detailByOrigin[origin].push(saleEntry);
                                });
                                let detailHtml = `<h4>รายละเอียดชุดที่ ${number}</h4>`;
                                // ฟังก์ชันสร้างตาราง detail
                                function buildDetailTable(originLabel, detailArr) {
                                    if (detailArr.length === 0) return '';
                                    let sumCost = 0, sumTotal = 0, sumTotalPrice = 0, sumSold = 0, sumSoldPrice = 0, sumWaiting = 0, sumWaitingPrice = 0, sumNetSaleTotal = 0, sumStock = 0, sumStockPrice = 0;
                                    let html = `<h5 style="margin:12px 0 4px 0;">${originLabel}</h5><table border="1" style="width:100%;border-collapse:collapse;margin-bottom:12px;"><thead><tr><th>ชื่อชุด</th><th>ทุน</th><th>พลอยชั่งได้</th><th>ขายได้</th><th>ทุนที่ขาย</th><th>กำไรชั่ง</th><th>กำไรขาย</th><th>กำไรรวม</th></tr></thead><tbody>`;
                                    detailArr.forEach((saleEntry) => {
                                        const { batchID, batchName, costOfBatch, total, totalPrice, waitingForSale, waitingForSalePrice, sold, soldPrice, sumNetSale } = saleEntry;
                                        const stocks = stockEntries.filter(stockEntry => stockEntry.batchID._id === batchID);
                                        const totalStock = stocks.reduce((sum, stock) => sum + (stock.addStock || 0), 0);
                                        const totalStockPrice = stocks.reduce((sum, stock) => sum + (stock.addStock * stock.cost || 0), 0);
                                        const readyForSale = totalStock + total - (waitingForSale + sold);
                                        const readyForSalePrice = totalStockPrice + totalPrice - (waitingForSalePrice + soldPrice);
                                        const sumNetScale = ((totalStockPrice + totalPrice) - costOfBatch);
                                        const sumNetAll = sumNetScale + sumNetSale;
                                        sumCost += costOfBatch || 0;
                                        sumTotal += total || 0;
                                        sumTotalPrice += totalPrice || 0;
                                        sumSold += sold || 0;
                                        sumSoldPrice += soldPrice || 0;
                                        sumWaiting += waitingForSale || 0;
                                        sumWaitingPrice += waitingForSalePrice || 0;
                                        sumNetSaleTotal += sumNetSale || 0;
                                        sumStock += totalStock;
                                        sumStockPrice += totalStockPrice;
                                        html += `<tr><td>${batchName}</td><td>${costOfBatch.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td>${(totalStock + total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${(totalStockPrice + totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td><td>${sold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td><td>${readyForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${readyForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td><td>${sumNetScale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td>${sumNetSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td>${sumNetAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>`;
                                    });
                                    // รวมท้ายตาราง
                                    const readyForSale = sumStock + sumTotal - (sumWaiting + sumSold);
                                    const readyForSalePrice = sumStockPrice + sumTotalPrice - (sumWaitingPrice + sumSoldPrice);
                                    const sumNetScale = ((sumStockPrice + sumTotalPrice) - sumCost);
                                    const sumNetAll = sumNetScale + sumNetSaleTotal;
                                    html += `<tr style="background:#f5f5f5;font-weight:bold;"><td>รวม</td><td>${sumCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td>${(sumStock + sumTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${(sumStockPrice + sumTotalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td><td>${sumSold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${sumSoldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td><td>${readyForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${readyForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td><td>${sumNetScale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td>${sumNetSaleTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td><td>${sumNetAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>`;
                                    html += '</tbody></table>';
                                    return html;
                                }
                                // end buildDetailTable
                                detailHtml += buildDetailTable('พม่า', detailByOrigin.Myn);
                                detailHtml += buildDetailTable('โมซัมบิก', detailByOrigin.Moz);
                                detailHtml += buildDetailTable('อื่นๆ', detailByOrigin.Other);
                                document.getElementById('detailModalContent').innerHTML = detailHtml;
                                document.getElementById('detailModal').style.display = 'flex';
                            };
                        }
                    }, 0);
                }

                // สะสมค่ารวมข้ามชุด
                if(origin === 'Myn') {
                    totalMyn.cost += sumCostOfBatch;
                    totalMyn.total += sumTotal;
                    totalMyn.totalPrice += sumTotalPrice;
                    totalMyn.waiting += sumWaitingForSale;
                    totalMyn.waitingPrice += sumWaitingForSalePrice;
                    totalMyn.sold += sumSold;
                    totalMyn.soldPrice += sumSoldPrice;
                    totalMyn.netSale += sumSumNetSale;
                    totalMyn.stock += sumTotalStock;
                    totalMyn.stockPrice += sumTotalStockPrice;
                }
                if(origin === 'Moz') {
                    totalMoz.cost += sumCostOfBatch;
                    totalMoz.total += sumTotal;
                    totalMoz.totalPrice += sumTotalPrice;
                    totalMoz.waiting += sumWaitingForSale;
                    totalMoz.waitingPrice += sumWaitingForSalePrice;
                    totalMoz.sold += sumSold;
                    totalMoz.soldPrice += sumSoldPrice;
                    totalMoz.netSale += sumSumNetSale;
                    totalMoz.stock += sumTotalStock;
                    totalMoz.stockPrice += sumTotalStockPrice;
                }
            });
            // วนลูปแสดงแถวปกติ (ซ่อนแถวปกติด้วย style="display:none;")
            entries.forEach((saleEntry, idx) => {
                const { batchID, batchName, originCode, costOfBatch, total, totalPrice, waitingForSale, waitingForSalePrice, sold, soldPrice, sumNetSale } = saleEntry;
                const stocks = stockEntries.filter(stockEntry => stockEntry.batchID._id === batchID);
                const totalStock = stocks.reduce((sum, stock) => sum + (stock.addStock || 0), 0);
                const totalStockPrice = stocks.reduce((sum, stock) => sum + (stock.addStock * stock.cost || 0), 0);
                const readyForSale = totalStock + total - (waitingForSale + sold);
                const readyForSalePrice = totalStockPrice + totalPrice - (waitingForSalePrice + soldPrice);
                const sumNetScale = ((totalStockPrice + totalPrice) - costOfBatch);
                const sumNetAll = sumNetScale + sumNetSale;
                // เฉพาะแถวแรกของ group นี้เท่านั้นที่แสดง <td> number
                let numberCell = '';
                if (idx === 0) {
                    numberCell = `<td class="setCenter" rowspan="${entries.length}">${number}</td>`;
                }
                const row = `
                    <tr class="stock-row" data-batchid="${batchID}" style="display:none;">
                        ${numberCell}
                    <td class="setText">${batchName}</td>
                    <td class="setNumber">${costOfBatch.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="setNumber">${(totalStock + total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${(totalStockPrice + totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                    <td class="setNumber">${readyForSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${readyForSalePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                    <td class="setNumber">${sold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                    <td class="setNumber">${sumNetScale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="setNumber">${sumNetSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="setNumber">${sumNetAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row);
            });
        });

        // เพิ่มแถวรวมพม่า
        const readyForSaleMyn = totalMyn.stock + totalMyn.total - (totalMyn.waiting + totalMyn.sold);
        const readyForSalePriceMyn = totalMyn.stockPrice + totalMyn.totalPrice - (totalMyn.waitingPrice + totalMyn.soldPrice);
        const sumNetScaleMyn = ((totalMyn.stockPrice + totalMyn.totalPrice) - totalMyn.cost);
        const sumNetAllMyn = sumNetScaleMyn + totalMyn.netSale;
        const rowMyn = `
            <tr class="stock-row summary-row" style="background:#e6f7ff;font-weight:bold;">
                <td class="setText" colspan="2">รวมพม่า (ทุกชุดที่เลือก)</td>
                <td class="setNumber">${totalMyn.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${(totalMyn.stock + totalMyn.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${(totalMyn.stockPrice + totalMyn.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${readyForSaleMyn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${readyForSalePriceMyn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${totalMyn.sold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${totalMyn.soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${sumNetScaleMyn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${totalMyn.netSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${sumNetAllMyn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', rowMyn);
        // เพิ่มแถวรวมโมซัมบิก
        const readyForSaleMoz = totalMoz.stock + totalMoz.total - (totalMoz.waiting + totalMoz.sold);
        const readyForSalePriceMoz = totalMoz.stockPrice + totalMoz.totalPrice - (totalMoz.waitingPrice + totalMoz.soldPrice);
        const sumNetScaleMoz = ((totalMoz.stockPrice + totalMoz.totalPrice) - totalMoz.cost);
        const sumNetAllMoz = sumNetScaleMoz + totalMoz.netSale;
        const rowMoz = `
            <tr class="stock-row summary-row" style="background:#fffbe6;font-weight:bold;">
                <td class="setText" colspan="2">รวมโมซัมบิก (ทุกชุดที่เลือก)</td>
                <td class="setNumber">${totalMoz.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${(totalMoz.stock + totalMoz.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${(totalMoz.stockPrice + totalMoz.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${readyForSaleMoz.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${readyForSalePriceMoz.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${totalMoz.sold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${totalMoz.soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${sumNetScaleMoz.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${totalMoz.netSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${sumNetAllMoz.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', rowMoz);
        // รวมทั้งหมด
        const totalAll = {
            cost: totalMyn.cost + totalMoz.cost,
            total: totalMyn.total + totalMoz.total,
            totalPrice: totalMyn.totalPrice + totalMoz.totalPrice,
            waiting: totalMyn.waiting + totalMoz.waiting,
            waitingPrice: totalMyn.waitingPrice + totalMoz.waitingPrice,
            sold: totalMyn.sold + totalMoz.sold,
            soldPrice: totalMyn.soldPrice + totalMoz.soldPrice,
            netSale: totalMyn.netSale + totalMoz.netSale,
            stock: totalMyn.stock + totalMoz.stock,
            stockPrice: totalMyn.stockPrice + totalMoz.stockPrice
        };
        const readyForSaleAll = totalAll.stock + totalAll.total - (totalAll.waiting + totalAll.sold);
        const readyForSalePriceAll = totalAll.stockPrice + totalAll.totalPrice - (totalAll.waitingPrice + totalAll.soldPrice);
        const sumNetScaleAll = ((totalAll.stockPrice + totalAll.totalPrice) - totalAll.cost);
        const sumNetAllAll = sumNetScaleAll + totalAll.netSale;
        const rowAll = `
            <tr class="stock-row summary-row" style="background:#eaffea;font-weight:bold;">
                <td class="setText" colspan="2">รวมทั้งหมด (ทุกชุดที่เลือก)</td>
                <td class="setNumber">${totalAll.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${(totalAll.stock + totalAll.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${(totalAll.stockPrice + totalAll.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${readyForSaleAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${readyForSalePriceAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${totalAll.sold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${totalAll.soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${sumNetScaleAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${totalAll.netSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${sumNetAllAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', rowAll);

    } catch (error) {
        console.error('Error updating batch table:', error);
        document.getElementById('batchProfitOriginTableBody').innerHTML = '<tr><td colspan="8">เกิดข้อผิดพลาดในการดึงข้อมูล</td></tr>';
    }
}