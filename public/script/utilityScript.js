
function addCommas(num) {
  var parts = num.toFixed(2).toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

function formatCustomDate(date) {
  const d = new Date(date);
  const formatted = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
  }).format(d);

  return formatted.replace(/\//g, '-');  // เปลี่ยนจาก / เป็น -
}

function formatCustomDateTime(date) {
  const d = new Date(date);

  // แสดงวันที่ในรูปแบบ "DD-MM-YYYY"
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
  }).format(d);

  // แสดงเวลาในรูปแบบ "HH:mm"
  const formattedTime = d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');

  // รวมวันที่และเวลา
  return formattedDate.replace(/\//g, '-') + ' ' + formattedTime;
}


function handleCancel() {
  event.preventDefault(); // ป้องกันค่าเปลี่ยนแปลง
  history.back(); // ย้อนกลับ
}

function openSaleID(saleId) {
  // URL ที่จะเปิดขึ้นอยู่กับ _id ของการขาย
  const url = `/manageSaleEntry/${saleId}`;
  // เปิด URL ในแท็บใหม่
  window.open(url, '_blank');
}