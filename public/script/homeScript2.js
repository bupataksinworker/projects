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
        let totalMyn = { cost: 0, total: 0, totalPrice: 0, waiting: 0, waitingPrice: 0, sold: 0, soldPrice: 0, netSale: 0, stock: 0, stockPrice: 0 };
        let totalMyn2 = { cost: 0, total: 0, totalPrice: 0, waiting: 0, waitingPrice: 0, sold: 0, soldPrice: 0, netSale: 0, stock: 0, stockPrice: 0 };
        let totalMoz = { cost: 0, total: 0, totalPrice: 0, waiting: 0, waitingPrice: 0, sold: 0, soldPrice: 0, netSale: 0, stock: 0, stockPrice: 0 };
        let totalMoz2 = { cost: 0, total: 0, totalPrice: 0, waiting: 0, waitingPrice: 0, sold: 0, soldPrice: 0, netSale: 0, stock: 0, stockPrice: 0 };

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
            document.getElementById('closeDetailModal').onclick = function () {
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
                let sumSumSale = 0, sumCostOfBatch = 0, sumTotal = 0, sumTotalPrice = 0, sumWaitingForSale = 0, sumWaitingForSalePrice = 0, sumSold = 0, sumSoldPrice = 0, sumSumNetSale = 0, sumTotalStock = 0, sumTotalStockPrice = 0;
                let sumSumSale2 = 0,  sumCostOfBatch2 = 0, sumTotal2 = 0, sumTotalPrice2 = 0, sumWaitingForSale2 = 0, sumWaitingForSalePrice2 = 0, sumSold2 = 0, sumSoldPrice2 = 0, sumSumNetSale2 = 0, sumTotalStock2 = 0, sumTotalStockPrice2 = 0;
                originEntries.forEach(saleEntry => {
                    const stocks = stockEntries.filter(stockEntry => stockEntry.batchID._id === saleEntry.batchID);
                    if (saleEntry.costOfBatch > 0) {
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
                    } else if (saleEntry.costOfBatch <= 0) {
                        sumCostOfBatch2 += saleEntry.costOfBatch || 0;
                        sumTotal2 += saleEntry.total || 0;
                        sumTotalPrice2 += saleEntry.totalPrice || 0;
                        sumWaitingForSale2 += saleEntry.waitingForSale || 0;
                        sumWaitingForSalePrice2 += saleEntry.waitingForSalePrice || 0;
                        sumSold2 += saleEntry.sold || 0;
                        sumSoldPrice2 += saleEntry.soldPrice || 0;
                        sumSumNetSale2 += saleEntry.sumNetSale || 0;
                        sumTotalStock2 += stocks.reduce((sum, stock) => sum + (stock.addStock || 0), 0);
                        sumTotalStockPrice2 += stocks.reduce((sum, stock) => sum + (stock.addStock * stock.cost || 0), 0);
                    }

                });

                const readyForSale = sumTotalStock + sumTotal - (sumWaitingForSale + sumSold);
                const readyForSalePrice = sumTotalStockPrice + sumTotalPrice - (sumWaitingForSalePrice + sumSoldPrice);
                const sumNetScale = ((sumTotalStockPrice + sumTotalPrice) - sumCostOfBatch);
                const sumNetAll = sumNetScale + sumSumNetSale;
                sumSumSale = sumSoldPrice + sumSumNetSale; // ขายได้

                const readyForSale2 = sumTotalStock2 + sumTotal2 - (sumWaitingForSale2 + sumSold2);
                const readyForSalePrice2 = sumTotalStockPrice2 + sumTotalPrice2 - (sumWaitingForSalePrice2 + sumSoldPrice2);
                const sumNetScale2 = ((sumTotalStockPrice2 + sumTotalPrice2) - sumCostOfBatch2);
                const sumNetAll2 = sumSoldPrice2 + sumSumNetSale2; // กำไรรวม ไม่มีทุน
                sumSumSale2 = sumSoldPrice2 + sumSumNetSale2; // ขายได้ ไม่มีทุน

                // ชื่อ origin
                let originName = origin;
                if (origin === 'Myn') originName = 'พม่า';
                if (origin === 'Moz') originName = 'โมซัมบิก';
                // summary row (ใช้ numberCell เหมือนแถวปกติ)
                let numberCell = '';
                if (idxOrigin === 0) {
                    numberCell = `<td class="setCenter" rowspan="${Object.keys(originGroups).length * 2}">${number}</td>`;
                }
                const summaryRow = `
                    <tr class="stock-row summary-row" data-number="${number}">
                        ${numberCell}
                        <td class="setText">${originName}</td>
                        <td class="setNumber">${sumCostOfBatch.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="setNumber">${(sumTotalStock + sumTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${(sumTotalStockPrice + sumTotalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                        <td class="setNumber">${sumSumSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="setNumber">${sumSold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${sumSoldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                        <td class="setNumber">${sumNetScale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="setNumber">${sumSumNetSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="setNumber">${sumNetAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                    <tr class="stock-row summary-row" data-number="${number}">
                        <td class="setText">${originName} ไม่มีทุน</td>
                        <td class="setNumber">${sumCostOfBatch2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="setNumber">${(sumTotalStock2 + sumTotal2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${(sumTotalStockPrice2 + sumTotalPrice2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                        <td class="setNumber">${sumSumSale2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="setNumber">${sumSold2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${sumSoldPrice2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                        <td class="setNumber">${sumNetScale2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="setNumber">${sumSumSale2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td class="setNumber">${sumNetAll2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', summaryRow);

                // เพิ่ม event ให้ summary row แรกของแต่ละชุด

                // เพิ่ม event ปิด modal เมื่อคลิกนอกกล่อง
                const detailModal = document.getElementById('detailModal');
                if (detailModal && !detailModal._outsideClickHandlerAdded) {
                    detailModal.addEventListener('click', function (e) {
                        if (e.target === detailModal) {
                            detailModal.style.display = 'none';
                        }
                    });
                    detailModal._outsideClickHandlerAdded = true;
                }
                if (idxOrigin === 0 && numberCell) {
                    setTimeout(() => {
                        // หา td ของ numberCell ที่เพิ่งสร้าง (rowspan)
                        const summaryRow = tableBody.querySelector(`tr.summary-row[data-number='${number}']`);
                        if (summaryRow) {
                            const numberTd = summaryRow.querySelector('td[role="numberCell"], td.setCenter');
                            if (numberTd) {
                                numberTd.style.cursor = 'pointer';
                                numberTd.title = 'คลิกเพื่อดูรายละเอียด';
                                numberTd.onclick = function (e) {
                                    e.stopPropagation();
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
                                        let sumSumSale = 0, sumNetAllTotal = 0;
                                        let html = `<h5 style="margin:12px 0 4px 0;">${originLabel}</h5><table border="1" style="width:100%;border-collapse:collapse;margin-bottom:12px;"><thead><tr><th>ชื่อชุด</th><th>ทุน</th><th>พลอยชั่งได้</th><th>ขายได้</th><th>ทุนที่ขาย</th><th>กำไรชั่ง</th><th>กำไรขาย</th><th>กำไรรวม</th></tr></thead><tbody>`;
                                        detailArr.forEach((saleEntry) => {
                                            const { batchID, batchName, costOfBatch, total, totalPrice, waitingForSale, waitingForSalePrice, sold, soldPrice, sumNetSale } = saleEntry;
                                            const stocks = stockEntries.filter(stockEntry => stockEntry.batchID._id === batchID);
                                            
                                            const totalStock = stocks.reduce((sum, stock) => sum + (stock.addStock || 0), 0);
                                            const totalStockPrice = stocks.reduce((sum, stock) => sum + (stock.addStock * stock.cost || 0), 0);
                                            const readyForSale = totalStock + total - (waitingForSale + sold);
                                            const readyForSalePrice = totalStockPrice + totalPrice - (waitingForSalePrice + soldPrice);
                                            const sumNetScale = ((totalStockPrice + totalPrice) - costOfBatch);
                                            const sumNetAll = costOfBatch > 0
                                                ? sumNetScale + sumNetSale // กำไร รวม มีทุน
                                                : soldPrice + sumNetSale; // กำไร รวม ไม่มีทุน

                                            const sumSale = costOfBatch > 0
                                                ? soldPrice + sumNetSale // ขายได้ มีทุน
                                                : soldPrice + sumNetSale; // ขายได้ ไม่มีทุน

                                            const sumNetSaleAll = costOfBatch > 0
                                                ? sumNetSale // กำไรขาย มีทุน
                                                : soldPrice + sumNetSale; // กำไรขาย ไม่มีทุน
                                            
                                            sumSumSale += sumSale;
                                            sumCost += costOfBatch || 0;
                                            sumTotal += total || 0;
                                            sumTotalPrice += totalPrice || 0;
                                            sumSold += sold || 0;
                                            sumSoldPrice += soldPrice || 0;
                                            sumWaiting += waitingForSale || 0;
                                            sumWaitingPrice += waitingForSalePrice || 0;
                                            sumNetSaleTotal += sumNetSaleAll || 0;
                                            sumStock += totalStock;
                                            sumStockPrice += totalStockPrice;
                                            sumNetAllTotal += sumNetAll || 0;
                                            html += `<tr>
                                                <td>${batchName}</td>
                                                <td>${costOfBatch.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td>${(totalStock + total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${(totalStockPrice + totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                                                <td>${sumSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td>${sold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                                                <td>${sumNetScale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td>${sumNetSaleAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td>${sumNetAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            </tr>`;
                                        });
                                        // รวมท้ายตาราง
                                        const readyForSale = sumStock + sumTotal - (sumWaiting + sumSold);
                                        const readyForSalePrice = sumStockPrice + sumTotalPrice - (sumWaitingPrice + sumSoldPrice);
                                        const sumNetScale = ((sumStockPrice + sumTotalPrice) - sumCost);
             
                                        html += `<tr style="background:#f5f5f5;font-weight:bold;">
                                        <td>รวม</td>
                                        <td>${sumCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td>${(sumStock + sumTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${(sumStockPrice + sumTotalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                                        <td>${sumSumSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td>${sumSold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${sumSoldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                                        <td>${sumNetScale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td>${sumNetSaleTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        <td>${sumNetAllTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td></tr>`;
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
                        }
                    }, 0);
                }

                // สะสมค่ารวมข้ามชุด
                if (origin === 'Myn') {
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

                    totalMyn2.cost += sumCostOfBatch2;
                    totalMyn2.total += sumTotal2;
                    totalMyn2.totalPrice += sumTotalPrice2;
                    totalMyn2.waiting += sumWaitingForSale2;
                    totalMyn2.waitingPrice += sumWaitingForSalePrice2;
                    totalMyn2.sold += sumSold2;
                    totalMyn2.soldPrice += sumSoldPrice2;
                    totalMyn2.netSale += sumSumNetSale2;
                    totalMyn2.stock += sumTotalStock2;
                    totalMyn2.stockPrice += sumTotalStockPrice2;
                }
                if (origin === 'Moz') {
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

                    totalMoz2.cost += sumCostOfBatch2;
                    totalMoz2.total += sumTotal2;
                    totalMoz2.totalPrice += sumTotalPrice2;
                    totalMoz2.waiting += sumWaitingForSale2;
                    totalMoz2.waitingPrice += sumWaitingForSalePrice2;
                    totalMoz2.sold += sumSold2;
                    totalMoz2.soldPrice += sumSoldPrice2;
                    totalMoz2.netSale += sumSumNetSale2;
                    totalMoz2.stock += sumTotalStock2;
                    totalMoz2.stockPrice += sumTotalStockPrice2;
                }
            });

        });

        // เพิ่มแถวรวมพม่า
        const readyForSaleMyn = totalMyn.stock + totalMyn.total - (totalMyn.waiting + totalMyn.sold);
        const readyForSalePriceMyn = totalMyn.stockPrice + totalMyn.totalPrice - (totalMyn.waitingPrice + totalMyn.soldPrice);
        const sumNetScaleMyn = ((totalMyn.stockPrice + totalMyn.totalPrice) - totalMyn.cost);
        const sumNetAllMyn = sumNetScaleMyn + totalMyn.netSale;
        const sumSaleMyn = totalMyn.soldPrice + totalMyn.netSale; // ขายได้

        const readyForSaleMyn2 = totalMyn2.stock + totalMyn2.total - (totalMyn2.waiting + totalMyn2.sold);
        const readyForSalePriceMyn2 = totalMyn2.stockPrice + totalMyn2.totalPrice - (totalMyn2.waitingPrice + totalMyn2.soldPrice);
        const sumNetScaleMyn2 = ((totalMyn2.stockPrice + totalMyn2.totalPrice) - totalMyn2.cost);
        const sumNetAllMyn2 = totalMyn2.soldPrice + totalMyn2.netSale;
        const sumSaleMyn2 = totalMyn2.soldPrice + totalMyn2.netSale; // ขายได้

        const rowMyn = `
            <tr class="stock-row summary-row" style="background:#e6f7ff;font-weight:bold;">
                <td class="setText" colspan="2">รวมพม่า (ทุกชุดที่เลือก)</td>
                <td class="setNumber">${totalMyn.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${(totalMyn.stock + totalMyn.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${(totalMyn.stockPrice + totalMyn.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${sumSaleMyn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${totalMyn.sold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${totalMyn.soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${sumNetScaleMyn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${totalMyn.netSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${sumNetAllMyn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr class="stock-row summary-row" style="background:#e6f7ff;font-weight:bold;">
                <td class="setText" colspan="2">รวมพม่า ไม่มีทุน (ทุกชุดที่เลือก)</td>
                <td class="setNumber">${totalMyn2.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${(totalMyn2.stock + totalMyn2.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${(totalMyn2.stockPrice + totalMyn2.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${sumSaleMyn2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${totalMyn2.sold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${totalMyn2.soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${sumNetScaleMyn2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${sumSaleMyn2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${sumNetAllMyn2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', rowMyn);

        // เพิ่มแถวรวมโมซัมบิก
        const readyForSaleMoz = totalMoz.stock + totalMoz.total - (totalMoz.waiting + totalMoz.sold);
        const readyForSalePriceMoz = totalMoz.stockPrice + totalMoz.totalPrice - (totalMoz.waitingPrice + totalMoz.soldPrice);
        const sumNetScaleMoz = ((totalMoz.stockPrice + totalMoz.totalPrice) - totalMoz.cost);
        const sumNetAllMoz = sumNetScaleMoz + totalMoz.netSale;
        const sumSaleMoz = totalMoz.soldPrice + totalMoz.netSale; // ขายได้

        const readyForSaleMoz2 = totalMoz2.stock + totalMoz2.total - (totalMoz2.waiting + totalMoz2.sold);
        const readyForSalePriceMoz2 = totalMoz2.stockPrice + totalMoz2.totalPrice - (totalMoz2.waitingPrice + totalMoz2.soldPrice);
        const sumNetScaleMoz2 = ((totalMoz2.stockPrice + totalMoz2.totalPrice) - totalMoz2.cost);
        const sumNetAllMoz2 = totalMoz2.soldPrice + totalMoz2.netSale;
        const sumSaleMoz2 = totalMoz2.soldPrice + totalMoz2.netSale; // ขายได้

        const rowMoz = `
            <tr class="stock-row summary-row" style="background:#fffbe6;font-weight:bold;">
                <td class="setText" colspan="2">รวมโมซัมบิก (ทุกชุดที่เลือก)</td>
                <td class="setNumber">${totalMoz.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${(totalMoz.stock + totalMoz.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${(totalMoz.stockPrice + totalMoz.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${sumSaleMoz.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${totalMoz.sold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${totalMoz.soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${sumNetScaleMoz.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${totalMoz.netSale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${sumNetAllMoz.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
             <tr class="stock-row summary-row" style="background:#fffbe6;font-weight:bold;">
                <td class="setText" colspan="2">รวมโมซัมบิก ไม่มีทัน (ทุกชุดที่เลือก)</td>
                <td class="setNumber">${totalMoz2.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${(totalMoz2.stock + totalMoz2.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${(totalMoz2.stockPrice + totalMoz2.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${sumSaleMoz2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${totalMoz2.sold.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${totalMoz2.soldPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${sumNetScaleMoz2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${sumSaleMoz2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${sumNetAllMoz2.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `;
        tableBody.insertAdjacentHTML('beforeend', rowMoz);
        // รวมทั้งหมด
        const totalAll = {
            cost: totalMyn.cost + totalMoz.cost + totalMyn2.cost + totalMoz2.cost,
            total: totalMyn.total + totalMoz.total + totalMyn2.total + totalMoz2.total,
            totalPrice: totalMyn.totalPrice + totalMoz.totalPrice + totalMyn2.totalPrice + totalMoz2.totalPrice,
            waiting: totalMyn.waiting + totalMoz.waiting + totalMyn2.waiting + totalMoz2.waiting,
            waitingPrice: totalMyn.waitingPrice + totalMoz.waitingPrice + totalMyn2.waitingPrice + totalMoz2.waitingPrice,
            sold: totalMyn.sold + totalMoz.sold + totalMyn2.sold + totalMoz2.sold,
            soldPrice: totalMyn.soldPrice + totalMoz.soldPrice + totalMyn2.soldPrice + totalMoz2.soldPrice,
            netSale: totalMyn.netSale + totalMoz.netSale + sumSaleMyn2 + sumSaleMoz2,
            stock: totalMyn.stock + totalMoz.stock + totalMyn2.stock + totalMoz2.stock,
            stockPrice: totalMyn.stockPrice + totalMoz.stockPrice + totalMyn2.stockPrice + totalMoz2.stockPrice
        };
        const readyForSaleAll = totalAll.stock + totalAll.total - (totalAll.waiting + totalAll.sold);
        const readyForSalePriceAll = totalAll.stockPrice + totalAll.totalPrice - (totalAll.waitingPrice + totalAll.soldPrice);
        const sumNetScaleAll = ((totalAll.stockPrice + totalAll.totalPrice) - totalAll.cost);
        const sumNetAllAll = sumNetScaleAll + totalAll.netSale;
        const sumSaleAll = sumSaleMyn + sumSaleMyn2 + sumSaleMoz + sumSaleMoz2; // ขายได้

        const rowAll = `
            <tr class="stock-row summary-row" style="background:#eaffea;font-weight:bold;">
                <td class="setText" colspan="2">รวมทั้งหมด (ทุกชุดที่เลือก)</td>
                <td class="setNumber">${totalAll.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="setNumber">${(totalAll.stock + totalAll.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br>(${(totalAll.stockPrice + totalAll.totalPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</td>
                <td class="setNumber">${sumSaleAll.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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