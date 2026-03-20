document.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  // Scroll-triggered reveals
  const io = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => { e.target.style.opacity = '1'; e.target.style.transform = 'none'; }, i * 90);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.listing-card, .value-card, .stat-block, .info-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(18px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    io.observe(el);
  });

  // Forms
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      setTimeout(() => {
        form.innerHTML = '<div style="padding:2rem;text-align:center"><p style="font-family:\'Playfair Display\',serif;font-size:1.3rem;color:#1c1a18;margin-bottom:0.5rem">Thank you.</p><p style="color:#6b6560;font-size:0.9rem">We\'ll be in touch within 24 hours.</p></div>';
      }, 900);
    });
  });

  // Sticky nav
  const nav = document.querySelector('nav');
  if (nav) window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 20 ? '0 2px 20px rgba(28,26,24,0.08)' : 'none';
  }, { passive: true });
});
