document.addEventListener('DOMContentLoaded', () => {
  // Active nav
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  // Stagger-in animations
  const io = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => { e.target.style.opacity = '1'; e.target.style.transform = 'none'; }, i * 70);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.feat-card, .stat-item, .plan-card, .contact-channel').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(14px)';
    el.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
    io.observe(el);
  });

  // Animated stat counters
  const countEls = document.querySelectorAll('.stat-num[data-target]');
  const cio = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      let start = 0, steps = 50;
      const inc = target / steps;
      const t = setInterval(() => {
        start = Math.min(start + inc, target);
        el.textContent = (Number.isInteger(target) ? Math.floor(start).toLocaleString() : start.toFixed(1)) + suffix;
        if (start >= target) clearInterval(t);
      }, 25);
      cio.unobserve(el);
    });
  }, { threshold: 0.3 });
  countEls.forEach(el => cio.observe(el));

  // Contact / support form
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      setTimeout(() => {
        form.innerHTML = '<div style="padding:2rem;text-align:center"><p style="font-size:1.1rem;font-weight:700;color:#4f46e5;margin-bottom:0.5rem">✓ Message received!</p><p style="color:#64748b;font-size:0.9rem">We\'ll get back to you within one business day.</p></div>';
      }, 900);
    });
  });
});
