const dataContainer = document.getElementById('dataContainer');
let sales = [];
let saleEntries = [];
try {
    const data = JSON.parse(dataContainer.getAttribute('data-json'));
    sales = data.sales;
    saleEntries = data.saleEntries;
    console.log('Parsed sales data:', sales);
    console.log('Parsed sale entries data:', saleEntries);
} catch (e) {
    console.error('Error parsing data:', e);
}

if (!Array.isArray(sales)) {
    console.error('Sales data is not an array:', sales);
    sales = [];
}

if (!Array.isArray(saleEntries)) {
    console.error('Sale entries data is not an array:', saleEntries);
    saleEntries = [];
}

const salesData = sales.reduce((acc, sale) => {
    if (sale.saleDate && sale.totalValues.totalSaleSum) {
        const month = moment(sale.saleDate).format('YYYY-MM');
        acc[month] = (acc[month] || 0) + sale.totalValues.totalSaleSum;
    }
    return acc;
}, {});

function updateChart(year) {
    const labels = [];
    const data = [];

    for (let i = 1; i <= 12; i++) {
        const month = moment(`${year}-${String(i).padStart(2, '0')}`, 'YYYY-MM').format('YYYY-MM');
        labels.push(month);
        data.push(salesData[month] || 0);
    }

    salesChart.data.labels = labels;
    salesChart.data.datasets[0].data = data;
    salesChart.data.datasets[0].label = `ยอดขายในแต่ละเดือนของปี ${year}`;
    salesChart.update();
}

const ctx = document.getElementById('salesChart').getContext('2d');
const salesChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: '',
            data: [],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            x: {
                type: 'category'
            },
            y: {
                beginAtZero: true
            }
        },
        responsive: true,
        maintainAspectRatio: false
    }
});

function updateChartCustomer(year) {
    const customerSalesData = sales.reduce((acc, sale) => {
        const saleYear = moment(sale.saleDate).year();
        if (saleYear == year && sale.totalValues.totalSaleSum > 0) {
            const customerName = sale.customerID.customerName;
            acc[customerName] = (acc[customerName] || 0) + sale.totalValues.totalSaleSum;
        }
        return acc;
    }, {});

    const customerLabels = Object.keys(customerSalesData);
    const customerData = customerLabels.map(label => customerSalesData[label]);

    customerPieChart.data.labels = customerLabels;
    customerPieChart.data.datasets[0].data = customerData;
    customerPieChart.data.datasets[0].label = `ยอดขายรวมของลูกค้าในปี ${year}`;
    customerPieChart.data.datasets[0].backgroundColor = customerLabels.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.2)`);
    customerPieChart.data.datasets[0].borderColor = customerLabels.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`);
    customerPieChart.update();
}

const pieCtx = document.getElementById('customerPieChart').getContext('2d');
const customerPieChart = new Chart(pieCtx, {
    type: 'pie',
    data: {
        labels: [],
        datasets: [{
            label: '',
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false
    }
});

function updateChartBatch(year) {
    const batchSalesData = saleEntries.reduce((acc, entry) => {
        const entryYear = moment(entry.entryDate).year();
        if (entryYear == year && entry.totalSale > 0) {
            const batchName = entry.batchID.batchName; // assuming batchName is a field in SaleEntry
            acc[batchName] = (acc[batchName] || 0) + entry.totalSale;
        }
        return acc;
    }, {});

    const batchLabels = Object.keys(batchSalesData);
    const batchData = batchLabels.map(label => batchSalesData[label]);

    batchBarChart.data.labels = batchLabels;
    batchBarChart.data.datasets[0].data = batchData;
    batchBarChart.data.datasets[0].label = `ยอดขายรวมของชุดในปี ${year}`;
    batchBarChart.data.datasets[0].backgroundColor = batchLabels.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.2)`);
    batchBarChart.data.datasets[0].borderColor = batchLabels.map(() => `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`);
    batchBarChart.update();
}

const batchCtx = document.getElementById('batchBarChart').getContext('2d');
const batchBarChart = new Chart(batchCtx, {
    type: 'bar',
    data: {
        labels: [],
        datasets: [{
            label: '',
            data: [],
            backgroundColor: [],
            borderColor: [],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

const yearSelector = document.getElementById('yearSelector');
const currentYear = moment().year();
const startYear = currentYear - 2;

for (let year = startYear; year <= currentYear; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.text = 'ข้อมูลปี ' + year;
    yearSelector.appendChild(option);
}

yearSelector.value = currentYear;
updateChart(currentYear);
updateChartCustomer(currentYear);
updateChartBatch(currentYear);

yearSelector.addEventListener('change', (e) => {
    const selectedYear = e.target.value;
    updateChart(selectedYear);
    updateChartCustomer(selectedYear);
    updateChartBatch(selectedYear);
});