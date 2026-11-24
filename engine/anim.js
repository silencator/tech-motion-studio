// Tiny deterministic animation toolkit. Every value is a pure function of time `t`,
// so any frame can be rendered in any order (needed for frame-by-frame export).
(function () {
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;

  const E = {
    linear: p => p,
    inQuad: p => p * p,
    outQuad: p => 1 - (1 - p) * (1 - p),
    inCubic: p => p * p * p,
    outCubic: p => 1 - Math.pow(1 - p, 3),
    inOutCubic: p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    outQuart: p => 1 - Math.pow(1 - p, 4),
    outExpo: p => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
    outBack: p => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
    },
  };

  // Progress 0..1 of `t` between a and b, eased.
  const prog = (t, a, b, ease = E.inOutCubic) => ease(clamp((t - a) / (b - a)));
  // 0 -> 1 -> 0 hump between a and b.
  const bump = (t, a, b) => Math.sin(Math.PI * clamp((t - a) / (b - a)));
  // Visible window: fades in at [a, a+din], out at [b-dout, b].
  const win = (t, a, b, din = 0.4, dout = 0.4) =>
    Math.min(prog(t, a, a + din), 1 - prog(t, b - dout, b));

  // Seeded PRNG so "random" layouts are identical every render.
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  function mix(a, b, p) {
    const A = hex(a), B = hex(b);
    return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp(p)))).join(',')})`;
  }

  // Position an absolutely-placed element by its centre.
  function place(el, x, y, s = 1, o = 1, r = 0) {
    el.style.transform = `translate(${x}px,${y}px) translate(-50%,-50%) scale(${s}) rotate(${r}deg)`;
    el.style.opacity = clamp(o).toFixed(4);
    el.style.visibility = o < 0.002 ? 'hidden' : 'visible';
  }

  window.Anim = { clamp, lerp, E, prog, bump, win, rng, mix, place };
})();
