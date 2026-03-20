document.addEventListener('DOMContentLoaded', () => {
  // Mark active nav link
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.header-nav a').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  // Newsletter form handling
  document.querySelectorAll('.newsletter-inline, .newsletter-form').forEach(form => {
    const btn = form.querySelector('button');
    const input = form.querySelector('input[type="email"]');
    if (btn && input) {
      btn.addEventListener('click', () => {
        if (!input.value) return;
        const parent = form.parentElement;
        parent.innerHTML = '<p style="color:#e8572a;font-weight:600;font-size:0.95rem;">✅ You\'re subscribed! Welcome aboard.</p>';
      });
    }
  });

  // Contact form
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      contactForm.innerHTML = '<p style="color:#e8572a;font-weight:600;">✅ Message received! I\'ll get back to you soon.</p>';
    });
  }

  // Reading progress bar
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:0;left:0;height:2px;background:#e8572a;z-index:9999;transition:width 0.1s;width:0;';
  document.body.appendChild(bar);
  window.addEventListener('scroll', () => {
    const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    bar.style.width = pct + '%';
  });
});
