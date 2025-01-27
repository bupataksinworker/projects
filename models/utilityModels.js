// ฟังก์ชันเพื่อสร้างค่าเริ่มต้นสำหรับ costDate ในรูปแบบ dd-MM-yyyy
function getCurrentDate() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มจาก 0 (มกราคม) ถึง 11 (ธันวาคม)
    const year = now.getFullYear();

    return `${day}-${month}-${year}`;
}

module.exports = { getCurrentDate };
