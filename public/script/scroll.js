document.addEventListener('scroll', function() {
  const scrollToTopBtn = document.getElementById('scroll-to-top-btn');
  if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
      scrollToTopBtn.style.display = 'block'; // แสดงปุ่มเมื่อเลื่อนมาสุด
  } else {
      scrollToTopBtn.style.display = 'none'; // ซ่อนปุ่มเมื่อไม่ได้เลื่อนมาสุด
  }
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
