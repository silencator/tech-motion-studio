// "Why iPhone batteries age": scene timeline.
// Every visual is a pure function of t (seconds), synced to voiceover.mp3.
(function () {
  const { clamp, lerp, E, prog, bump, rng, mix, place } = window.Anim;
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';

  window.VIDEO = { width: 1080, height: 1920, duration: 59.3, audio: 'voiceover.mp3' };

  // Voiceover timings (from pause detection on the audio).
  const SEGMENTS = [
    [0.00, 1.18, "You buy a new iPhone."],
    [1.45, 3.22, "One charge gets you through the day."],
    [3.55, 7.09, "But a year or two later, you're hunting for a charger by lunchtime."],
    [7.46, 8.65, "So what changed?"],
    [9.06, 11.86, "The battery inside your phone has actually aged."],
    [12.25, 14.87, "Every iPhone uses a lithium-ion battery."],
    [15.27, 15.91, "Inside,"],
    [16.06, 21.74, "tiny particles called lithium ions move between two layers as the battery charges and discharges."],
    [22.10, 24.09, "That's how energy is stored and released."],
    [24.42, 25.34, "But here's the catch:"],
    [25.67, 27.83, "the process isn't perfectly reversible."],
    [28.25, 31.23, "Every charge cycle causes tiny chemical changes."],
    [31.50, 36.45, "Over time, some lithium becomes unavailable, and the battery materials slowly wear down."],
    [36.90, 37.45, "The result?"],
    [37.79, 40.50, "Your battery can't store as much energy as it once could."],
    [40.86, 44.97, "Its internal resistance also increases, making it harder to deliver power."],
    [45.31, 47.10, "And heat speeds up this ageing."],
    [47.47, 50.72, "That's why leaving your phone in a hot car is bad for battery health."],
    [51.11, 55.20, "So when your iPhone dies faster than it used to, it's not your imagination."],
    [55.53, 57.11, "The battery hasn't just run down."],
    [57.45, 58.29, "It's worn down.", false], // shown as big on-screen text instead
  ];
  const renderCaptions = window.Captions.build($('captions'), SEGMENTS);

  // ---------------------------------------------------------------- diagram setup
  const R = rng(7);
  const stripes = $('stripes');
  for (let r = 0; r < 5; r++) {
    const s = document.createElementNS(NS, 'rect');
    Object.entries({ x: 606, y: 386 + r * 96, width: 228, height: 14, rx: 7, fill: '#2c2f35' })
      .forEach(([k, v]) => s.setAttribute(k, v));
    stripes.appendChild(s);
  }

  const N = 24;
  const order = [...Array(N).keys()].sort(() => R() - 0.5);
  const anodeSlot = [...Array(N).keys()].sort(() => R() - 0.5);
  const TRAPPED = [3, 9, 14, 20, 6, 17, 1, 22]; // ions that get stuck, in order
  const ions = [];
  for (let i = 0; i < N; i++) {
    const g = document.createElementNS(NS, 'g');
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', 20); c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', 4);
    const tx = document.createElementNS(NS, 'text');
    tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('y', 7);
    tx.setAttribute('font-size', 19); tx.setAttribute('font-weight', 800); tx.setAttribute('fill', '#5a3a00');
    tx.innerHTML = 'Li<tspan dy="-7" font-size="13">+</tspan>';
    g.appendChild(c); g.appendChild(tx);
    $('ions').appendChild(g);
    const col = i % 4, row = Math.floor(i / 4);
    const a = anodeSlot[i], acol = a % 4, arow = Math.floor(a / 4);
    const ti = TRAPPED.indexOf(i);
    ions.push({
      g, c, tx,
      A: [130 + col * 60 + (R() - 0.5) * 8, 345 + row * 96 + (R() - 0.5) * 10],
      B: [630 + acol * 60, 345 + arow * 96],
      wob: (R() - 0.5) * 240,
      delay: (order[i] / N) * 0.6,
      trapT: ti >= 0 ? 31.9 + ti * 0.42 : 1e6,
      trapPos: [570 + (R() - 0.5) * 14, 345 + (ti >= 0 ? ti : 0) * 68 + 10],
    });
  }

  const wire = $('wire');
  const wireLen = wire.getTotalLength();
  const electrons = [];
  for (let j = 0; j < 12; j++) {
    const e = document.createElementNS(NS, 'circle');
    e.setAttribute('r', 9); e.setAttribute('fill', '#2f7cf6');
    $('electrons').appendChild(e);
    electrons.push(e);
  }

  // Charge state of the cell: 0 = ions in cathode, 1 = ions in anode.
  function S(t) {
    if (t < 16.0) return 0;
    if (t < 18.75) return prog(t, 16.0, 18.6);
    if (t < 22.0) return 1 - prog(t, 18.9, 21.5);
    if (t < 23.1) return prog(t, 22.05, 23.0);
    if (t < 28.5) return 1 - prog(t, 23.15, 24.2);
    if (t < 36.5) return 0.5 - 0.5 * Math.cos(2 * Math.PI * (t - 28.5));
    return 0;
  }

  // Bars + flow dots for the result cards.
  const flowDots = [];
  for (let j = 0; j < 6; j++) { const d = document.createElement('i'); $('flow').appendChild(d); flowDots.push(d); }
  const bars = [...$('bars').children];
  const barCols = ['#30c35c', '#9bd34a', '#ffb020', '#ff7a3d', '#e5484d'];

  const fmtClock = m => `${((Math.floor(m / 60) + 11) % 12) + 1}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

  // ---------------------------------------------------------------- render
  function renderAt(t) {
    // ===== Phone (0 - 12.6, 51 - 55.8)
    let po = 0, py = 800, ps = 1;
    if (t < 12.7) {
      const a = prog(t, 0, 0.9, E.outCubic), out = prog(t, 12.05, 12.6, E.inCubic);
      po = prog(t, 0, 0.45) * (1 - out); py = lerp(1150, 800, a); ps = lerp(0.86, 1, a) * lerp(1, 1.3, out);
    } else if (t > 50.9) {
      const a = prog(t, 51.0, 51.8, E.outCubic), out = prog(t, 55.25, 55.7);
      po = prog(t, 51.0, 51.45) * (1 - out); py = lerp(1080, 800, a) - out * 60; ps = lerp(0.9, 1, a) * lerp(1, 0.88, out);
    }
    // wiggle when the battery is low
    const shake = t > 6.3 && t < 7.4 ? Math.sin(t * 60) * 1.6 * bump(t, 6.3, 7.4) : 0;
    place($('phone'), 540, py, ps, po, shake);

    let clock = 480, batt = 100, dark = 0, date = 'Monday, June 2';
    if (t < 3.55) {
      const p = prog(t, 1.5, 3.15);
      clock = lerp(480, 1380, p); batt = lerp(100, 21, p); dark = clamp((clock - 1020) / 300) * 0.55;
    } else if (t < 20) {
      date = 'Tuesday, May 14';
      clock = lerp(480, 750, prog(t, 3.95, 6.6)); batt = lerp(100, 9, prog(t, 3.95, 6.6, E.inQuad));
    } else {
      date = 'Today';
      const p = prog(t, 51.7, 54.6); clock = lerp(540, 795, p); batt = lerp(100, 12, prog(t, 51.7, 54.6, E.inQuad));
    }
    $('phTime').textContent = fmtClock(clock);
    $('phDate').textContent = date;
    $('night').style.opacity = dark;
    $('pbFill').style.width = batt.toFixed(1) + '%';
    $('pbFill').style.background = batt <= 20 ? '#ff3b30' : '#34c759';
    $('pbPct').textContent = Math.round(batt) + '%';
    const al = t < 20 ? prog(t, 6.25, 6.55, E.outCubic) * (1 - prog(t, 8.8, 9.1))
                      : prog(t, 54.2, 54.5, E.outCubic) * (1 - prog(t, 55.1, 55.4));
    $('alTxt').textContent = (t < 20 ? 10 : 12) + '% battery remaining';
    $('phAlert').style.opacity = al;
    $('phAlert').style.transform = `translateY(${(1 - al) * -120}px)`;

    const xr = t < 20 ? prog(t, 9.1, 9.7) : 0;
    $('xray').style.opacity = xr;
    $('screen').style.opacity = 1 - xr;
    const health = lerp(100, 79, prog(t, 9.9, 11.4));
    $('packVal').textContent = Math.round(health) + '%';
    $('packBar').style.width = health + '%';
    $('packBar').style.background = mix('#30c35c', '#ffb020', prog(t, 10.2, 11.4));

    // Day chip
    const flip = bump(t, 3.4, 3.8);
    const dco = prog(t, 0.3, 0.7) * (1 - prog(t, 11.9, 12.3));
    place($('dayChip'), 540, lerp(320, 260, prog(t, 0.3, 0.9, E.outCubic)), 1 - 0.18 * flip, dco);
    $('dayTxt').textContent = t < 3.6 ? 'Day 1' : '2 years later';
    $('dayDot').style.background = t < 3.6 ? '#30c35c' : '#ffb020';

    // Charger hunt + question
    const ch = prog(t, 6.2, 6.8, E.outBack) * (1 - prog(t, 8.5, 8.9));
    place($('charger'), lerp(1200, 900, prog(t, 6.2, 6.8, E.outCubic)), 1080, 0.9 * ch + 0.1, ch, Math.sin(t * 7) * 8);
    const qb = prog(t, 7.5, 7.9, E.outBack) * (1 - prog(t, 8.8, 9.15));
    place($('qBubble'), 840, 440, qb, clamp(qb * 2), lerp(-20, 8, prog(t, 7.5, 8.2)));

    // AGED stamp
    const st = prog(t, 10.8, 11.15, E.outCubic);
    place($('stamp'), 770, 1010, lerp(1.8, 1, st) * (1 - prog(t, 12.05, 12.5)), st * (1 - prog(t, 12.05, 12.4)), -14);

    // ===== Cell (12.2 - 15.6)
    const ci = prog(t, 12.2, 12.9, E.outBack), cOut = prog(t, 15.1, 15.6, E.inCubic);
    place($('cell'), 540, 860, lerp(0.7, 1, ci) * lerp(1, 1.3, cOut), prog(t, 12.2, 12.5) * (1 - cOut));
    const li = prog(t, 13.0, 13.45, E.outBack);
    place($('liTile'), 830, 470, li * (1 - cOut * 0.3), clamp(li * 2) * (1 - cOut), lerp(14, 6, li));
    const cc = prog(t, 12.6, 13.0, E.outCubic) * (1 - cOut);
    place($('cellChip'), 540, lerp(1330, 1300, cc), 1, cc);

    // ===== Diagram (15.3 - 37.1)
    const di = prog(t, 15.3, 16.0, E.outCubic), dOut = prog(t, 36.5, 36.95, E.inCubic);
    const dim = prog(t, 24.3, 24.8) * (1 - prog(t, 28.0, 28.5));
    const dO = prog(t, 15.3, 15.7) * (1 - dOut) * (1 - 0.65 * dim);
    place($('diagram'), 540, 820, lerp(0.85, 1, di) * lerp(1, 0.9, dOut) * (1 - 0.05 * dim), dO);
    $('diagram').style.filter = dim > 0.001 ? `blur(${(dim * 8).toFixed(2)}px)` : 'none';

    if (dO > 0.001) {
      const s = S(t), ds = S(t + 0.02) - s;
      const charging = ds > 1e-5 || (Math.abs(ds) <= 1e-5 && s > 0.5);
      // status chip
      let txt = 'Lithium-ion cell', dot = '#6b7280';
      if (t >= 28.3) { txt = `Charge cycle ${1 + Math.floor(799 * Math.pow(prog(t, 28.5, 36.4, E.linear), 1.6))}`; dot = mix('#6b7280', '#e5484d', prog(t, 31.5, 35)); }
      else if (t >= 16.0 && t < 24.4) {
        const stored = t >= 22.0;
        txt = charging ? (stored ? 'Charging · energy stored' : 'Charging') : (stored ? 'Discharging · energy released' : 'Discharging');
        dot = charging ? '#30c35c' : '#2f7cf6';
      }
      $('dTxt').textContent = txt; $('dDot').style.background = dot;
      // wire box
      $('boxTxt').textContent = charging ? 'Charger' : 'Phone';
      $('boxBolt').setAttribute('fill', charging ? '#30c35c' : '#ffb020');
      $('boxGlow').setAttribute('opacity', !charging && Math.abs(ds) > 1e-5 ? 0.8 : 0);
      // electrons ride the external wire as the cell charges/discharges
      electrons.forEach((e, j) => {
        const u = (((j / electrons.length + s * 1.4) % 1) + 1) % 1;
        const p = wire.getPointAtLength(u * wireLen);
        e.setAttribute('cx', p.x); e.setAttribute('cy', p.y);
        e.setAttribute('opacity', Math.min(u * 12, (1 - u) * 12, 1));
      });
      // ions
      ions.forEach(ion => {
        const p = E.inOutCubic(clamp((s - ion.delay) / 0.4));
        const [ax, ay] = ion.A, [bx, by] = ion.B;
        const mx = (ax + bx) / 2, my = (ay + by) / 2 + ion.wob;
        let x = (1 - p) * (1 - p) * ax + 2 * (1 - p) * p * mx + p * p * bx;
        let y = (1 - p) * (1 - p) * ay + 2 * (1 - p) * p * my + p * p * by;
        const q = prog(t, ion.trapT, ion.trapT + 0.5);
        x = lerp(x, ion.trapPos[0], q); y = lerp(y, ion.trapPos[1], q);
        const pop = q > 0 && q < 1 ? 1 + 0.4 * Math.sin(Math.PI * q) : 1;
        ion.g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${pop})`);
        ion.c.setAttribute('fill', mix('#ffb020', '#9aa0a6', q));
        ion.tx.setAttribute('fill', mix('#5a3a00', '#ffffff', q));
      });
      // wear
      const trapped = ions.filter(i => t > i.trapT).length;
      $('sei').setAttribute('opacity', clamp(trapped / 4) * 0.9);
      $('cracks').setAttribute('opacity', prog(t, 34.2, 35.6));
      $('fade').setAttribute('opacity', 0.22 * prog(t, 34.2, 36.0));
    }

    const ct = prog(t, 32.2, 32.6, E.outBack) * (1 - dOut);
    place($('callTrap'), 290, 1410, ct, clamp(ct * 2));
    const cw = prog(t, 34.3, 34.7, E.outBack) * (1 - dOut);
    place($('callWear'), 790, 1410, cw, clamp(cw * 2));

    // The catch
    const ko = prog(t, 24.45, 24.9, E.outBack) * (1 - prog(t, 27.9, 28.3));
    place($('catch'), 540, 820, lerp(0.8, 1, ko), clamp(ko * 1.5));
    const br = prog(t, 25.7, 26.3, E.outCubic);
    const col = mix('#2f7cf6', '#e5484d', br);
    document.querySelectorAll('#catch .arc').forEach(a => a.setAttribute('stroke', col));
    document.querySelectorAll('#catch .arc-f').forEach(a => a.setAttribute('fill', col));
    $('arcTop').setAttribute('transform', `rotate(${(1 - br) * ((t - 24) * 120 % 360)} 150 150)`);
    $('arcBot').setAttribute('transform', `rotate(${(1 - br) * ((t - 24) * 120 % 360)} 150 150) translate(${br * -10} ${br * 26}) rotate(${br * -12} 150 168)`);
    $('arcHead').setAttribute('opacity', 1 - br);
    $('crack').setAttribute('opacity', br);

    // ===== Result (36.9 - 45.5)
    const rOut = prog(t, 45.0, 45.5);
    const rh = prog(t, 37.05, 37.45, E.outBack) * (1 - rOut);
    place($('resultH'), 540, 330, lerp(0.8, 1, rh), clamp(rh * 1.5));
    const ca = prog(t, 37.75, 38.3, E.outCubic) * (1 - rOut);
    place($('capCard'), 540, lerp(780, 720, ca) - rOut * 40, 1, ca);
    const cap = lerp(100, 80, prog(t, 38.4, 40.1));
    $('hbFill').style.width = `calc(${cap}% - ${20 * cap / 100}px)`;
    $('hbPct').textContent = Math.round(cap) + '%';
    $('hbLost').style.width = `calc(${100 - cap}% - ${20 * (100 - cap) / 100}px)`;
    $('hbLost').style.opacity = prog(t, 38.6, 39.2);
    $('hbLostTxt').style.opacity = prog(t, 39.8, 40.2);

    const ra = prog(t, 40.85, 41.4, E.outCubic) * (1 - rOut);
    place($('resCard'), 540, lerp(1240, 1180, ra) - rOut * 40, 1, ra);
    const np = prog(t, 41.5, 43.6, E.outBack);
    $('needle').setAttribute('transform', `translate(160 170) rotate(${lerp(-70, 62, np)})`);
    $('resVal').textContent = np < 0.35 ? 'LOW' : np < 0.75 ? 'MEDIUM' : 'HIGH';
    $('resVal').style.color = np < 0.35 ? '#30c35c' : np < 0.75 ? '#ffb020' : '#e5484d';
    $('resSub').style.opacity = 0.35 + 0.65 * prog(t, 42.8, 43.3);
    // power dots slow down as resistance climbs
    let ph = 0; // integral of speed, closed form: speed goes 1 -> 0.2
    const tt = clamp((t - 41.0) / 4);
    ph = (t - 41.0) * 0.9 - 0.8 * 0.9 * 4 * (tt * tt / 2) * Math.sign(tt);
    flowDots.forEach((d, j) => {
      const u = ((j / flowDots.length + ph * 0.5) % 1 + 1) % 1;
      d.style.left = (u * 430) + 'px';
      d.style.opacity = Math.min(u * 8, (1 - u) * 8, 1) * prog(t, 41.2, 41.6);
    });

    // ===== Heat (45.3 - 51.4)
    const hOut = prog(t, 50.9, 51.4);
    $('warm').style.opacity = prog(t, 45.3, 46.1) * (1 - hOut);
    const th = prog(t, 45.4, 46.0, E.outBack) * (1 - hOut);
    place($('thermo'), 270, lerp(820, 760, th), 1, clamp(th * 1.5));
    const temp = lerp(25, 45, prog(t, 45.9, 47.2));
    const mh = lerp(110, 360, (temp - 25) / 20);
    $('merc').setAttribute('y', 460 - mh); $('merc').setAttribute('height', mh);
    $('thVal').textContent = Math.round(temp) + '°C';
    $('thVal').style.color = mix('#101114', '#e5484d', (temp - 25) / 20);
    const ag = prog(t, 45.6, 46.2, E.outBack) * (1 - hOut);
    place($('ageCard'), 750, lerp(820, 760, ag), 1, clamp(ag * 1.5));
    const lvl = 1 + 4 * prog(t, 45.9, 47.2);
    bars.forEach((b, j) => {
      const on = clamp(lvl - j);
      b.style.height = (30 + j * 17) + '%';
      b.style.background = on > 0.5 ? barCols[j] : '#edf0f2';
      b.style.transform = `scaleY(${on > 0 && on < 1 ? 0.9 + 0.1 * on : 1})`;
    });
    $('ageVal').textContent = lvl < 2.5 ? 'Normal' : lvl < 4.2 ? 'Faster' : 'Much faster';
    $('ageVal').style.color = mix('#101114', '#e5484d', (lvl - 1) / 4);
    const car = prog(t, 47.45, 48.0, E.outCubic) * (1 - hOut);
    place($('carCard'), 540, lerp(1360, 1300, car), 1, car);
    $('rays').setAttribute('transform', `rotate(${t * 40})`);
    $('waves').setAttribute('transform', `translate(0 ${-((t * 30) % 16)})`);
    $('waves').setAttribute('opacity', 0.55 + 0.45 * Math.sin(t * 8));
    $('carBad').style.opacity = prog(t, 49.0, 49.4);
    $('carBad').style.transform = `scale(${lerp(1.3, 1, prog(t, 49.0, 49.4, E.outCubic))})`;

    // ===== Ending (51 - end)
    const im = prog(t, 53.3, 53.7, E.outBack) * (1 - prog(t, 55.2, 55.5));
    place($('imagChip'), 540, 230, im, clamp(im * 2));

    const fin = prog(t, 55.5, 56.0, E.outCubic);
    const runUp = prog(t, 57.3, 57.8, E.inOutCubic);
    place($('runTxt'), 540, lerp(540, 470, fin) - runUp * 40, lerp(1, 0.72, runUp), fin * lerp(1, 0.45, runUp));
    $('strike').style.width = `calc(${prog(t, 56.6, 57.1, E.outCubic) * 100}% + 20px)`;
    $('strike').style.opacity = prog(t, 56.55, 56.65);
    place($('bigBatt'), 540, 860, lerp(0.85, 1, fin), fin);
    $('bbFill').style.width = lerp(18, 7, prog(t, 55.8, 56.8)) + '%';
    const worn = prog(t, 57.45, 58.0, E.outCubic);
    $('bbWorn').style.width = (worn * 28) + '%';
    $('bbCracks').style.opacity = prog(t, 57.7, 57.9);
    const wt = prog(t, 57.45, 57.85, E.outBack);
    place($('wornTxt'), 540, 1210, lerp(0.7, 1, wt), clamp(wt * 2));

    renderCaptions(t);
  }
  window.renderAt = renderAt;

  // ---------------------------------------------------------------- preview mode
  const isRender = /render=1/.test(location.search);
  if (isRender) { document.body.classList.add('render'); renderAt(0); return; }

  const stage = $('stage');
  function fit() {
    const k = Math.min(window.innerWidth / 1080, (window.innerHeight - 48) / 1920);
    stage.style.transform = `translate(${(window.innerWidth - 1080 * k) / 2}px,0) scale(${k})`;
  }
  window.addEventListener('resize', fit); fit();
  const audio = $('audio'), scrub = $('scrub'), tc = $('tc'), play = $('play');
  let tFree = +(new URLSearchParams(location.search).get('t') || 0);
  play.onclick = () => { if (audio.paused) { audio.currentTime = tFree; audio.play(); play.textContent = 'Pause'; } else { audio.pause(); play.textContent = 'Play'; } };
  scrub.oninput = () => { tFree = +scrub.value; audio.currentTime = tFree; };
  (function loop() {
    if (!audio.paused) tFree = audio.currentTime;
    renderAt(tFree); scrub.value = tFree; tc.textContent = tFree.toFixed(2);
    requestAnimationFrame(loop);
  })();
})();
