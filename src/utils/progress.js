// File: src/utils/progress.js
// Description: Small helpers for progress calculations.

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

export function calcPercent(current, target) {
  const c = Number(current) || 0;
  const t = Number(target) || 0;
  if (t <= 0) return 0;
  return clamp(Math.floor((c / t) * 100), 0, 100);
}