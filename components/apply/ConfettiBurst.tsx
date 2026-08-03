"use client";

import { useEffect, useRef } from "react";

/**
 * One-shot gold-and-black confetti burst, fired on mount.
 *
 * Used by the public application confirmation panels (show car, car
 * club, trader).
 *
 * Hand-rolled on a canvas rather than pulling in a confetti package -
 * this is ~60 lines and the apply pages are the only thing that needs
 * it, so a dependency (and its bundle cost on a page users hit once)
 * isn't worth it.
 *
 * Particles fire radially from just above centre with an upward bias,
 * then fall under gravity and fade out. The canvas clears itself once
 * the last particle is done so it isn't left sitting over the page.
 */
export function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Respect reduced-motion - a full-screen particle explosion is
    // exactly the kind of thing that setting exists for.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cap DPR at 2 - beyond that we're paying for pixels nobody can
    // see on a 200-frame animation.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const COLORS = [
      "#e8c06a", // gold
      "#b89855", // gold, deeper
      "#f4dfa8", // gold, pale
      "#bd7420", // gold, burnt
      "#141414", // black
      "#2e2e2e", // off-black
    ];
    const COUNT = 150;
    const MAX_LIFE = 190;
    const originX = width / 2;
    const originY = height * 0.34;

    const particles = Array.from({ length: COUNT }, (_, i) => {
      // Even angular spread with a jitter, so the burst reads as a
      // ring rather than clumping wherever Math.random happened to go.
      const angle = (Math.PI * 2 * i) / COUNT + Math.random() * 0.3;
      const speed = 4 + Math.random() * 9;
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.5,
        w: 5 + Math.random() * 5,
        h: 8 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        color: COLORS[i % COLORS.length] as string,
      };
    });

    let frame = 0;
    let raf = 0;

    const tick = () => {
      frame += 1;
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.vy += 0.19; // gravity
        p.vx *= 0.99; // air drag
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        // Hold full opacity for most of the run, then fade over the
        // last quarter so it ends softly instead of blinking out.
        const fadeFrom = MAX_LIFE * 0.75;
        ctx.globalAlpha =
          frame < fadeFrom ? 1 : 1 - (frame - fadeFrom) / (MAX_LIFE - fadeFrom);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (frame < MAX_LIFE) {
        raf = window.requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 w-full h-full"
    />
  );
}
