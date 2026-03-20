document.addEventListener('DOMContentLoaded', () => {
  // Active nav
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  // Fade-in on scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
        }, i * 80);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.dish-card, .menu-item, .info-row').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

  // Reservation / contact forms
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      if (btn) btn.textContent = 'Sending...';
      setTimeout(() => {
        form.innerHTML = '<p style="padding:1.5rem;color:var(--primary);font-family:var(--font-serif);font-size:1.1rem;font-style:italic;">Thank you — we\'ll be in touch shortly to confirm your reservation.</p>';
      }, 900);
    });
  });

  // Sticky nav shadow
  const nav = document.querySelector('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.style.boxShadow = window.scrollY > 20 ? '0 2px 24px rgba(26,18,8,0.09)' : 'none';
    }, { passive: true });
  }
});
