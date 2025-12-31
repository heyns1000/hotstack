import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
}

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const particles: Particle[] = [];
    const particleCount = 100;
    const particleSize = 3;
    const particleSpeed = 2;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticle = (): Particle => {
      const opacity = Math.random() * 0.5 + 0.5;
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: particleSize,
        speed: particleSpeed + Math.random() * 1.5,
        opacity,
        color: `rgba(255, 204, 0, ${opacity})`,
      };
    };

    const initParticles = () => {
      resizeCanvas();
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push(createParticle());
      }
    };

    const updateParticle = (particle: Particle) => {
      particle.y += particle.speed;
      if (particle.y > canvas.height) {
        particle.y = -particle.size;
        particle.x = Math.random() * canvas.width;
        particle.opacity = Math.random() * 0.5 + 0.5;
        particle.color = `rgba(255, 204, 0, ${particle.opacity})`;
      }
    };

    const drawParticle = (particle: Particle) => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color;
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        updateParticle(particle);
        drawParticle(particle);
      });
      requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    window.addEventListener('resize', initParticles);

    return () => {
      window.removeEventListener('resize', initParticles);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0, backgroundColor: 'transparent' }}
    />
  );
}
