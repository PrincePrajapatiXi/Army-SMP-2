import React, { useRef, useEffect, useState, useCallback } from 'react';
import './ParticleBackground.css';

/**
 * ParticleBackground - Lightweight canvas-based particle system
 * Creates floating particles with optional mouse interaction
 */
const ParticleBackground = ({
    particleCount = 50,
    particleColor = 'rgba(255, 107, 53, 0.5)',
    particleSize = 3,
    speed = 0.5,
    connectDistance = 100,
    mouseInteract = true,
    className = ''
}) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const particlesRef = useRef([]);
    const mouseRef = useRef({ x: null, y: null });
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Create particles
    const createParticles = useCallback((width, height) => {
        const particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * speed,
                vy: (Math.random() - 0.5) * speed,
                size: Math.random() * particleSize + 1,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
        return particles;
    }, [particleCount, speed, particleSize]);

    // Update canvas dimensions
    useEffect(() => {
        const updateDimensions = () => {
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                const parent = canvas.parentElement;
                const width = parent?.clientWidth || window.innerWidth;
                const height = parent?.clientHeight || window.innerHeight;

                canvas.width = width;
                canvas.height = height;
                setDimensions({ width, height });
                particlesRef.current = createParticles(width, height);
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);

        return () => window.removeEventListener('resize', updateDimensions);
    }, [createParticles]);

    // Mouse tracking
    useEffect(() => {
        if (!mouseInteract) return;

        const handleMouseMove = (e) => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const handleMouseLeave = () => {
            mouseRef.current = { x: null, y: null };
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [mouseInteract]);

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const animate = () => {
            ctx.clearRect(0, 0, dimensions.width, dimensions.height);

            const particles = particlesRef.current;
            const mouse = mouseRef.current;

            particles.forEach((particle, i) => {
                // Update position
                particle.x += particle.vx;
                particle.y += particle.vy;

                // Bounce off edges
                if (particle.x < 0 || particle.x > dimensions.width) particle.vx *= -1;
                if (particle.y < 0 || particle.y > dimensions.height) particle.vy *= -1;

                // Keep in bounds
                particle.x = Math.max(0, Math.min(dimensions.width, particle.x));
                particle.y = Math.max(0, Math.min(dimensions.height, particle.y));

                // Mouse interaction
                if (mouseInteract && mouse.x !== null && mouse.y !== null) {
                    const dx = mouse.x - particle.x;
                    const dy = mouse.y - particle.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 100) {
                        const force = (100 - dist) / 100;
                        particle.x -= dx * force * 0.02;
                        particle.y -= dy * force * 0.02;
                    }
                }

                // Draw particle
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = particleColor.replace('0.5', String(particle.opacity));
                ctx.fill();

                // Draw connections
                for (let j = i + 1; j < particles.length; j++) {
                    const other = particles[j];
                    const dx = particle.x - other.x;
                    const dy = particle.y - other.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < connectDistance) {
                        ctx.beginPath();
                        ctx.moveTo(particle.x, particle.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.strokeStyle = particleColor.replace('0.5', String((1 - dist / connectDistance) * 0.2));
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [dimensions, particleColor, connectDistance, mouseInteract]);

    return (
        <canvas
            ref={canvasRef}
            className={`particle-background ${className}`}
        />
    );
};

export default ParticleBackground;

