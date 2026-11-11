/** Equipos muy limitados: lo marca main.tsx antes del primer pintado. */
export const isLite = () => document.documentElement.classList.contains('lite');

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
