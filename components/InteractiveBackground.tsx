import React, { useEffect, useRef, useState } from 'react';

type BackgroundMode = 'midnight' | 'rose' | 'default';

const InteractiveBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [mode, setMode] = useState<BackgroundMode>('default');
    const mouseRef = useRef({ x: 0, y: 0 });
    const requestRef = useRef<number | null>(null);

    // Detect theme
    useEffect(() => {
        const checkTheme = () => {
            if (document.documentElement.classList.contains('midnight')) {
                setMode('midnight');
            } else if (document.documentElement.classList.contains('feminine')) {
                setMode('rose');
            } else {
                setMode('default');
            }
        };

        checkTheme();

        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    // Track mouse
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Animation Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };
        window.addEventListener('resize', resize);
        resize();

        // Particle/Dot Systems
        const dots: { x: number; y: number; baseR: number }[] = [];
        const DOT_SPACING = 30;

        // Initialize Matrix Dots
        const initMatrix = () => {
            dots.length = 0;
            for (let x = 0; x < width; x += DOT_SPACING) {
                for (let y = 0; y < height; y += DOT_SPACING) {
                    dots.push({ x, y, baseR: 1.5 });
                }
            }
        };

        // Rose Petals
        const petals: { x: number; y: number; size: number; rotation: number; speedX: number; speedY: number; opacity: number }[] = [];
        const initPetals = () => {
            petals.length = 0;
            const count = 30;
            for (let i = 0; i < count; i++) {
                petals.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    size: Math.random() * 10 + 5,
                    rotation: Math.random() * 360,
                    speedX: Math.random() * 0.5 - 0.25,
                    speedY: Math.random() * 0.5 + 0.2, // Drift down
                    opacity: Math.random() * 0.2 + 0.1
                });
            }
        };

        if (mode === 'midnight') initMatrix();
        if (mode === 'rose') initPetals();

        const render = () => {
            if (document.hidden) {
                // Stop the loop if hidden
                requestRef.current = null;
                return;
            }

            ctx.clearRect(0, 0, width, height);

            if (mode === 'default') {
                // Do nothing
            } else if (mode === 'midnight') {
                // ... Midnight Check 
                ctx.fillStyle = '#88a8ff';
                const mouse = mouseRef.current;

                dots.forEach(dot => {
                    const dx = mouse.x - dot.x;
                    const dy = mouse.y - dot.y;

                    if (Math.abs(dx) > 250 || Math.abs(dy) > 250) {
                        ctx.globalAlpha = 0.15;
                        ctx.beginPath();
                        ctx.arc(dot.x, dot.y, dot.baseR, 0, Math.PI * 2);
                        ctx.fill();
                        return;
                    }

                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const maxDist = 250;

                    let scale = 1;
                    let alpha = 0.15;

                    if (dist < maxDist) {
                        const effect = (1 - dist / maxDist);
                        scale = 1 + effect * 1.5;
                        alpha = 0.15 + effect * 0.4;
                    }

                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.arc(dot.x, dot.y, dot.baseR * scale, 0, Math.PI * 2);
                    ctx.fill();
                });

            } else if (mode === 'rose') {
                const mouse = mouseRef.current;

                petals.forEach(petal => {
                    petal.y += petal.speedY;
                    petal.x += petal.speedX;
                    petal.rotation += 0.5;

                    const dx = mouse.x - petal.x;
                    const dy = mouse.y - petal.y;
                    if (Math.abs(dx) < 150 && Math.abs(dy) < 150) {
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 150) {
                            const force = (150 - dist) / 150;
                            petal.x -= (dx / dist) * force * 2;
                            petal.y -= (dy / dist) * force * 2;
                        }
                    }

                    // Wrap around
                    if (petal.y > height) petal.y = -20;
                    if (petal.x > width) petal.x = 0;
                    if (petal.x < 0) petal.x = width;

                    // Draw
                    ctx.save();
                    ctx.translate(petal.x, petal.y);
                    ctx.rotate(petal.rotation * Math.PI / 180);
                    ctx.globalAlpha = petal.opacity;
                    ctx.fillStyle = '#ff9bcf';

                    ctx.beginPath();
                    ctx.ellipse(0, 0, petal.size, petal.size / 2, 0, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#f372b4';
                    ctx.fill();

                    ctx.restore();
                });

                const gradient = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 400);
                gradient.addColorStop(0, 'rgba(255, 126, 184, 0.05)');
                gradient.addColorStop(1, 'rgba(255, 126, 184, 0)');
                ctx.globalAlpha = 1;
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            }

            requestRef.current = requestAnimationFrame(render);
        };

        // Handle visibility internally in this effect since it has closure access to render()
        const handleVisibilityChange = () => {
            if (!document.hidden && !requestRef.current && mode !== 'default') {
                render();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Start loop
        render();

        return () => {
            window.removeEventListener('resize', resize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [mode]);

    if (mode === 'default') return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0,
                pointerEvents: 'none'
            }}
        />
    );
};

export default InteractiveBackground;
