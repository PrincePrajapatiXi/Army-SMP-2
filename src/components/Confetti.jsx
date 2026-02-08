import React, { useEffect, useRef, useCallback } from 'react';
import './Confetti.css';

const Confetti = ({
    isActive = false,
    duration = 4000,
    particleCount = 150,
    colors = ['#ff6b35', '#ffc107', '#55ff55', '#55ffff', '#ff55ff', '#ffffff', '#5555ff']
}) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const particlesRef = useRef([]);

    const createParticle = useCallback((canvas) => {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            speedY: Math.random() * 3 + 2,
            speedX: Math.random() * 4 - 2,
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5,
            shape: Math.random() > 0.5 ? 'rect' : 'circle',
            opacity: 1,
            oscillationSpeed: Math.random() * 0.1 + 0.02,
            oscillationDistance: Math.random() * 40 + 10,
            oscillationOffset: Math.random() * Math.PI * 2
        };
    }, [colors]);

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particlesRef.current.forEach((particle, index) => {
            // Update position
            particle.y += particle.speedY;
            particle.x += particle.speedX + Math.sin(particle.y * particle.oscillationSpeed + particle.oscillationOffset) * 0.5;
            particle.rotation += particle.rotationSpeed;

            // Fade out as particles reach bottom
            if (particle.y > canvas.height * 0.7) {
                particle.opacity -= 0.02;
            }

            // Draw particle
            ctx.save();
            ctx.translate(particle.x, particle.y);
            ctx.rotate((particle.rotation * Math.PI) / 180);
            ctx.globalAlpha = particle.opacity;
            ctx.fillStyle = particle.color;

            if (particle.shape === 'rect') {
                ctx.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, particle.size / 3, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();

            // Remove particles that are off screen or invisible
            if (particle.y > canvas.height + 50 || particle.opacity <= 0) {
                particlesRef.current.splice(index, 1);
            }
        });

        if (particlesRef.current.length > 0) {
            animationRef.current = requestAnimationFrame(animate);
        }
    }, []);

    const startConfetti = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas size
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Create particles
        particlesRef.current = [];
        for (let i = 0; i < particleCount; i++) {
            particlesRef.current.push(createParticle(canvas));
        }

        // Add more particles in bursts
        const burstInterval = setInterval(() => {
            for (let i = 0; i < 20; i++) {
                particlesRef.current.push(createParticle(canvas));
            }
        }, 300);

        // Stop creating new particles after some time
        setTimeout(() => {
            clearInterval(burstInterval);
        }, duration * 0.5);

        // Start animation
        animate();
    }, [particleCount, createParticle, animate, duration]);

    useEffect(() => {
        if (isActive) {
            startConfetti();
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isActive, startConfetti]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isActive) return null;

    return (
        <canvas
            ref={canvasRef}
            className="confetti-canvas"
            aria-hidden="true"
        />
    );
};

export default Confetti;

