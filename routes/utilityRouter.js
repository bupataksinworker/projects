async function getTotalValues(sale) {

    // --------------------- result foot table ---------------------------------------------------
    const totalPreSaleSum = await sale.getTotalPreSaleSum(); // open
    const totalPreSaleAfterDC = await sale.totalPreSaleAfterDC(); // open-dc

    const totalSaleSum = await sale.getTotalSaleSum(); // close
    const totalSaleAfterDC = await sale.totalSaleAfterDC(); //close-dc

    const totalPreSaleCost = await sale.totalPreSaleCost(); // cost of open
    const totalSaleCost = await sale.totalSaleCost(); // cosr of close

    const totalPreSaleProfit = await sale.totalPreSaleProfit(); // open profit
    const totalSaleProfit = await sale.totalSaleProfit(); // close profit

    //-------------------- result batch table ----------------------------------------------------
    
    const getTotalSumByBatch = await sale.getTotalSumByBatch(); // open all by batch

    //-------------------- return export ---------------------------------------------------------
    return {
        totalPreSaleSum,
        totalPreSaleAfterDC,
        totalSaleSum,
        totalSaleAfterDC,
        totalPreSaleCost,
        totalSaleCost,
        totalPreSaleProfit,
        totalSaleProfit,
        getTotalSumByBatch
    };
}

module.exports = { getTotalValues };