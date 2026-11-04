// A hop from where a bot was to where it is now: up and down in one or more small arcs, with a squash
// on take-off and on landing. The element already sits at its new place; the frames start offset by
// the way it came.

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function hop(el: HTMLElement, dx: number, dy: number, delay = 0) {
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;
  const hops = Math.max(1, Math.min(4, Math.round(dist / 260)));
  const height = Math.min(44, 16 + dist * 0.05);
  const lift = Math.min(100, dist * 0.12);
  const steps = hops * 12;
  const frames: Keyframe[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = ease(t);
    const phase = (t * hops) % 1;
    const up = Math.sin(Math.PI * phase) * height + Math.sin(Math.PI * t) * lift;
    const squash = phase < 0.07 || phase > 0.93 ? 0.07 : 0;
    frames.push({ transform: `translate(${dx * (1 - p)}px, ${dy * (1 - p) - up}px) scale(${1 + squash}, ${1 - squash})`, offset: t });
  }
  frames[frames.length - 1] = { transform: 'translate(0, 0) scale(1, 1)', offset: 1 };
  el.getAnimations().forEach(a => a.cancel());
  el.animate(frames, { duration: 480 + hops * 240, delay, easing: 'linear', fill: 'backwards' });
}

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
