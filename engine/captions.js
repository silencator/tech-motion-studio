// Word-by-word captions from sentence timings.
// segments: [[start, end, "text"], ...]. Word times are estimated inside each
// segment by word length, then grouped into short on-screen chunks.
(function () {
  const { clamp, prog, E } = window.Anim;

  function build(container, segments, opts = {}) {
    const maxWords = opts.maxWords || 4;
    const maxChars = opts.maxChars || 24;
    const chunks = [];

    segments.forEach(([a, b, text, show], si) => {
      if (show === false) return;
      const words = text.split(/\s+/).filter(Boolean);
      const weights = words.map(w => w.length + 2);
      const total = weights.reduce((x, y) => x + y, 0);
      let acc = a;
      const timed = words.map((w, i) => {
        const d = ((b - a) * weights[i]) / total;
        const o = { w, s: acc, e: acc + d };
        acc += d;
        return o;
      });

      let cur = [];
      const flush = () => { if (cur.length) chunks.push({ seg: si, words: cur }); cur = []; };
      timed.forEach(tw => {
        const chars = cur.map(x => x.w).join(' ').length + tw.w.length + 1;
        if (cur.length >= maxWords || (cur.length && chars > maxChars)) flush();
        cur.push(tw);
        if (/[.,:?!]$/.test(tw.w) && cur.length >= 2) flush();
      });
      flush();
    });

    chunks.forEach((c, i) => {
      const next = chunks[i + 1];
      const last = c.words[c.words.length - 1];
      c.start = c.words[0].s - 0.04;
      // hand off exactly when the next chunk starts, so two chunks never overlap
      c.end = next ? Math.min(next.words[0].s - 0.04, last.e + 0.6) : last.e + 0.8;
      const el = document.createElement('div');
      el.className = 'cap-chunk';
      c.spans = c.words.map(tw => {
        const s = document.createElement('span');
        s.textContent = tw.w;
        el.appendChild(s);
        el.appendChild(document.createTextNode(' '));
        return s;
      });
      container.appendChild(el);
      c.el = el;
    });

    return function render(t) {
      chunks.forEach(c => {
        const on = t >= c.start && t < c.end;
        c.el.style.display = on ? 'block' : 'none';
        if (!on) return;
        const p = prog(t, c.start, c.start + 0.14, E.outCubic);
        c.el.style.transform = `translateY(${(1 - p) * 26}px) scale(${0.96 + 0.04 * p})`;
        c.el.style.opacity = p;
        c.spans.forEach((s, i) => {
          const w = c.words[i];
          const spoken = t >= w.s;
          const current = spoken && t < w.e + 0.05;
          s.className = current ? 'cur' : spoken ? 'said' : 'todo';
          const pop = current ? 1 + 0.035 * Math.sin(Math.PI * clamp((t - w.s) / 0.18)) : 1;
          s.style.transform = `scale(${pop})`;
        });
      });
    };
  }

  window.Captions = { build };
})();
