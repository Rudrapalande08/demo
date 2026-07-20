document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const logoutBtn = document.getElementById('logout-btn');
  const errorMsg = document.getElementById('login-error');

  // Handle Login Logic
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      // Simple dummy login validation
      if (email && password.length >= 4) {
        // Successful dummy login
        localStorage.setItem('inp_auth', 'true');
        
        // Add a subtle exit animation to the card
        const card = document.querySelector('.login-card');
        card.style.transition = 'all 0.4s ease';
        card.style.opacity = '0';
        card.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
          window.location.href = './dashboard.html';
        }, 400);

      } else {
        // Show error
        errorMsg.style.display = 'block';
        errorMsg.textContent = 'Please enter a valid email and password.';
        
        // Shake animation for error
        const card = document.querySelector('.login-card');
        card.style.transform = 'translateX(-10px)';
        setTimeout(() => card.style.transform = 'translateX(10px)', 100);
        setTimeout(() => card.style.transform = 'translateX(-10px)', 200);
        setTimeout(() => card.style.transform = 'translateX(0)', 300);
      }
    });
  }

  // Handle Logout Logic
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('inp_auth');
      window.location.href = './index.html';
    });
  }

  // Add subtle reveal animations for product cards on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const productCards = document.querySelectorAll('.product-card');
  productCards.forEach((card, index) => {
    // Initial hidden state for dashboard items
    if (window.location.pathname.includes('dashboard')) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`;
      observer.observe(card);
    }
  });
});
