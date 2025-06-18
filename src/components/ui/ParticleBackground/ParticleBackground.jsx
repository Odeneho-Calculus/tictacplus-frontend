import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectParticlesEnabled } from '../../../store/slices/settingsSlice';

// Styles
import styles from './ParticleBackground.module.scss';

const ParticleBackground = ({
    particleCount = 50,
    particleColor = 'rgba(255, 255, 255, 0.1)',
    particleSize = 2,
    speed = 0.5,
    className,
    ...props
}) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const particlesRef = useRef([]);
    const particlesEnabled = useSelector(selectParticlesEnabled);

    useEffect(() => {
        if (!particlesEnabled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width = window.innerWidth;
        let height = window.innerHeight;

        // Set canvas size
        const resizeCanvas = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Particle class
        class Particle {
            constructor() {
                this.reset();
                this.y = Math.random() * height;
            }

            reset() {
                this.x = Math.random() * width;
                this.y = -10;
                this.vx = (Math.random() - 0.5) * speed;
                this.vy = Math.random() * speed + 0.5;
                this.size = Math.random() * particleSize + 1;
                this.opacity = Math.random() * 0.5 + 0.1;
                this.life = 1;
                this.decay = Math.random() * 0.01 + 0.005;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.life -= this.decay;

                // Reset particle if it goes off screen or dies
                if (this.y > height + 10 || this.x < -10 || this.x > width + 10 || this.life <= 0) {
                    this.reset();
                }
            }

            draw(ctx) {
                ctx.save();
                ctx.globalAlpha = this.opacity * this.life;
                ctx.fillStyle = particleColor;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }

        // Initialize particles
        particlesRef.current = [];
        for (let i = 0; i < particleCount; i++) {
            particlesRef.current.push(new Particle());
        }

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            particlesRef.current.forEach(particle => {
                particle.update();
                particle.draw(ctx);
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        // Cleanup
        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [particlesEnabled, particleCount, particleColor, particleSize, speed]);

    if (!particlesEnabled) {
        return null;
    }

    return (
        <canvas
            ref={canvasRef}
            className={`${styles.particleBackground} ${className || ''}`}
            {...props}
        />
    );
};

export default ParticleBackground;