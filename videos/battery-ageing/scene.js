// "Why your iPhone battery ages": full film, new graphic style.
// Every visual is a pure function of t (seconds) and keyed to the voiceover's word times.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const { clamp, lerp, E, prog, rng, mix, kf } = window.Anim;
const $ = id => document.getElementById(id);
const W = 1080, H = 1920, SVGNS = 'http://www.w3.org/2000/svg', TAU = Math.PI * 2;
const DUR = 59.2;

// =====================================================================================
// TYPE PLAN (word times measured from the voiceover)
// =====================================================================================
const K = (out, ...words) => ({ words, out });
const KICKERS = [
  K(1.5, ['You', 0.06], ['buy', 0.2], ['a', 0.38], ['new', 0.45]),
  K(2.2, ['One', 1.57]),
  K(3.55, ['gets', 2.26], ['you', 2.45], ['through', 2.6], ['the', 2.94]),
  K(4.98, ['But', 3.61], ['a', 3.83], ['year', 3.92], ['or', 4.15], ['two', 4.3]),
  K(7.3, ["you're", 5.07], ['hunting', 5.25], ['for', 5.6], ['a', 5.75], ['charger', 5.85], ['by', 6.25]),
  K(8.72, ['So', 7.47], ['what', 7.86]),
  K(9.56, ['The', 9.07]),
  K(10.62, ['inside', 9.65], ['your', 10.05]),
  K(12.15, ['has', 10.81], ['actually', 11.0]),
  K(14.15, ['Every', 12.26], ['iPhone', 12.6], ['uses', 13.0], ['a', 13.25]),
  K(18.15, ['tiny', 16.05], ['particles', 16.42], ['called', 16.95], ['lithium', 17.25]),
  K(19.45, ['move', 18.2], ['between', 18.47]),
  K(20.75, ['as', 19.5], ['the', 19.6], ['battery', 19.7]),
  K(21.75, ['and', 20.79]),
  K(23.82, ["That's", 22.1], ['how', 22.35], ['energy', 22.55], ['is', 22.95]),
  K(24.4, ['and', 23.84]),
  K(25.62, ['But', 24.42], ["here's", 24.6], ['the', 24.89]),
  K(28.2, ['the', 25.78], ['process', 25.85], ["isn't", 26.37], ['perfectly', 26.73]),
  K(29.1, ['Every', 28.26], ['charge', 28.6]),
  K(31.2, ['causes', 29.13], ['tiny', 29.3], ['chemical', 29.74]),
  K(34.22, ['Over', 31.59], ['time,', 31.9], ['some', 32.33], ['lithium', 32.55], ['becomes', 33.17]),
  K(36.5, ['and', 34.27], ['the', 34.4], ['battery', 34.5], ['materials', 34.9], ['slowly', 35.45]),
  K(37.75, ['The', 36.9]),
  K(40.45, ['Your', 37.8], ['battery', 37.95], ["can't", 38.35], ['store', 38.6], ['as', 38.95], ['much', 39.1]),
  K(42.1, ['Its', 40.95], ['internal', 41.1]),
  K(43.15, ['also', 42.15]),
  K(45.25, ['making', 43.43], ['it', 43.7], ['harder', 43.8], ['to', 44.1], ['deliver', 44.2]),
  K(46.0, ['And', 45.32]),
  K(47.15, ['speeds', 45.81], ['up', 46.11], ['this', 46.25]),
  K(48.95, ["That's", 47.47], ['why', 47.7], ['leaving', 47.9], ['your', 48.25]),
  K(49.62, ['in', 48.97], ['a', 49.1]),
  K(51.05, ['is', 49.63], ['bad', 49.75], ['for', 49.95]),
  K(53.75, ['So', 51.11], ['when', 51.3], ['your', 51.5], ['iPhone', 51.7], ['dies', 52.2]),
  K(55.35, ["it's", 53.95], ['not', 54.15], ['your', 54.35]),
  K(57.4, ['The', 55.53], ['battery', 55.65], ["hasn't", 56.05], ['just', 56.3]),
  K(99, ["It's", 57.46]),
];
const B = (text, at, out, o = {}) => ({ text, at, out, acc: 99, ...o });
const AMBER = { acc: 0 };
const BIGS = [
  B('iPhone.', 0.62, 1.5), B('charge', 1.8, 2.22), B('day.', 3.02, 3.55), B('later,', 4.5, 4.98),
  B('lunchtime.', 6.45, 7.32), B('changed?', 8.12, 8.7, { acc: 7 }), B('battery.', 9.2, 9.58), B('phone.', 10.25, 10.66),
  B('aged.', 11.34, 12.15, { huge: true, ...AMBER }), B('lithium-ion', 13.35, 14.15), B('battery.', 14.2, 15.3),
  B('Inside,', 15.36, 16.0), B('ions.', 17.7, 18.15, AMBER), B('two layers.', 18.87, 19.45), B('charges', 20.22, 20.75),
  B('discharges.', 20.95, 21.8), B('stored', 23.15, 23.84), B('released.', 23.89, 24.4, AMBER),
  B('catch:', 24.95, 25.62, { acc: 5 }), B('reversible.', 27.08, 28.2), B('cycle', 28.75, 29.12), B('changes.', 30.21, 31.2),
  B('unavailable,', 33.45, 34.22), B('wear down.', 35.85, 36.5), B('result?', 37.0, 37.75, { acc: 6 }), B('energy', 39.3, 40.45, AMBER),
  B('resistance', 41.5, 42.1), B('increases,', 42.45, 43.15), B('power.', 44.59, 45.25), B('heat', 45.45, 46.0, AMBER),
  B('ageing.', 46.57, 47.15), B('phone', 48.45, 48.95), B('hot car.', 49.2, 49.95, AMBER), B('battery health.', 50.05, 51.05),
  B('faster', 52.55, 53.75), B('imagination.', 54.5, 55.35), B('run down.', 56.55, 57.4, { strike: 56.95 }),
  B('worn down.', 57.65, 99, { huge: true, ...AMBER }),
];

// =====================================================================================
// ROLLING READOUTS, CALLOUT and SFX plans
// =====================================================================================
const ROLLS = [
  { label: 'YEAR', show: [3.85, 5.0], v: t => kf(t, [[3.95, 2024], [4.9, 2026]]), fmt: n => String(n) },
  { label: 'MAX CAPACITY', show: [10.9, 12.15], v: t => kf(t, [[11.15, 100], [11.68, 79]]), fmt: n => n + '%', amberBelow: 80.5 },
  { label: 'CHARGE CYCLES', show: [28.4, 36.5], v: t => 1 + 999 * Math.pow(prog(t, 28.5, 36.2, E.linear), 1.5), fmt: n => n.toLocaleString('en-US'), up: true, maxBlur: 1.5 },
  { label: 'CAPACITY', show: [38.9, 40.9], v: t => kf(t, [[39.3, 100], [40.15, 80]]), fmt: n => n + '%', amberBelow: 80.5 },
  { label: 'INTERNAL RESISTANCE', show: [41.3, 45.2], v: t => kf(t, [[41.6, 0], [42.5, 1], [43.4, 2]]), words: ['LOW', 'MEDIUM', 'HIGH'] },
  { label: 'TEMPERATURE', show: [45.45, 48.9], v: t => kf(t, [[45.6, 25], [46.7, 45]]), fmt: n => n + '°C', up: true, amberAbove: 40 },
  { label: 'INSIDE A HOT CAR', show: [49.1, 51.0], v: t => kf(t, [[49.25, 45], [49.95, 60]]), fmt: n => n + '°C+', up: true, amberAbove: 40 },
];

const SFX = [];
const sfx = (at, name, vol) => SFX.push({ at: +at.toFixed(3), name, vol });
BIGS.forEach((b, i) => sfx(b.at - 0.02, i % 2 ? 'click' : 'pop', 0.3));
[[0.0, 'whoosh-fast', 0.45], [4.33, 'whoosh-fast', 0.4], [7.42, 'whoosh-fast', 0.4], [9.02, 'whoosh-fast', 0.4], [10.22, 'whoosh-low', 0.45],
 [11.32, 'impact-soft', 0.55], [12.24, 'whoosh-fast', 0.4], [15.3, 'whoosh-low', 0.5], [16.4, 'whoosh-soft', 0.3], [20.2, 'whoosh-soft', 0.3],
 [20.93, 'whoosh-soft', 0.3], [23.88, 'impact-soft', 0.4], [24.4, 'whoosh-soft', 0.35], [26.35, 'impact-soft', 0.45], [28.3, 'whoosh-soft', 0.3],
 [33.2, 'tick', 0.4], [36.88, 'whoosh-low', 0.45], [37.8, 'whoosh-soft', 0.3], [39.3, 'impact-soft', 0.35], [41.45, 'tick', 0.4],
 [45.3, 'whoosh-low', 0.45], [47.98, 'whoosh-fast', 0.4], [48.9, 'whoosh-soft', 0.3], [51.05, 'whoosh-soft', 0.35], [53.72, 'impact-soft', 0.4],
 [56.93, 'whoosh-fast', 0.3], [57.45, 'whoosh-fast', 0.45], [57.63, 'impact', 0.5]].forEach(a => sfx(...a));
// ticks on rolling numbers (thinned so they never machine-gun)
ROLLS.forEach(r => { let last = null, lt = -1; for (let t = r.show[0]; t <= r.show[1]; t += 1 / 240) { const n = Math.round(r.v(t)); if (last !== null && n !== last && t - lt > 0.07) { sfx(t, 'tick', 0.22); lt = t; } last = n; } });
// typing clicks for the search bar
const TYPED = 'charger near me';
const typeAt = i => 5.3 + i * 0.058;
for (let i = 0; i < TYPED.length; i++) if (TYPED[i] !== ' ') sfx(typeAt(i), 'click', 0.14);

window.VIDEO = { width: W, height: H, fps: 60, duration: DUR, bitrate: '25M', maxrate: '25M',
  audio: '../iphone-battery-aging/voiceover.mp3', audioStart: 0, sfx: SFX };

// =====================================================================================
// TEXT DOM
// =====================================================================================
function makeSpans(parent, cls, parts) {
  const el = document.createElement('div'); el.className = cls; parent.appendChild(el);
  const spans = parts.map(p => { const s = document.createElement('span'); s.textContent = p; el.appendChild(s); return s; });
  return { el, spans };
}
const kick = KICKERS.map(k => ({ ...k, ...makeSpans($('front'), 'kicker', k.words.map((w, i) => (i ? ' ' : '') + w[0])) }));
const bigs = BIGS.map(b => {
  const r = makeSpans(b.huge ? $('back') : $('front'), b.huge ? 'big huge' : 'big', [...b.text]);
  r.spans.forEach((s, i) => { if (i >= b.acc) s.classList.add('acc'); });
  if (b.strike) { r.strike = document.createElement('div'); r.strike.className = 'strike'; r.el.appendChild(r.strike); }
  return { ...b, ...r };
});
function fitBigs() {
  bigs.forEach(b => {
    const base = parseFloat(getComputedStyle(b.el).fontSize);
    let w = 0; b.spans.forEach(s => (w += s.getBoundingClientRect().width));
    const max = b.huge ? 1000 : 960;
    if (w > max) b.el.style.fontSize = (base * max / w).toFixed(1) + 'px';
    if (b.strike) { let ww = 0; b.spans.forEach(s => (ww += s.getBoundingClientRect().width)); b.strikeW = ww + 30; }
  });
}
function textState(t, tin, tout, i) {
  const p = E.outExpo(clamp((t - tin - i * 0.03) / 0.62));
  const q = E.inCubic(clamp((t - tout - i * 0.012) / 0.26));
  return { o: clamp(p * 1.6) * (1 - q), y: (1 - p) * 80 - q * 60, b: (1 - p) * 26 + q * 18, s: 1 + (1 - p) * 0.1 - q * 0.05 };
}
function applyText(s, st, drift = 0) {
  const vis = st.o > 0.003;
  s.style.visibility = vis ? 'visible' : 'hidden';
  if (!vis) return;
  s.style.opacity = st.o.toFixed(3);
  s.style.transform = `translateY(${(st.y + drift).toFixed(1)}px) scale(${st.s.toFixed(4)})`;
  s.style.filter = st.b > 0.15 ? `blur(${st.b.toFixed(1)}px)` : 'none';
}

// =====================================================================================
// THREE.JS SETUP
// =====================================================================================
const renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
const key = new THREE.DirectionalLight(0xfff1e0, 1.6); key.position.set(2.5, 3.5, 4); scene.add(key);
const rim = new THREE.DirectionalLight(0xffb36b, 1.2); rim.position.set(-3, 1, -2); scene.add(rim);
scene.add(new THREE.AmbientLight(0xffffff, 0.25));

function rr(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function slab(shape, depth, z, mat, bevel = 0.003) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 28 });
  const m = new THREE.Mesh(g, mat); m.position.z = z; return m;
}
function planeUV(geo, w, h) {
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
  uv.needsUpdate = true; return geo;
}
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; if (draw) draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.userData.canvas = c; return t;
}
function rrect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function fadeMats(list, o) { list.forEach(m => { m.transparent = o < 0.999; m.opacity = o; m.depthWrite = o > 0.6; }); }

const mats = {
  frame: new THREE.MeshPhysicalMaterial({ color: 0xc9c2b7, metalness: 0.9, roughness: 0.26, clearcoat: 0.4 }),
  back: new THREE.MeshPhysicalMaterial({ color: 0xdcd5ca, metalness: 0.15, roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.4 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x060606, metalness: 0, roughness: 0.04, clearcoat: 1 }),
  lens: new THREE.MeshPhysicalMaterial({ color: 0x0a0a0c, metalness: 0.2, roughness: 0.05, clearcoat: 1 }),
  board: new THREE.MeshStandardMaterial({ color: 0x2b2e31, metalness: 0.4, roughness: 0.5 }),
  chip: new THREE.MeshStandardMaterial({ color: 0x9a9fa6, metalness: 0.9, roughness: 0.3 }),
  batt: new THREE.MeshPhysicalMaterial({ color: 0x232325, metalness: 0.3, roughness: 0.42, clearcoat: 0.6, emissive: 0xff5a14, emissiveIntensity: 0 }),
  label: null,
};

// ---------------------------------------------------------------- phone rig
const root = new THREE.Group(); scene.add(root);
const shell = new THREE.Group(); root.add(shell);
const glassG = new THREE.Group(); root.add(glassG);
const battG = new THREE.Group(); root.add(battG);
{
  const s = rr(0.78, 1.6, 0.12); s.holes.push(rr(0.73, 1.55, 0.095));
  shell.add(slab(s, 0.078, -0.039, mats.frame, 0.006));
  shell.add(slab(rr(0.74, 1.56, 0.1), 0.01, -0.04, mats.back, 0.002));
  const bump = slab(rr(0.31, 0.31, 0.08), 0.014, -0.056, mats.back, 0.004); bump.position.set(-0.17, 0.56, -0.056); shell.add(bump);
  [[-0.24, 0.63], [-0.1, 0.63], [-0.17, 0.49]].forEach(([x, y]) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.052, 0.022, 40), mats.lens);
    l.rotation.x = Math.PI / 2; l.position.set(x, y, -0.066); shell.add(l);
  });
  const board = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.36, 0.018, 3, 0.006), mats.board);
  board.position.set(0, 0.52, -0.012); shell.add(board);
  [[-0.16, 0.55, 0.16, 0.12], [0.06, 0.5, 0.1, 0.1], [0.2, 0.58, 0.08, 0.14], [0.0, 0.62, 0.06, 0.05]].forEach(([x, y, w, h]) => {
    const c = new THREE.Mesh(new RoundedBoxGeometry(w, h, 0.012, 2, 0.003), mats.chip); c.position.set(x, y, 0.0); shell.add(c);
  });
}
const shellMats = [mats.frame, mats.back, mats.lens, mats.board, mats.chip];

let screenTex, screenCtx;
function buildPhoneTextures() {
  screenTex = canvasTex(512, 1110); screenCtx = screenTex.userData.canvas.getContext('2d');
  const labelTex = canvasTex(560, 880, (g, w, h) => {
    g.fillStyle = '#1e1e20'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; rrect(g, 30, 30, w - 60, h - 60, 18); g.stroke();
    g.fillStyle = '#e0832a'; g.font = 'italic 500 170px Playfair'; g.textAlign = 'center'; g.fillText('Li-ion', w / 2, 360);
    g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '700 22px Inter'; g.letterSpacing = '6px'; g.fillText('RECHARGEABLE CELL', w / 2, 430);
    g.fillStyle = 'rgba(255,255,255,.45)'; g.font = '600 22px Inter'; g.fillText('3.8 V  ·  NOMINAL', w / 2, 470);
    g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(70, 600 + i * 30); g.lineTo(w - 70 - (i % 3) * 90, 600 + i * 30); g.stroke(); }
  });
  glassG.add(slab(rr(0.75, 1.57, 0.105), 0.007, 0.034, mats.glass, 0.002));
  const sg = planeUV(new THREE.ShapeGeometry(rr(0.71, 1.53, 0.09), 24), 0.71, 1.53);
  const screen = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false, transparent: true }));
  screen.position.z = 0.0435; glassG.add(screen);
  battG.add(new THREE.Mesh(new RoundedBoxGeometry(0.58, 0.9, 0.036, 4, 0.016), mats.batt));
  mats.label = new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.55, metalness: 0.1 });
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.82), mats.label); lab.position.z = 0.0185; battG.add(lab);
}
const fmtClock = m => `${((Math.floor(m / 60) + 11) % 12) + 1}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
let lastScreenKey = '';
function drawScreen(s) {
  const k = `${Math.floor(s.mins)}|${Math.round(s.batt)}|${s.date}|${s.dead.toFixed(2)}|${s.hot}`;
  if (k === lastScreenKey) return; lastScreenKey = k;
  const g = screenCtx, w = 512, h = 1110;
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1d1915'); gr.addColorStop(1, '#060606');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const rg = g.createRadialGradient(256, 760, 0, 256, 760, 520); rg.addColorStop(0, `rgba(224,131,42,${s.hot ? 0.85 : 0.5})`); rg.addColorStop(1, 'rgba(224,131,42,0)');
  g.fillStyle = rg; g.fillRect(0, 0, w, h);
  g.textAlign = 'center';
  if (s.hot) {
    g.strokeStyle = '#fff'; g.lineWidth = 8; rrect(g, 236, 300, 40, 220, 20); g.stroke();
    g.fillStyle = '#ff7a2a'; g.beginPath(); g.arc(256, 560, 48, 0, TAU); g.fill(); rrect(g, 246, 360, 20, 200, 10); g.fill();
    g.fillStyle = '#fff'; g.font = '700 58px "Inter Display"'; g.fillText('Too hot', 256, 720);
    g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '500 28px Inter'; g.fillText('Let your phone cool down', 256, 770);
  } else {
    g.fillStyle = 'rgba(255,255,255,.72)'; g.font = '500 26px Inter'; g.fillText(s.date, 256, 150);
    g.fillStyle = '#fff'; g.font = '600 150px "Inter Display"'; g.fillText(fmtClock(s.mins), 256, 300);
    const low = s.batt <= 20;
    g.strokeStyle = '#fff'; g.lineWidth = 6; rrect(g, 176, 760, 150, 68, 18); g.stroke();
    g.fillStyle = '#fff'; rrect(g, 330, 780, 8, 28, 4); g.fill();
    g.fillStyle = low ? '#ff5a3c' : '#34c759'; rrect(g, 186, 770, Math.max(10, 130 * s.batt / 100), 48, 9); g.fill();
    g.fillStyle = '#fff'; g.font = '700 50px "Inter Display"'; g.fillText(Math.round(s.batt) + '%', 256, 900);
  }
  g.fillStyle = '#000'; rrect(g, 196, 28, 120, 36, 18); g.fill();
  if (s.dead > 0) {
    g.fillStyle = `rgba(0,0,0,${s.dead})`; g.fillRect(0, 0, w, h);
    g.globalAlpha = s.dead; g.strokeStyle = '#ff5a3c'; g.lineWidth = 7; rrect(g, 166, 500, 170, 80, 20); g.stroke();
    g.fillStyle = '#ff5a3c'; rrect(g, 340, 522, 10, 36, 5); g.fill(); rrect(g, 178, 512, 12, 56, 6); g.fill(); g.globalAlpha = 1;
  }
  g.fillStyle = '#000'; rrect(g, 196, 28, 120, 36, 18); g.fill();
  screenTex.needsUpdate = true;
}
function screenState(t) {
  if (t < 3.9) return { date: 'Monday, June 2', mins: kf(t, [[1.6, 480], [3.3, 1380, E.inOutCubic]]), batt: kf(t, [[1.6, 100], [3.3, 22]]), dead: 0 };
  if (t < 30) return { date: 'Tuesday, May 14', mins: kf(t, [[5.2, 480], [6.6, 750]]), batt: kf(t, [[5.2, 100], [6.6, 9, E.inQuad]]), dead: 0 };
  if (t < 51.2) return { date: '', mins: 0, batt: 0, dead: 0, hot: true };
  return { date: 'Today', mins: kf(t, [[51.6, 480], [53.6, 700]]), batt: kf(t, [[51.6, 100], [53.6, 0, E.inQuad]]), dead: prog(t, 53.6, 53.95) };
}

// ---------------------------------------------------------------- cell rig (layers + ions)
const rig = new THREE.Group(); scene.add(rig);
const rigMats = {
  cath: new THREE.MeshPhysicalMaterial({ color: 0xa39686, metalness: 0.6, roughness: 0.32, clearcoat: 0.3 }),
  anode: new THREE.MeshPhysicalMaterial({ color: 0x2a2a2c, metalness: 0.3, roughness: 0.45 }),
  plate: new THREE.MeshPhysicalMaterial({ color: 0x46464a, metalness: 0.4, roughness: 0.35, clearcoat: 0.4 }),
  sep: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.6, transparent: true, opacity: 0.45 }),
  wire: new THREE.MeshStandardMaterial({ color: 0x1a1918, roughness: 0.4 }),
  sei: new THREE.MeshStandardMaterial({ color: 0x8a6440, roughness: 0.8 }),
};
const cathode = new THREE.Mesh(new RoundedBoxGeometry(0.42, 1.5, 0.32, 4, 0.03), rigMats.cath); cathode.position.x = -0.55; rig.add(cathode);
const anodeG = new THREE.Group(); anodeG.position.x = 0.55; rig.add(anodeG);
anodeG.add(new THREE.Mesh(new RoundedBoxGeometry(0.42, 1.5, 0.3, 4, 0.03), rigMats.anode));
const plates = [];
for (let k = 0; k < 9; k++) {
  const p = new THREE.Mesh(new RoundedBoxGeometry(0.47, 0.014, 0.34, 2, 0.006), rigMats.plate);
  p.position.y = -0.68 + k * 0.17; anodeG.add(p); plates.push(p);
}
const sep = new THREE.Mesh(new RoundedBoxGeometry(0.014, 1.62, 0.38, 2, 0.006), rigMats.sep); rig.add(sep);
const sei = new THREE.Mesh(new THREE.BoxGeometry(1, 1.46, 0.28), rigMats.sei); sei.position.x = 0.335; sei.scale.x = 0.0001; rig.add(sei);
const wireCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.55, 0.76, 0), new THREE.Vector3(-0.55, 1.0, 0), new THREE.Vector3(0, 1.14, 0), new THREE.Vector3(0.55, 1.0, 0), new THREE.Vector3(0.55, 0.76, 0)]);
const wire = new THREE.Mesh(new THREE.TubeGeometry(wireCurve, 80, 0.008, 10), rigMats.wire); rig.add(wire);
const electrons = [];
for (let j = 0; j < 10; j++) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.02, 16, 12), rigMats.wire); rig.add(e); electrons.push(e); }
const R = rng(7);
const NI = 28;
const anodeSlots = [...Array(32).keys()].sort(() => R() - 0.5).slice(0, NI);
const order = [...Array(NI).keys()].sort(() => R() - 0.5);
const TRAPPED = [3, 9, 14, 20, 6, 17, 1, 25];
const ions = [];
for (let i = 0; i < NI; i++) {
  const mat = new THREE.MeshStandardMaterial({ color: 0xffb35c, emissive: 0xff8a2a, emissiveIntensity: 1.1, roughness: 0.35 });
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 24, 18), mat); rig.add(m);
  const c = i % 4, r = Math.floor(i / 4), a = anodeSlots[i], ac = a % 4, ar = Math.floor(a / 4), ti = TRAPPED.indexOf(i);
  ions.push({ m, mat,
    A: new THREE.Vector3(-0.55 + (c - 1.5) * 0.095, (r - 3) * 0.2, 0.21),
    B: new THREE.Vector3(0.55 + (ac - 1.5) * 0.095, -0.595 + ar * 0.17, 0.21),
    wob: (R() - 0.5) * 0.5, delay: (order[i] / NI) * 0.6, pop: 16.42 + order[i] * 0.017,
    trapT: ti >= 0 ? 33.2 + ti * 0.11 : 1e6,
    trapPos: new THREE.Vector3(0.28, -0.6 + (ti >= 0 ? ti : 0) * 0.17, 0.02 + (ti % 3) * 0.06) });
}
const rigAllMats = [rigMats.cath, rigMats.anode, rigMats.plate, rigMats.wire, rigMats.sei];
const S = t => kf(t, [[18.2, 0], [19.3, 0.38], [20.15, 0], [20.85, 1], [21.7, 0], [22.95, 0], [23.75, 1], [24.45, 0], [28.4, 0]]) +
  (t > 28.4 && t < 36.4 ? 0.5 - 0.5 * Math.cos(TAU * (t - 28.4) / 0.8) : 0);

// =====================================================================================
// 2D OVERLAYS
// =====================================================================================
function svg(tag, attrs, parent = $('ui')) { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
const v3 = new THREE.Vector3();
function project(obj, [x, y, z]) { v3.set(x, y, z); obj.localToWorld(v3); v3.project(camera); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H]; }

// callouts
function makeCallout(label, side) {
  const g = svg('g', {});
  return { side, g, path: svg('path', { fill: 'none', stroke: '#141312', 'stroke-width': 2.5, pathLength: 1, 'stroke-dasharray': 1 }, g),
    ping: svg('circle', { r: 8, fill: 'none', stroke: '#141312', 'stroke-width': 2 }, g), dot: svg('circle', { r: 7, fill: '#141312' }, g),
    text: Object.assign(svg('text', { class: 'cl-txt', 'text-anchor': side > 0 ? 'start' : 'end' }, g), { textContent: label }) };
}
const CALLOUTS = [
  ['BATTERY.', 1, 9.35, 10.16, () => battG, [0.22, 0.26, 0.02], [190, -150]],
  ['LOGIC BOARD.', -1, 9.8, 10.16, () => shell, [-0.2, 0.5, 0.0], [-170, -130]],
  ['LITHIUM-ION CELL.', -1, 10.4, 10.92, () => battG, [-0.24, -0.3, 0.02], [-60, 190]],
  ['LITHIUM ION.', 1, 17.8, 18.7, () => ions[5].m, [0, 0, 0], [170, -170]],
  ['CATHODE.', -1, 18.95, 21.75, () => cathode, [-0.15, -0.55, 0.16], [-80, 200]],
  ['ANODE.', 1, 19.15, 21.75, () => anodeG, [0.15, -0.55, 0.16], [80, 200]],
  ['TRAPPED LITHIUM.', 1, 33.55, 34.75, () => ions[TRAPPED[3]].m, [0, 0, 0], [200, 240]],
  ['WORN ELECTRODES.', -1, 35.2, 36.45, () => cathode, [-0.12, 0.45, 0.16], [-60, -200]],
  ['TOO HOT.', 1, 48.75, 49.9, () => glassG, [0.25, 0.4, 0.05], [170, -130]],
  ['BATTERY HEALTH ↓', -1, 50.1, 51.0, () => glassG, [-0.25, -0.35, 0.05], [-70, 190]],
].map(([label, side, tin, tout, obj, pt, d]) => ({ c: makeCallout(label, side), tin, tout, obj, pt, d }));

// capacity ring (act B)
const ringG = svg('g', {});
svg('circle', { r: 410, fill: 'none', stroke: 'rgba(20,19,18,.12)', 'stroke-width': 2 }, ringG);
const ringTicks = []; for (let i = 0; i < 72; i++) ringTicks.push(svg('line', { stroke: 'rgba(20,19,18,.35)', 'stroke-width': i % 6 ? 2 : 3, 'stroke-linecap': 'round' }, ringG));
const ringArc = svg('circle', { r: 410, fill: 'none', stroke: '#e0832a', 'stroke-width': 7, 'stroke-linecap': 'round', pathLength: 100 }, ringG);

// day arc (act A)
const dayG = svg('g', {});
const dayArc = svg('path', { d: 'M90 1080 A450 450 0 0 1 990 1080', fill: 'none', stroke: 'rgba(20,19,18,.3)', 'stroke-width': 2.5, pathLength: 1, 'stroke-dasharray': 1, 'stroke-linecap': 'round' }, dayG);
const dayTrail = svg('path', { d: 'M90 1080 A450 450 0 0 1 990 1080', fill: 'none', stroke: '#e0832a', 'stroke-width': 6, pathLength: 1, 'stroke-dasharray': '0 1', 'stroke-linecap': 'round' }, dayG);
const sun = svg('circle', { r: 20, fill: '#e0832a' }, dayG);
const sunHalo = svg('circle', { r: 36, fill: 'none', stroke: '#e0832a', 'stroke-width': 2, opacity: 0.5 }, dayG);
const dayL = Object.assign(svg('text', { class: 'sm-txt', x: 90, y: 1130, 'text-anchor': 'middle' }, dayG), { textContent: '8 AM' });
const dayR = Object.assign(svg('text', { class: 'sm-txt', x: 990, y: 1130, 'text-anchor': 'middle' }, dayG), { textContent: '11 PM' });

// row of phone outlines (act C) on the back layer
const rowG = svg('g', {}, $('backsvg'));
for (let i = 0; i < 9; i++) {
  const g = svg('g', { transform: `translate(${i * 260} 0)` }, rowG);
  svg('rect', { x: -85, y: -175, width: 170, height: 350, rx: 34, fill: 'none', stroke: 'rgba(20,19,18,.22)', 'stroke-width': 3 }, g);
  svg('rect', { x: -26, y: -158, width: 52, height: 14, rx: 7, fill: 'rgba(20,19,18,.22)' }, g);
}

// broken loop (act E)
const loopG = svg('g', {});
const loopA = svg('path', { d: 'M-300 0 A300 300 0 0 1 300 0', fill: 'none', stroke: '#141312', 'stroke-width': 10, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1 }, loopG);
const loopB = svg('path', { d: 'M300 0 A300 300 0 0 1 -300 0', fill: 'none', stroke: '#141312', 'stroke-width': 10, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1 }, loopG);
const headA = svg('polygon', { points: '276,-12 324,-12 300,26', fill: '#141312' }, loopG);
const headB = svg('polygon', { points: '-276,12 -324,12 -300,-26', fill: '#141312' }, loopG);

// power channel (act G)
const chanG = svg('g', {});
const chanTop = svg('path', { fill: 'none', stroke: '#141312', 'stroke-width': 3 }, chanG);
const chanBot = svg('path', { fill: 'none', stroke: '#141312', 'stroke-width': 3 }, chanG);
const zig = svg('path', { d: 'M440 1290 l20 -26 l25 52 l25 -52 l25 52 l25 -52 l20 26', fill: 'none', stroke: '#e0832a', 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1 }, chanG);
const flowDots = []; for (let j = 0; j < 22; j++) flowDots.push(svg('circle', { r: 10, fill: '#e0832a' }, chanG));

// heat shimmer (act H)
const shimG = svg('g', {});
const shims = []; for (let j = 0; j < 7; j++) shims.push(svg('path', { fill: 'none', stroke: 'rgba(160,60,10,.45)', 'stroke-width': 4, 'stroke-linecap': 'round' }, shimG));

// line-art car (act H) on the back layer
const carG = svg('g', { transform: 'translate(40 760)' }, $('backsvg'));
const carPaths = [
  'M40 520 Q40 450 110 435 L250 410 L360 300 Q392 268 440 268 L640 268 Q688 268 718 300 L830 410 L910 428 Q960 440 960 500 L960 540 Q960 560 940 560 L60 560 Q40 560 40 540 Z',
  'M392 318 Q404 300 430 300 L520 300 L520 410 L290 410 Z', 'M550 300 L640 300 Q668 300 684 318 L780 410 L550 410 Z',
].map(d => svg('path', { d, fill: 'none', stroke: '#141312', 'stroke-width': 5, 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1 }, carG));
const wheels = [[230, 560], [770, 560]].map(([x, y]) => svg('circle', { cx: x, cy: y, r: 78, fill: 'none', stroke: '#141312', 'stroke-width': 5, pathLength: 1, 'stroke-dasharray': 1 }, carG));
const sunG = svg('g', { transform: 'translate(880 120)' }, carG);
svg('circle', { r: 56, fill: '#e0832a' }, sunG);
const rays = svg('g', {}, sunG);
for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; svg('line', { x1: Math.cos(a) * 80, y1: Math.sin(a) * 80, x2: Math.cos(a) * 108, y2: Math.sin(a) * 108, stroke: '#e0832a', 'stroke-width': 7, 'stroke-linecap': 'round' }, rays); }

// rolling readouts
const rolls = ROLLS.map(r => {
  const el = document.createElement('div'); el.className = 'readout';
  el.innerHTML = `<div class="lbl">${r.label}</div><div class="roll"></div>`; $('readouts').appendChild(el);
  const items = [0, 1, 2, 3].map(() => { const d = document.createElement('div'); el.lastChild.appendChild(d); return d; });
  return { ...r, el, items };
});

// film grain
{
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const im = g.createImageData(256, 256); const RR = rng(3);
  for (let i = 0; i < im.data.length; i += 4) { const v = 110 + RR() * 145; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); $('grain').style.backgroundImage = `url(${c.toDataURL()})`;
}

// =====================================================================================
// RENDER
// =====================================================================================
const spin = t => TAU * (prog(t, 4.33, 5.0, E.outExpo) + prog(t, 7.42, 8.1, E.outExpo) + prog(t, 12.24, 12.95, E.outExpo));

function renderAt(t) {
  const float = Math.sin(t * 1.9) * 0.018;

  // ---------------- camera: always moving
  const camZ = kf(t, [[0, 6.1], [3, 5.8, E.linear], [4.35, 5.5], [7.3, 5.6], [9.0, 5.75], [9.65, 5.0, E.outCubic], [10.25, 5.15], [10.8, 5.0, E.outCubic],
    [12.2, 4.8, E.linear], [15.3, 5.2, E.linear], [15.75, 4.4, E.inCubic], [16.2, 5.1, E.outCubic], [24.4, 4.6, E.linear], [28.3, 4.95], [36.4, 4.45, E.linear],
    [36.9, 5.2], [40.9, 4.9, E.linear], [41.4, 5.7], [45.3, 5.5, E.linear], [45.8, 4.8, E.outCubic], [47.5, 4.6, E.linear], [48.6, 5.7, E.outCubic],
    [51.1, 5.5, E.linear], [51.8, 5.0], [57.4, 4.7, E.linear], [58.1, 4.95, E.outCubic], [DUR, 4.7, E.linear]]);
  camera.position.set(Math.sin(t * 0.7) * 0.06, 0.02 + Math.cos(t * 0.9) * 0.03, camZ);
  camera.lookAt(0, -0.05, 0);

  // ---------------- phone / battery rig
  const rootScale = kf(t, [[15.3, 1], [15.75, 3.6, E.inCubic], [36.95, 0.45], [37.6, 1, E.outExpo]]);
  const battO = kf(t, [[15.45, 1], [15.75, 0], [36.95, 0], [37.3, 1]]);
  root.visible = battO > 0.001;
  root.scale.setScalar(rootScale);
  root.position.set(kf(t, [[0, 1.6], [0.72, 0, E.outExpo]]),
    kf(t, [[0, -1.5], [0.72, -0.22, E.outExpo], [10.2, -0.22], [10.75, -0.1, E.outCubic], [40.9, -0.1], [41.4, 0.28, E.outExpo], [45.0, 0.28], [45.6, -0.05, E.outExpo],
      [47.5, -0.05], [48.6, -0.2, E.outCubic], [51.2, -0.2], [51.8, -0.22], [DUR, -0.18]]) + float, 0);
  root.rotation.set(
    kf(t, [[0, 0.35], [0.72, 0.1, E.outExpo], [9.05, 0.1], [9.6, 0.42, E.outExpo], [10.25, 0.32], [10.75, 0.08, E.outExpo], [36.9, 0.05], [48.0, 0.05],
      [48.6, 0.2, E.outCubic], [51.2, 0.2], [51.8, 0.06], [57.4, 0.06], [58.0, 0.3, E.outExpo], [DUR, 0.25]]),
    kf(t, [[0, -2.9], [0.72, -0.32, E.outExpo], [3.3, 0.28, E.linear], [4.3, 0.2], [6.9, -0.25, E.linear], [8.42, -0.12], [8.8, 0.32], [9.05, 0.3], [9.6, -0.62, E.outExpo],
      [10.25, 0.3, E.linear], [10.75, -0.18, E.outExpo], [12.2, 0.1, E.linear], [14.8, -0.2, E.linear], [36.9, -0.5], [37.6, -0.15, E.outExpo], [40.9, 0.2, E.linear],
      [45.3, -0.2, E.linear], [47.4, 0.15, E.linear], [48.6, -0.35, E.outExpo], [51.1, -0.15, E.linear], [51.8, -0.05], [57.4, 0.1, E.linear], [58.0, -0.25, E.outExpo],
      [DUR, -0.12, E.linear]]) + spin(t),
    kf(t, [[0, 0.5], [0.72, 0.04, E.outExpo], [9.6, -0.06], [10.75, 0.0]]) + Math.sin(t * 1.3) * 0.015);

  // glass: 0 attached, 0.3 lifted, 1 gone
  const gst = kf(t, [[9.04, 0], [9.3, 0.3, E.outCubic], [9.72, 1, E.inCubic], [48.0, 1], [48.55, 0, E.outExpo], [57.46, 0], [57.9, 1, E.inCubic]]);
  const lift = clamp(gst / 0.3), fly = clamp((gst - 0.3) / 0.7);
  glassG.position.set(fly * 0.6, fly * 2.8, lift * 0.32 + fly * 0.9);
  glassG.rotation.set(-fly * 0.7, fly * 0.4, fly * 0.3);
  glassG.visible = fly < 0.999;
  // shell drop
  const drop = kf(t, [[10.25, 0], [10.7, 1, E.inCubic], [47.9, 1], [48.45, 0, E.outExpo], [57.5, 0], [58.0, 1, E.inCubic]]);
  shell.position.set(0, -drop * 0.5, -drop * 0.9); shell.scale.setScalar(1 - drop * 0.15);
  fadeMats(shellMats, 1 - drop); shell.visible = drop < 0.999;
  // battery
  const fwd = kf(t, [[10.25, 0], [10.75, 1, E.outExpo], [47.9, 1], [48.4, 0, E.outExpo], [57.55, 0], [58.05, 1, E.outExpo]]);
  const age = kf(t, [[11.32, 0], [11.85, 1, E.outCubic], [57.6, 1], [58.25, 1.7, E.outCubic]]);
  battG.position.set(0, lerp(-0.22, 0.02, fwd), lerp(-0.008, 0.25, fwd));
  const sxy = 1 + fwd * 0.08 + age * 0.02; battG.scale.set(sxy, sxy, 1 + age * 0.9);
  mats.batt.color.set(mix('#232325', '#3b2f25', clamp(age)));
  mats.batt.emissiveIntensity = kf(t, [[45.4, 0], [46.4, 0.55], [47.6, 0.55], [48.3, 0], [57.6, 0], [58.3, 0.25]]);
  if (mats.label) { mats.label.color.set(mix('#ffffff', '#b7a48f', clamp(age))); fadeMats([mats.batt, mats.label], battO); }
  rim.intensity = 1.2 + 1.6 * kf(t, [[45.3, 0], [45.9, 1], [50.9, 1], [51.4, 0]]);
  drawScreen(screenState(t));

  // ---------------- cell rig
  const rigIn = prog(t, 15.5, 16.0, E.outExpo), rigOut = prog(t, 36.9, 37.35, E.inCubic);
  const rigO = clamp(rigIn * 1.5) * (1 - rigOut);
  rig.visible = rigO > 0.001;
  if (rig.visible) {
    rig.scale.setScalar(0.6 * lerp(0.6, 1, rigIn) * lerp(1, 0.5, rigOut));
    rig.position.set(0, -0.22 + float, 0);
    rig.rotation.set(0.15 + Math.sin(t * 0.8) * 0.03, kf(t, [[15.5, -0.9], [16.3, -0.35, E.outExpo], [24.4, 0.25, E.linear], [28.3, -0.3], [36.4, 0.3, E.linear]]), 0);
    cathode.position.x = lerp(-0.55, 0, rigOut); anodeG.position.x = lerp(0.55, 0, rigOut);
    fadeMats(rigAllMats, rigO); rigMats.sep.opacity = 0.45 * rigO;
    const s = S(t);
    // electrons ride the wire
    const ein = prog(t, 18.1, 18.5);
    electrons.forEach((e, j) => {
      const u = (((j / electrons.length + s * 1.4) % 1) + 1) % 1;
      e.position.copy(wireCurve.getPointAt(u)); e.scale.setScalar(ein * Math.min(1, u * 10, (1 - u) * 10) + 0.0001);
    });
    wire.scale.setScalar(1); rigMats.wire.opacity = rigO * ein; rigMats.wire.transparent = true;
    // ions
    const tmp = new THREE.Vector3();
    ions.forEach(ion => {
      const p = E.inOutCubic(clamp((s - ion.delay) / 0.4));
      const ctrl = new THREE.Vector3(0, (ion.A.y + ion.B.y) / 2 + ion.wob, 0.6);
      tmp.set(0, 0, 0).addScaledVector(ion.A, (1 - p) * (1 - p)).addScaledVector(ctrl, 2 * (1 - p) * p).addScaledVector(ion.B, p * p);
      const q = prog(t, ion.trapT, ion.trapT + 0.45, E.outCubic);
      tmp.lerp(ion.trapPos, q);
      ion.m.position.copy(tmp);
      const pop = E.outBack(clamp((t - ion.pop) / 0.35));
      ion.m.scale.setScalar(Math.max(0.0001, pop * (1 + 0.5 * Math.sin(Math.PI * q)) * (1 - rigOut)));
      ion.mat.color.set(mix('#ffb35c', '#8f8a84', q)); ion.mat.emissiveIntensity = 1.1 * (1 - q) * (1 + 1.2 * kf(t, [[23.85, 0], [24.0, 1], [24.5, 0]]));
    });
    // wear
    const wear = prog(t, 34.85, 36.3, E.inOutCubic);
    rigMats.cath.color.set(mix('#a39686', '#6d645a', wear)); rigMats.cath.roughness = 0.32 + wear * 0.5;
    plates.forEach((p, k) => { p.rotation.z = wear * (((k * 37) % 7) - 3) * 0.035; p.position.x = wear * (((k * 53) % 5) - 2) * 0.012; });
    cathode.scale.set(1, 1 - wear * 0.05, 1);
    const trappedN = ions.filter(i => t > i.trapT).length;
    sei.scale.x = Math.max(0.0001, 0.035 * clamp(trappedN / 6));
  }

  scene.updateMatrixWorld(); camera.updateMatrixWorld();
  renderer.render(scene, camera);

  // ---------------- canvas dim (act E)
  const dimE = prog(t, 24.35, 24.8) * (1 - prog(t, 27.95, 28.4));
  $('gl').style.filter = dimE > 0.002 ? `blur(${(dimE * 10).toFixed(1)}px)` : 'none';
  $('gl').style.opacity = (1 - 0.6 * dimE).toFixed(3);

  // ---------------- contact shadow
  const shObj = root.visible ? root : rig;
  const [, sy] = project(shObj, [0, root.visible ? -0.95 : -0.9, 0]);
  const sh = $('shadow');
  sh.style.top = Math.min(1700, sy + 30).toFixed(1) + 'px';
  sh.style.opacity = (prog(t, 0.2, 0.8) * (root.visible ? (1 - 0.5 * drop) * battO : rigO) * (0.85 + float * 4) * (1 - 0.6 * dimE)).toFixed(3);
  sh.style.transform = `scaleX(${(root.visible ? 1 - drop * 0.15 + fwd * 0.1 : 1.2).toFixed(3)})`;

  // ---------------- backgrounds & glow
  $('warm').style.opacity = kf(t, [[45.3, 0], [45.9, 1], [50.95, 1], [51.5, 0]]).toFixed(3);
  const glow = Math.max(kf(t, [[11.3, 0], [11.75, 0.95], [12.1, 0.95], [12.5, 0]]), kf(t, [[23.85, 0], [24.05, 0.8], [24.6, 0]]), kf(t, [[57.62, 0], [58.1, 1]]));
  $('glow').style.opacity = glow.toFixed(3);
  $('glow').style.transform = `scale(${(0.85 + 0.15 * Math.sin(t * 2)).toFixed(3)})`;

  // ---------------- type
  const drift = -Math.sin(t * 0.9) * 6;
  kick.forEach(k => {
    if (t < k.words[0][1] - 0.1 || t > k.out + 0.6) { k.el.style.display = 'none'; return; }
    k.el.style.display = ''; k.spans.forEach((s, i) => applyText(s, textState(t, k.words[i][1], k.out, 0), drift));
  });
  bigs.forEach(b => {
    if (t < b.at - 0.1 || t > b.out + 0.7) { b.el.style.display = 'none'; return; }
    b.el.style.display = '';
    b.spans.forEach((s, i) => {
      const st = textState(t, b.at, b.out, i);
      if (b.huge) st.s *= lerp(1.12, 1, prog(t, b.at, b.at + 1.2, E.outCubic));
      applyText(s, st, b.huge ? 0 : drift);
    });
    if (b.strike) {
      const p = prog(t, b.strike, b.strike + 0.35, E.outExpo), q = prog(t, b.out, b.out + 0.25);
      b.strike.style.width = (b.strikeW || 600) + 'px'; b.strike.style.marginLeft = (-(b.strikeW || 600) / 2) + 'px';
      b.strike.style.transform = `translateY(${drift}px) scaleX(${p.toFixed(4)})`; b.strike.style.opacity = (1 - q).toFixed(3);
    }
  });

  // ---------------- callouts
  CALLOUTS.forEach(({ c, tin, tout, obj, pt, d }) => {
    const p = prog(t, tin, tin + 0.38, E.outCubic), q = prog(t, tout, tout + 0.22, E.inCubic);
    const vis = p > 0 && q < 1;
    c.g.style.display = vis ? '' : 'none';
    if (!vis) return;
    const [ax, ay] = project(obj(), pt), tw = c.text.textContent.length * 22 + 30, by = ay + d[1];
    let bx = ax + d[0];
    if (c.side > 0) bx = Math.min(bx, W - 64 - tw - 70); else bx = Math.max(bx, 64 + tw + 70);
    const ex = bx + c.side * 70;
    c.path.setAttribute('d', `M${ax.toFixed(1)},${ay.toFixed(1)} L${bx.toFixed(1)},${by.toFixed(1)} L${ex.toFixed(1)},${by.toFixed(1)}`);
    c.path.setAttribute('stroke-dashoffset', (1 - p + q).toFixed(3));
    c.dot.setAttribute('cx', ax); c.dot.setAttribute('cy', ay); c.dot.setAttribute('r', 7 * clamp(p * 3) * (1 - q));
    const pp = prog(t, tin, tin + 0.6, E.outCubic);
    c.ping.setAttribute('cx', ax); c.ping.setAttribute('cy', ay); c.ping.setAttribute('r', 8 + pp * 26); c.ping.setAttribute('opacity', (1 - pp) * (1 - q));
    c.text.setAttribute('x', ex + c.side * (14 + (1 - p) * 24)); c.text.setAttribute('y', by + 9);
    c.text.setAttribute('opacity', clamp((p - 0.4) / 0.6) * (1 - q));
  });

  // ---------------- act A: day arc
  const dayIn = prog(t, 1.6, 2.1, E.outCubic), dayOut = prog(t, 3.5, 3.85);
  dayG.style.display = dayIn > 0 && dayOut < 1 ? '' : 'none';
  if (dayIn > 0 && dayOut < 1) {
    dayG.style.opacity = 1 - dayOut;
    dayArc.setAttribute('stroke-dashoffset', 1 - dayIn);
    const u = prog(t, 1.7, 3.3, E.inOutCubic);
    dayTrail.setAttribute('stroke-dasharray', `${u} 1`);
    const a = Math.PI - u * Math.PI, sx = 540 + Math.cos(a) * 450, sy2 = 1080 - Math.sin(a) * 450;
    sun.setAttribute('cx', sx); sun.setAttribute('cy', sy2); sun.setAttribute('r', 20 * dayIn);
    sun.setAttribute('fill', mix('#e0832a', '#3b3a5c', u));
    sunHalo.setAttribute('cx', sx); sunHalo.setAttribute('cy', sy2); sunHalo.setAttribute('r', 30 + 10 * Math.sin(t * 6));
    dayL.setAttribute('opacity', dayIn); dayR.setAttribute('opacity', prog(t, 2.8, 3.2));
  }

  // ---------------- act A: search bar typing
  const so = prog(t, 5.15, 5.55, E.outExpo) * (1 - prog(t, 7.2, 7.5));
  const srch = $('search');
  srch.style.opacity = so.toFixed(3);
  srch.style.transform = `translateY(${((1 - so) * 70).toFixed(1)}px) scale(${lerp(0.92, 1, so).toFixed(4)})`;
  srch.style.filter = so < 0.98 ? `blur(${((1 - so) * 12).toFixed(1)}px)` : 'none';
  let n = 0; for (let i = 0; i < TYPED.length; i++) if (t >= typeAt(i)) n = i + 1;
  $('typed').textContent = TYPED.slice(0, n);
  $('caret').style.opacity = (Math.floor(t * 3) % 2 || n < TYPED.length) ? 1 : 0;

  // ---------------- act B: capacity ring
  const [cx, cy] = project(battG, [0, 0, 0]);
  const rin = prog(t, 10.8, 11.18, E.outCubic) * (1 - prog(t, 12.05, 12.4));
  ringG.style.display = rin > 0 ? '' : 'none';
  if (rin > 0) {
    ringG.setAttribute('transform', `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${(-90 + (1 - rin) * -40).toFixed(2)}) scale(${lerp(0.9, 1, rin).toFixed(4)})`);
    ringG.style.opacity = clamp(rin * 2);
    const cap = ROLLS[1].v(t);
    ringArc.setAttribute('stroke-dasharray', `${(rin * cap).toFixed(2)} 100`);
    ringArc.setAttribute('stroke', mix('#141312', '#e0832a', prog(t, 11.2, 11.4)));
    ringTicks.forEach((l, i) => {
      const a = (i / 72) * TAU, on = clamp(rin * 72 - i), r1 = 432, r2 = 432 + (i % 6 ? 10 : 20) * on;
      l.setAttribute('x1', Math.cos(a) * r1); l.setAttribute('y1', Math.sin(a) * r1); l.setAttribute('x2', Math.cos(a) * r2); l.setAttribute('y2', Math.sin(a) * r2);
      l.setAttribute('opacity', on);
    });
  }

  // ---------------- act C: phone outlines + Li tile
  const row = prog(t, 12.2, 12.6) * (1 - prog(t, 13.4, 13.8));
  rowG.style.display = row > 0 ? '' : 'none';
  rowG.setAttribute('transform', `translate(${(-200 - (t - 12.2) * 520).toFixed(1)} 1050)`); rowG.style.opacity = row;
  const tl = prog(t, 13.4, 13.85, E.outExpo) * (1 - prog(t, 15.1, 15.4));
  const tile = $('tile');
  tile.style.opacity = tl.toFixed(3);
  tile.style.transform = `translate(${(760 + Math.sin(t) * 6).toFixed(1)}px, ${(560 + (1 - tl) * 60).toFixed(1)}px) rotate(${lerp(14, 6, tl).toFixed(2)}deg) scale(${lerp(0.85, 1, tl).toFixed(3)})`;
  tile.style.filter = tl < 0.98 ? `blur(${((1 - tl) * 14).toFixed(1)}px)` : 'none';

  // ---------------- act E: broken loop
  const lo = prog(t, 24.42, 24.85, E.outExpo) * (1 - prog(t, 27.9, 28.3));
  loopG.style.display = lo > 0 ? '' : 'none';
  if (lo > 0) {
    const brk = prog(t, 26.37, 26.75, E.outExpo);
    const rot = (t - 24.4) * 70 * (1 - brk) + brk * 30;
    loopG.setAttribute('transform', `translate(540 1050) rotate(${rot.toFixed(2)}) scale(${lerp(0.8, 1, lo).toFixed(4)})`);
    loopG.style.opacity = lo;
    loopA.setAttribute('stroke-dashoffset', 1 - lo); loopB.setAttribute('stroke-dashoffset', 1 - lo);
    const col = mix('#141312', '#e0832a', brk);
    [loopA, loopB].forEach(p => p.setAttribute('stroke', col)); [headA, headB].forEach(p => p.setAttribute('fill', col));
    loopB.setAttribute('stroke-dasharray', `${(1 - 0.22 * brk).toFixed(3)} 1`);
    headB.setAttribute('opacity', (1 - brk).toFixed(3));
    loopB.setAttribute('transform', `translate(0 ${(brk * 40).toFixed(1)}) rotate(${(brk * -8).toFixed(2)})`);
  }

  // ---------------- act G: power channel
  const ch = prog(t, 41.0, 41.45, E.outExpo) * (1 - prog(t, 45.0, 45.35));
  chanG.style.display = ch > 0 ? '' : 'none';
  if (ch > 0) {
    chanG.style.opacity = ch;
    const a = kf(t, [[41.6, 0], [43.4, 0.82]]);
    const xs = [], top = [], bot = [];
    for (let k = 0; k <= 60; k++) {
      const u = k / 60, x = 120 + 840 * u, hh = 46 * (1 - 0.72 * a * Math.exp(-Math.pow((u - 0.5) / 0.1, 2)));
      xs.push(x); top.push(`${k ? 'L' : 'M'}${x.toFixed(1)},${(1380 - hh).toFixed(1)}`); bot.push(`${k ? 'L' : 'M'}${x.toFixed(1)},${(1380 + hh).toFixed(1)}`);
    }
    const reveal = ch; chanTop.setAttribute('d', top.join(' ')); chanBot.setAttribute('d', bot.join(' '));
    chanTop.setAttribute('stroke-dasharray', `${reveal * 900} 2000`); chanBot.setAttribute('stroke-dasharray', `${reveal * 900} 2000`);
    zig.setAttribute('stroke-dashoffset', 1 - prog(t, 41.5, 41.9, E.outCubic));
    // speed falls as resistance rises; integral is analytic for a linear ramp
    const v0 = 0.32, v1 = 0.07, ta = 41.6, tb = 43.4;
    const ph = t < ta ? (t - 41.0) * v0 : t < tb ? 0.6 * v0 + (t - ta) * v0 - (v0 - v1) * Math.pow(t - ta, 2) / (2 * (tb - ta)) : 0.6 * v0 + (tb - ta) * (v0 + v1) / 2 + (t - tb) * v1;
    flowDots.forEach((d, j) => {
      const u = (((j / flowDots.length + ph) % 1) + 1) % 1, uw = u + a * Math.sin(TAU * u) / TAU;
      d.setAttribute('cx', (120 + 840 * uw).toFixed(1)); d.setAttribute('cy', 1380);
      d.setAttribute('r', (10 * (1 - 0.5 * a * Math.exp(-Math.pow((uw - 0.5) / 0.1, 2)))).toFixed(2));
      d.setAttribute('opacity', (Math.min(1, u * 8, (1 - u) * 8)).toFixed(3));
    });
  }

  // ---------------- act H: shimmer + car
  const shm = prog(t, 45.6, 46.1) * (1 - prog(t, 47.6, 48.0));
  shimG.style.display = shm > 0 ? '' : 'none';
  if (shm > 0) {
    shimG.style.opacity = shm;
    shims.forEach((p, j) => {
      const x = 260 + j * 93, ph = ((t * 0.9 + j * 0.37) % 1);
      const y0 = 1350 - ph * 600; let d = `M${x},${y0}`;
      for (let k = 1; k <= 8; k++) d += ` Q${x + (k % 2 ? 18 : -18)},${y0 - k * 22 + 11} ${x},${y0 - k * 22}`;
      p.setAttribute('d', d); p.setAttribute('opacity', (Math.sin(Math.PI * ph)).toFixed(3));
    });
  }
  const car = prog(t, 48.85, 49.6, E.outCubic) * (1 - prog(t, 50.9, 51.3));
  carG.style.display = car > 0 ? '' : 'none';
  if (car > 0) {
    carG.style.opacity = clamp(car * 3) * (1 - prog(t, 50.9, 51.3));
    carPaths.forEach((p, i) => p.setAttribute('stroke-dashoffset', 1 - clamp(car * 1.4 - i * 0.2)));
    wheels.forEach(w => w.setAttribute('stroke-dashoffset', 1 - clamp(car * 1.3 - 0.3)));
    rays.setAttribute('transform', `rotate(${(t * 40).toFixed(1)})`);
    sunG.setAttribute('transform', `translate(880 120) scale(${E.outBack(clamp((t - 49.0) / 0.5)).toFixed(3)})`);
    carG.setAttribute('transform', `translate(${(40 + (1 - car) * 60).toFixed(1)} 760)`);
  }

  // ---------------- rolling readouts
  rolls.forEach(r => {
    const o = prog(t, r.show[0], r.show[0] + 0.35, E.outExpo) * (1 - prog(t, r.show[1] - 0.3, r.show[1]));
    r.el.style.opacity = o.toFixed(3);
    r.el.style.display = o > 0.002 ? '' : 'none';
    if (o <= 0.002) return;
    r.el.style.transform = `translateY(${((1 - o) * 60).toFixed(1)}px)`;
    const v = r.v(t), speed = Math.abs(r.v(t + 0.01) - v) * 100;
    const base = Math.floor(v);
    r.items.forEach((d, k) => {
      const m = base - 1 + k;
      if (r.words) d.textContent = r.words[m] ?? ''; else d.textContent = r.fmt(m);
      d.style.transform = `translateY(${((r.up ? m - v : v - m) * 150).toFixed(1)}px)`;
      d.style.filter = speed > 1 ? `blur(${Math.min(r.maxBlur ?? 8, speed * (r.words ? 2 : 0.12)).toFixed(1)}px)` : 'none';
      const amb = (r.amberBelow && v < r.amberBelow && Math.round(v) === m) || (r.amberAbove && v > r.amberAbove && Math.round(v) === m) || (r.words && m === 2 && v > 1.5);
      d.style.color = amb ? '#e0832a' : '#141312';
    });
  });

  // ---------------- grain
  const RG = rng(Math.floor(t * 60) + 11);
  $('grain').style.backgroundPosition = `${Math.floor(RG() * 256)}px ${Math.floor(RG() * 256)}px`;
}

window.READY = (async () => {
  await document.fonts.load('italic 500 100px Playfair');
  await document.fonts.load('600 100px "Inter Display"');
  await document.fonts.load('700 30px Inter');
  buildPhoneTextures();
  fitBigs();
  renderAt(0);
})();
window.renderAt = renderAt;

// =====================================================================================
// PREVIEW MODE
// =====================================================================================
if (/render=1/.test(location.search)) document.body.classList.add('render');
else {
  const stage = $('stage');
  const fit = () => { const k = Math.min(innerWidth / W, (innerHeight - 48) / H); stage.style.transform = `translate(${(innerWidth - W * k) / 2}px,0) scale(${k})`; };
  addEventListener('resize', fit); fit();
  const audio = $('audio'), scrub = $('scrub'); let tl = 0;
  $('play').onclick = () => { if (audio.paused) { audio.currentTime = tl; audio.play(); } else audio.pause(); };
  scrub.oninput = () => { tl = +scrub.value; audio.pause(); };
  window.READY.then(function loop() {
    if (!audio.paused) tl = audio.currentTime;
    renderAt(clamp(tl, 0, DUR)); scrub.value = tl; $('tc').textContent = tl.toFixed(2);
    requestAnimationFrame(loop);
  });
}
