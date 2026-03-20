document.addEventListener('DOMContentLoaded', () => {
  // Stagger-in cards
  const cards = document.querySelectorAll('.project-card, .stat-box, .skill-tag');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.style.opacity = '1', i * 60);
      }
    });
  }, { threshold: 0.1 });

  cards.forEach(c => {
    c.style.opacity = '0';
    c.style.transition = 'opacity 0.5s ease';
    observer.observe(c);
  });

  // Contact form
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      btn.textContent = 'Sending...';
      setTimeout(() => {
        form.innerHTML = `<div style="padding:2rem;text-align:center;color:#06ffa5;font-weight:600;font-size:1.1rem;border:1px solid rgba(6,255,165,0.2);border-radius:12px;background:rgba(6,255,165,0.05)">✅ Message sent! I'll get back to you soon.</div>`;
      }, 1000);
    });
  }

  // Cursor glow effect
  const glow = document.createElement('div');
  glow.style.cssText = 'position:fixed;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(79,70,229,0.06) 0%,transparent 70%);pointer-events:none;z-index:999;transform:translate(-50%,-50%);transition:left 0.4s ease,top 0.4s ease;';
  document.body.appendChild(glow);
  document.addEventListener('mousemove', e => {
    glow.style.left = e.clientX + 'px';
    glow.style.top = e.clientY + 'px';
  });
});
