/**
 * Particles.js
 * Creates a high-performance interactive physics-based particle background on canvas.
 */

class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.particles = [];
    this.mouse = {
      x: null,
      y: null,
      radius: 160 // Interaction radius
    };
    
    this.particleCount = 90;
    this.maxDistance = 110; // Max distance for drawing connection lines
    
    this.init();
    this.animate();
    
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Track mouse movement
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    
    // Clear mouse position when it leaves viewport
    window.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
    
    // Dynamic burst on click
    window.addEventListener('click', (e) => {
      this.createBurst(e.clientX, e.clientY);
    });
  }
  
  init() {
    this.resizeCanvas();
    this.particles = [];
    
    // Generate particles
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push(this.createNewParticle());
    }
  }
  
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    
    // Adjust density based on screen size
    if (window.innerWidth < 768) {
      this.particleCount = 40;
      this.mouse.radius = 100;
      this.maxDistance = 80;
    } else {
      this.particleCount = 90;
      this.mouse.radius = 160;
      this.maxDistance = 110;
    }
  }
  
  createNewParticle(x = null, y = null, isTemporary = false) {
    const angle = Math.random() * Math.PI * 2;
    const speed = isTemporary ? Math.random() * 4 + 2 : Math.random() * 1.0 + 0.4;
    
    return {
      x: x !== null ? x : Math.random() * this.canvas.width,
      y: y !== null ? y : Math.random() * this.canvas.height,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: isTemporary ? Math.random() * 2.0 + 1 : Math.random() * 2.5 + 1,
      color: isTemporary ? 'rgba(57, 255, 20, 0.9)' : 'rgba(0, 242, 254, 0.35)', // lime click, cyan passive
      life: isTemporary ? 1.0 : null,
      decay: isTemporary ? Math.random() * 0.02 + 0.01 : null
    };
  }
  
  createBurst(x, y) {
    const burstCount = window.innerWidth < 768 ? 8 : 16;
    for (let i = 0; i < burstCount; i++) {
      this.particles.push(this.createNewParticle(x, y, true));
    }
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      
      p.x += p.vx;
      p.y += p.vy;
      
      if (this.mouse.x !== null && this.mouse.y !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.mouse.radius) {
          const force = (this.mouse.radius - dist) / this.mouse.radius;
          const angle = Math.atan2(dy, dx);
          
          p.x += Math.cos(angle) * force * 4.5; // Stronger repulsion
          p.y += Math.sin(angle) * force * 4.5;
        }
      }
      
      if (p.x < 0 || p.x > this.canvas.width) {
        p.vx = -p.vx;
        p.x = Math.max(0, Math.min(p.x, this.canvas.width));
      }
      if (p.y < 0 || p.y > this.canvas.height) {
        p.vy = -p.vy;
        p.y = Math.max(0, Math.min(p.y, this.canvas.height));
      }
      
      this.ctx.beginPath();
      if (p.life !== null) {
        this.ctx.fillStyle = `rgba(57, 255, 20, ${p.life})`;
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        p.life -= p.decay;
      } else {
        this.ctx.fillStyle = p.color;
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      }
      this.ctx.fill();
      
      if (p.life !== null && p.life <= 0) {
        this.particles.splice(i, 1);
        i--;
        continue;
      }
      
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p.x - p2.x;
        const dy = p.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < this.maxDistance) {
          const alpha = (1 - dist / this.maxDistance) * 0.2;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`; // Glowing cyan lines
          this.ctx.lineWidth = 0.9;
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }
    
    requestAnimationFrame(() => this.animate());
  }
}

// Instantiate on window load
window.addEventListener('DOMContentLoaded', () => {
  new ParticleSystem('bg-canvas');
});
