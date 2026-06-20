document.addEventListener("DOMContentLoaded", () => {
  // ----------------------------------------------------------------
  // Dynamic Copyright Year
  // ----------------------------------------------------------------
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // ----------------------------------------------------------------
  // Interactive Canvas Particle Background
  // ----------------------------------------------------------------
  const canvas = document.getElementById("particle-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let particles = [];
    let mouse = { x: null, y: null, radius: 150 };

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    }

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.3; // Speed X
        this.vy = (Math.random() - 0.5) * 0.3; // Speed Y
        this.radius = Math.random() * 1.5 + 0.5; // Radius
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(99, 102, 241, 0.25)";
        ctx.fill();
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wall Collision
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

        // Mouse interaction
        if (mouse.x !== null && mouse.y !== null) {
          const dx = this.x - mouse.x;
          const dy = this.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            // Gentle interactive repulsion from cursor
            const force = (mouse.radius - dist) / mouse.radius;
            const directionX = dx / dist;
            const directionY = dy / dist;
            this.x += directionX * force * 1.2;
            this.y += directionY * force * 1.2;
          }
        }
      }
    }

    function initParticles() {
      particles = [];
      // Dynamically scale particles count based on screen width
      const particleCount = Math.floor((canvas.width * canvas.height) / 18000);
      const maxParticles = Math.min(particleCount, 120); // Cap it for performance

      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle());
      }
    }

    function connectParticles() {
      const maxDist = 95;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            // Dynamic opacity based on distance
            const opacity = (1 - dist / maxDist) * 0.12;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      connectParticles();
      requestAnimationFrame(animate);
    }

    // Event listeners
    window.addEventListener("resize", resizeCanvas);

    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });

    window.addEventListener("mouseleave", () => {
      mouse.x = null;
      mouse.y = null;
    });

    // Initialize and start animation
    resizeCanvas();
    animate();
  }
});
