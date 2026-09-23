"use client";

import { useEffect, useRef } from "react";

const MAX_DPR = 1.25;
const FRAME_MS = 1000 / 32;
const LINK_DIST = 148;
const MAX_NODES = 40;
const MIN_NODES = 16;
const SPOKES = 11;
const RINGS = 5;

type Node = { x: number; y: number; vx: number; vy: number; r: number };
type Palette = { stroke: string; glow: string; hub: string };

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hexToRgb(hex: string): [number, number, number] {
  const raw = hex.trim().replace("#", "");
  if (raw.length === 3) {
    return [parseInt(raw[0] + raw[0], 16), parseInt(raw[1] + raw[1], 16), parseInt(raw[2] + raw[2], 16)];
  }
  if (raw.length >= 6) {
    return [parseInt(raw.slice(0, 2), 16), parseInt(raw.slice(2, 4), 16), parseInt(raw.slice(4, 6), 16)];
  }
  return [15, 118, 110];
}

function readPalette(): Palette {
  const styles = getComputedStyle(document.documentElement);
  const accent = styles.getPropertyValue("--accent").trim() || "#0f766e";
  const soft = styles.getPropertyValue("--accent-soft").trim() || "#14b8a6";
  const dark = document.documentElement.classList.contains("dark");
  const [ar, ag, ab] = hexToRgb(accent);
  const [sr, sg, sb] = hexToRgb(soft);
  return {
    stroke: dark ? `rgba(${sr},${sg},${sb},` : `rgba(${ar},${ag},${ab},`,
    glow: dark ? `rgba(${sr},${sg},${sb},` : `rgba(${ar},${ag},${ab},`,
    hub: dark ? `rgba(${sr},${sg},${sb},0.55)` : `rgba(${ar},${ag},${ab},0.42)`,
  };
}

function seedNodes(w: number, h: number, count: number): Node[] {
  const nodes: Node[] = [];
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: 0.8 + Math.random() * 1.4,
    });
  }
  return nodes;
}

function nodeBudget(w: number, h: number) {
  return Math.round(clamp((w * h) / 32_000, MIN_NODES, MAX_NODES));
}

export default function SpiderWebBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let nodes: Node[] = [];
    let palette = readPalette();
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let running = false;
    let disposed = false;
    let resizeTimer = 0;
    const hub = { x: 0, y: 0 };

    function resize() {
      const nextW = Math.max(1, window.innerWidth);
      const nextH = Math.max(1, window.innerHeight);
      const sx = width ? nextW / width : 1;
      const sy = height ? nextH / height : 1;
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = nextW;
      height = nextH;
      canvas.width = Math.round(nextW * dpr);
      canvas.height = Math.round(nextH * dpr);
      canvas.style.width = `${nextW}px`;
      canvas.style.height = `${nextH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      hub.x = nextW * 0.12;
      hub.y = nextH * 0.1;
      palette = readPalette();
      const target = nodeBudget(nextW, nextH);
      if (!nodes.length) {
        nodes = seedNodes(nextW, nextH, target);
        return;
      }
      for (const n of nodes) {
        n.x *= sx;
        n.y *= sy;
      }
      while (nodes.length < target) nodes.push(...seedNodes(nextW, nextH, 1));
      if (nodes.length > target) nodes.length = target;
    }

    function scheduleResize() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 80);
    }

    function drawWeb(t: number) {
      const breathe = reduced.matches ? 0 : Math.sin(t * 0.00022) * 0.018;
      const maxR = Math.hypot(width, height) * 0.72;

      ctx.beginPath();
      for (let s = 0; s < SPOKES; s++) {
        const jitter = Math.sin(s * 1.7 + t * 0.00015) * 0.045;
        const angle = (Math.PI * 2 * s) / SPOKES - Math.PI * 0.18 + jitter;
        ctx.moveTo(hub.x, hub.y);
        ctx.lineTo(hub.x + Math.cos(angle) * maxR, hub.y + Math.sin(angle) * maxR);
      }
      ctx.strokeStyle = `${palette.stroke}0.11)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let ring = 1; ring <= RINGS; ring++) {
        const radius = ((maxR * ring) / (RINGS + 0.6)) * (1 + breathe * (ring % 2 === 0 ? 1 : -1));
        ctx.beginPath();
        for (let s = 0; s <= SPOKES; s++) {
          const spoke = s % SPOKES;
          const wobble = Math.sin(t * 0.00018 + spoke * 0.9 + ring) * (6 + ring * 1.5);
          const angle = (Math.PI * 2 * spoke) / SPOKES - Math.PI * 0.18;
          const x = hub.x + Math.cos(angle) * (radius + wobble);
          const y = hub.y + Math.sin(angle) * (radius + wobble);
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `${palette.stroke}${0.07 + ring * 0.012})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(hub.x, hub.y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = palette.hub;
      ctx.fill();
    }

    function step(now: number) {
      if (disposed || !running) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(step);
      if (now - last < FRAME_MS) return;
      last = now;

      ctx.clearRect(0, 0, width, height);
      drawWeb(now);

      const dist2 = LINK_DIST * LINK_DIST;
      ctx.beginPath();
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < -20) a.x = width + 20;
        else if (a.x > width + 20) a.x = -20;
        if (a.y < -20) a.y = height + 20;
        else if (a.y > height + 20) a.y = -20;

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          if (dx * dx + dy * dy > dist2) continue;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
        }
      }
      ctx.strokeStyle = `${palette.glow}0.1)`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = `${palette.glow}0.42)`;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        ctx.moveTo(n.x + n.r, n.y);
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    function start() {
      if (running || disposed) return;
      running = true;
      last = 0;
      if (!raf) raf = requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    }

    function onVisibility() {
      if (document.hidden) stop();
      else if (!reduced.matches) start();
    }

    const themeObs = new MutationObserver(() => {
      palette = readPalette();
      if (reduced.matches) {
        ctx.clearRect(0, 0, width, height);
        drawWeb(0);
      }
    });
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    resize();
    if (reduced.matches) drawWeb(0);
    else start();

    window.addEventListener("resize", scheduleResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    const motionHandler = () => {
      if (reduced.matches) {
        stop();
        ctx.clearRect(0, 0, width, height);
        drawWeb(0);
      } else {
        start();
      }
    };
    reduced.addEventListener("change", motionHandler);

    return () => {
      disposed = true;
      stop();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", scheduleResize);
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", motionHandler);
      themeObs.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="spider-web-canvas pointer-events-none fixed inset-0 z-0" aria-hidden />;
}
