"use client";

import confetti from "canvas-confetti";

const COIN_PALETTE = ["#d4a74c", "#c9a24f", "#f7d283", "#ffd700", "#b8860b", "#8b6914"];

function burst(origin: { x: number; y: number }, count: number) {
  confetti({
    particleCount: count,
    startVelocity: 38,
    gravity: 0.95,
    ticks: 220,
    spread: 70,
    angle: 90,
    drift: (Math.random() - 0.5) * 0.4,
    scalar: 1.25,
    shapes: ["circle"],
    colors: COIN_PALETTE,
    origin,
    zIndex: 9999,
  });
}

export function fireCoinRain(durationMs = 2500) {
  if (typeof window === "undefined") return;
  const end = Date.now() + durationMs;
  const frame = () => {
    const remaining = end - Date.now();
    if (remaining <= 0) return;
    const density = Math.max(8, Math.floor(28 * (remaining / durationMs)));
    burst({ x: 0.5, y: -0.05 }, density);
    if (Math.random() > 0.4) {
      burst({ x: 0.25 + Math.random() * 0.1, y: -0.05 }, Math.floor(density * 0.7));
      burst({ x: 0.65 + Math.random() * 0.1, y: -0.05 }, Math.floor(density * 0.7));
    }
    requestAnimationFrame(frame);
  };
  frame();
}

export function fireEmberRain(durationMs = 1800) {
  if (typeof window === "undefined") return;
  const end = Date.now() + durationMs;
  const frame = () => {
    const remaining = end - Date.now();
    if (remaining <= 0) return;
    const density = Math.max(6, Math.floor(22 * (remaining / durationMs)));
    confetti({
      particleCount: density,
      startVelocity: 18,
      gravity: 0.4,
      ticks: 160,
      spread: 120,
      angle: 270,
      drift: (Math.random() - 0.5) * 0.8,
      scalar: 0.9,
      shapes: ["circle"],
      colors: ["#3b0a0a", "#5d1212", "#7a1c1c", "#1a0606"],
      origin: { x: Math.random(), y: 1.1 },
      zIndex: 9999,
    });
    requestAnimationFrame(frame);
  };
  frame();
}
