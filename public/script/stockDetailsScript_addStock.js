document.addEventListener('DOMContentLoaded', function () {
    const dropdown = document.getElementById('typeDetails_dropdown');
    const sizeDetailsDropdown = document.getElementById('sizeDetails_dropdown');
    const gradeDetailsDropdown = document.getElementById('gradeDetails_dropdown');
    const costDropdown = document.getElementById('cost_dropdown'); // เพิ่ม dropdown สำหรับ cost

    // เมื่อมีการเลือกใน typeDetails_dropdown
    dropdown.addEventListener('change', function () {
        const selectedType = this.value;

        // ตรวจสอบว่ามีการเลือกค่าแล้วหรือยัง
        if (selectedType) {
            // Query ไปยัง server เพื่อดึงข้อมูล size ที่ตรงกับ type
            fetch(`/selectedType?typeID=${selectedType}`)
                .then(response => response.json())
                .then(data => {
                    // เข้าถึงข้อมูล ที่ส่งมาภายใน JSON object
                    const sizes = data.sizes;
                    const grades = data.grades;

                    // ล้างข้อมูลเดิมใน sizeDetailsDropdown
                    sizeDetailsDropdown.innerHTML = '<option value="">เลือกไซส์</option>';

                    // เพิ่มข้อมูลใหม่จาก server
                    sizes.forEach(size => {
                        const option = document.createElement('option');
                        option.value = size._id;
                        option.textContent = size.sizeName;
                        sizeDetailsDropdown.appendChild(option);
                    });

                    // ล้างข้อมูลของ gradeDetailsDropdown และ costDropdown เมื่อต้องการเลือกไซส์ใหม่
                    gradeDetailsDropdown.innerHTML = '<option value="">เลือกเกรด</option>';
                    costDropdown.innerHTML = '<option value="">เลือกต้นทุน</option>';

                })
                .catch(error => console.error('Error fetching sizes:', error));
        } else {
            // ถ้าไม่ได้เลือกอะไรให้ล้าง dropdown ของ size และ grade และ cost
            sizeDetailsDropdown.innerHTML = '<option value="">เลือกไซส์</option>';
            gradeDetailsDropdown.innerHTML = '<option value="">เลือกเกรด</option>';
            costDropdown.innerHTML = '<option value="">เลือกต้นทุน</option>';
        }
    });

    // เมื่อมีการเลือกใน sizeDetailsDropdown
    sizeDetailsDropdown.addEventListener('change', function () {
        const selectedSize = this.value;
        const selectedType = dropdown.value;

        // ตรวจสอบว่ามีการเลือกค่าแล้วหรือยัง
        if (selectedSize && selectedType) {
            // Query ไปยัง server เพื่อดึงข้อมูล grade ที่ตรงกับ type และ size
            fetch(`/selectedType?typeID=${selectedType}`)
                .then(response => response.json())
                .then(data => {
                    // เข้าถึงข้อมูล ที่ส่งมาภายใน JSON object
                    const sizes = data.sizes;
                    const grades = data.grades;
                    const products = data.products;
                    // กรองข้อมูล grades โดยใช้ products
                    const filteredGrades = grades.filter(grade => 
                        products.some(product => 
                            product.gradeID._id === grade._id && product.sizeID._id === selectedSize
                        )
                    );
                    console.log('Filtered grades:', filteredGrades);

                    // ล้างข้อมูลเดิมใน gradeDetailsDropdown
                    gradeDetailsDropdown.innerHTML = '<option value="">เลือกเกรด</option>';

                    // เพิ่มข้อมูลใหม่จาก server
                    filteredGrades.forEach(grade => {
                        const option = document.createElement('option');
                        option.value = grade._id;
                        option.textContent = grade.gradeName;
                        gradeDetailsDropdown.appendChild(option);
                    });
                })
                .catch(error => console.error('Error fetching grades:', error));
        } else {
            // ถ้าไม่ได้เลือกอะไรให้ล้าง dropdown ของ grade
            gradeDetailsDropdown.innerHTML = '<option value="">เลือกเกรด</option>';
        }
    });

    // เมื่อมีการเลือกใน sizeDetailsDropdown
    dropdown.addEventListener('change', function () {
        getCost(); // เรียก getCost เมื่อ type ถูกเปลี่ยนแปลง
    });

    // เมื่อมีการเลือกใน sizeDetailsDropdown
    sizeDetailsDropdown.addEventListener('change', function () {
        getCost(); // เรียก getCost เมื่อ size ถูกเปลี่ยนแปลง
    });

    // เมื่อมีการเลือกใน gradeDetailsDropdown
    gradeDetailsDropdown.addEventListener('change', function () {
        getCost(); // เรียก getCost เมื่อ grade ถูกเปลี่ยนแปลง
    });

});

// เมื่อคลิกเข้าไปที่ช่อง input ให้คลุมดำข้อมูลทั้งหมดในช่อง
document.getElementById('stockQuantityInput').addEventListener('focus', function () {
    this.select();
});

document.getElementById('addStockButton').addEventListener('click', function () {

    // ใช้ URLSearchParams เพื่อดึงค่าจาก query string
    const urlParams = new URLSearchParams(window.location.search);
    const batchID = urlParams.get('batchID'); // ดึงค่า batchID จาก query string
    const year = urlParams.get('year'); // ดึงค่า year จาก query string

    console.log('Batch ID:', batchID); // ตรวจสอบว่าได้ค่า batchID หรือไม่
    console.log('Year:', year); // ตรวจสอบว่าได้ค่า year หรือไม่


    // ดึงค่าจาก dropdown และ input fields
    const typeID = document.getElementById('typeDetails_dropdown').value;
    const sizeID = document.getElementById('sizeDetails_dropdown').value;
    const gradeID = document.getElementById('gradeDetails_dropdown').value;
    const cost = document.getElementById('cost_dropdown').value;
    const addStock = parseFloat(document.getElementById('stockQuantityInput').value);
    const comment = document.getElementById('textComment').value;

    // ตรวจสอบข้อมูลที่ได้รับ
    if (!typeID || !sizeID || !gradeID || !cost || addStock <= 0) {
        alert('กรุณาระบุข้อมูลให้ครบถ้วน');
        return;
    }

    // ดึงค่า grainID จาก typeID ผ่าน API
    fetch(`/api/getGrainByType/${typeID}`)
        .then(response => response.json())
        .then(data => {
            const grainID = data.grainID;

            // ตรวจสอบว่ามี grainID หรือไม่
            if (!grainID) {
                alert('ไม่พบข้อมูล grainID');
                return;
            }

            // ข้อมูลที่ต้องส่งไปยัง API
            const stockData = {
                batchID,
                typeID,
                sizeID,
                gradeID,
                cost,
                addStock,
                comment
            };

            // ส่งข้อมูลไปที่ API ผ่าน fetch
            fetch('/api/addStock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(stockData),
            })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        alert('เพิ่มสต๊อกสำเร็จ');
                        // Refresh ทั้ง 3 ตารางหลังจากเพิ่มสต๊อกสำเร็จ
                        updateTableType(year, batchID); // เรียกฟังก์ชันเพื่ออัปเดตตารางประเภท (Type)
                        updateTableSize(batchID, typeID, grainID); // เรียกฟังก์ชันเพื่ออัปเดตตารางไซส์ (Size)
                        updateTableGrade(batchID, typeID, sizeID); // เรียกฟังก์ชันเพื่ออัปเดตตารางเกรด (Grade)
                        document.getElementById('stockQuantityInput').value = 0;
                        document.getElementById('textComment').value = '';
                    } else {
                        alert('เกิดข้อผิดพลาดในการเพิ่มสต๊อก');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
                });
        })
        .catch(error => {
            console.error('Error fetching grainID:', error);
            alert('เกิดข้อผิดพลาดในการดึงข้อมูล grainID');
        });
});

// ฟังก์ชันสำหรับดึงข้อมูล cost
function getCost() {
    const dropdown = document.getElementById('typeDetails_dropdown');
    const sizeDetailsDropdown = document.getElementById('sizeDetails_dropdown');
    const gradeDetailsDropdown = document.getElementById('gradeDetails_dropdown');
    const costDropdown = document.getElementById('cost_dropdown'); // Dropdown สำหรับ cost

    const selectedType = dropdown.value;
    const selectedSize = sizeDetailsDropdown.value;
    const selectedGrade = gradeDetailsDropdown.value;

    // ตรวจสอบว่ามีการเลือกค่าครบทั้ง 3 dropdown หรือไม่
    if (selectedType && selectedSize && selectedGrade) {
        // ล้าง dropdown ต้นทุนก่อนเพื่อให้พร้อมสำหรับข้อมูลใหม่
        costDropdown.innerHTML = '<option value="">กำลังโหลดข้อมูลต้นทุน...</option>';

        // Query ไปยัง server เพื่อดึงข้อมูล cost ที่ตรงกับ typeID, sizeID, gradeID
        fetch(`/api/getCostByDetails?typeID=${selectedType}&sizeID=${selectedSize}&gradeID=${selectedGrade}`)
            .then(response => response.json())
            .then(data => {
                // ล้างข้อมูลเดิมใน costDropdown เมื่อข้อมูลถูกดึงเรียบร้อย
                costDropdown.innerHTML = '';

                if (data.success && data.costs.length > 0) {
                    // เพิ่มตัวเลือกใน dropdown สำหรับแต่ละค่า cost
                    data.costs.forEach((cost, index) => {
                        const option = document.createElement('option');
                        option.value = cost.costOfProduct;
                        option.textContent = (cost.costOfProduct).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        costDropdown.appendChild(option);

                        // เลือกรายการแรกใน dropdown โดยอัตโนมัติ
                        if (index === 0) {
                            costDropdown.selectedIndex = 0;
                        }
                    });
                } else {
                    // ถ้าไม่พบข้อมูล ให้แสดงข้อความแจ้งเตือนใน dropdown
                    costDropdown.innerHTML = '<option value="">ไม่พบข้อมูลต้นทุน</option>';
                }
            })
            .catch(error => {
                console.error('Error fetching cost:', error);
                // แสดงข้อความแจ้งเตือนในกรณีที่มีข้อผิดพลาด
                costDropdown.innerHTML = '<option value="">เกิดข้อผิดพลาดในการดึงข้อมูล</option>';
            });
    } else {
        // ล้าง dropdown ต้นทุน หากยังเลือกค่าไม่ครบ
        costDropdown.innerHTML = '<option value="">กรุณาเลือกประเภท ไซส์ และเกรด</option>';
    }
}
