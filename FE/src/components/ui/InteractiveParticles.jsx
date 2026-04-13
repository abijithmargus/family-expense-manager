import React, { useRef, useEffect } from 'react';

export const InteractiveParticles = ({ gyro = { x: 0, y: 0 } }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let particles = [];
    const particleCount = 60;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 3 + 1;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update(mouse, gyroOffset) {
        // Basic drift
        this.x += this.vx;
        this.y += this.vy;

        // Mouse interaction (Repulsion)
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 1500;
          this.vx += (dx / dist) * force;
          this.vy += (dy / dist) * force;
        }

        // Apply friction
        this.vx *= 0.99;
        this.vy *= 0.99;

        // Boundaries with wrap-around
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      draw(gyroOffset) {
        // Apply gyro shift to the drawing position
        const drawX = this.x + (gyroOffset.x * 30);
        const drawY = this.y + (gyroOffset.y * 30);

        ctx.beginPath();
        ctx.arc(drawX, drawY, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
        
        // Subtle glow
        if (this.size > 2) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        } else {
            ctx.shadowBlur = 0;
        }
      }
    }

    // Initialize particles
    particles = Array.from({ length: particleCount }, () => new Particle());

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.update(mouseRef.current, gyro);
        p.draw(gyro);
      });

      // Connections
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = (particles[i].x + gyro.x*30) - (particles[j].x + gyro.x*30);
            const dy = (particles[i].y + gyro.y*30) - (particles[j].y + gyro.y*30);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                ctx.moveTo(particles[i].x + gyro.x*30, particles[i].y + gyro.y*30);
                ctx.lineTo(particles[j].x + gyro.x*30, particles[j].y + gyro.y*30);
            }
        }
      }
      ctx.stroke();

      animationFrameId = requestAnimationFrame(render);
    };

    const onMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    resize();
    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [gyro]); // Re-run effect mainly for gyro closure, though ideally we'd use refs for everything

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ opacity: 0.8 }}
    />
  );
};
