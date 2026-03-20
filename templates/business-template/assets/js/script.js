// Business Template JS
document.addEventListener('DOMContentLoaded', () => {
  // Active nav link
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPage) link.classList.add('active');
  });

  // Scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });

  document.querySelectorAll('.card, .about-feature, .team-card, .contact-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

  const style = document.createElement('style');
  style.textContent = '.visible { opacity: 1 !important; transform: none !important; }';
  document.head.appendChild(style);

  // Contact form
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      btn.textContent = 'Sending...';
      btn.disabled = true;
      setTimeout(() => {
        form.innerHTML = `<div style="text-align:center;padding:2rem;color:#4f46e5;font-weight:600;font-size:1.1rem;">✅ Message sent! We'll be in touch soon.</div>`;
      }, 1200);
    });
  }

  // Sticky nav shadow
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 10 ? '0 2px 20px rgba(0,0,0,0.08)' : 'none';
  });

  // Counter animation
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = el.textContent;
    const num = parseInt(target.replace(/\D/g, ''));
    if (!num) return;
    let current = 0;
    const step = num / 40;
    const timer = setInterval(() => {
      current = Math.min(current + step, num);
      el.textContent = target.replace(/\d+/, Math.floor(current).toLocaleString());
      if (current >= num) clearInterval(timer);
    }, 30);
  });
});
