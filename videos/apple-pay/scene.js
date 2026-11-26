// "How Apple makes money when you tap to pay": full film, battery-ageing house style.
// Every visual is a pure function of t (seconds) and keyed to the voiceover's word times.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const { clamp, lerp, E, prog, rng, mix, kf } = window.Anim;
const $ = id => document.getElementById(id);
const W = 1080, H = 1920, SVGNS = 'http://www.w3.org/2000/svg', TAU = Math.PI * 2;
const DUR = 56.9;
const INK = '#141312', AMB = '#e0832a';
const pad2 = n => String(n).padStart(2, '0');
const turn = (t, a, b, n = 1) => TAU * n * prog(t, a, b, E.outExpo);
const shake = (t, a, d = 0.45, f = 38, amp = 1) => (t < a || t > a + d) ? 0 : amp * Math.sin((t - a) * f) * (1 - (t - a) / d);
const qb = (a, c, b, u) => (1 - u) * (1 - u) * a + 2 * (1 - u) * u * c + u * u * b;

// =====================================================================================
// TYPE PLAN (word times measured from the voiceover)
// =====================================================================================
const K = (out, ...words) => ({ words, out });
const KICKERS = [
  K(1.48, ['Every', 0.05], ['time', 0.3], ['you', 0.45], ['tap', 0.67], ['your', 0.92]),
  K(2.3, ['to', 1.52]),
  K(3.45, ['Apple', 2.36], ['gets', 2.72]),
  K(4.85, ['But', 3.69], ['not', 3.97], ['by', 4.26]),
  K(6.55, ['And', 5.06], ['not', 5.3], ['by', 5.63], ['the', 5.85]),
  K(8.34, ['Your', 6.79], ['iPhone', 6.9]),
  K(9.65, ['your', 8.38], ['real', 8.55]),
  K(10.92, ['It', 9.7], ['sends', 9.86], ['a', 10.2]),
  K(12.05, ['digital', 10.99]),
  K(12.7, ['the', 12.14]),
  K(14.5, ['in', 12.71], ['a', 12.85], ['tiny', 12.98]),
  K(15.1, ['The', 14.59]),
  K(16.8, ['passes', 15.12], ['it', 15.44], ['to', 15.62], ['the', 15.72]),
  K(17.98, ['The', 16.86], ['network', 16.95]),
  K(18.72, ['to', 17.75], ['your', 17.85]),
  K(20.48, ['Your', 18.78], ['bank', 18.88]),
  K(21.95, ['and', 20.51], ['sends', 20.63], ['the', 20.95]),
  K(23.5, ['In', 22.12], ['about', 22.25], ['a', 22.66]),
  K(24.72, ["Here's", 23.62], ['the', 23.92]),
  K(26.9, ['that', 24.75], ['bank', 25.0]),
  K(27.75, ['In', 26.95], ['the', 27.05]),
  K(28.85, ['Apple', 27.8]),
  K(31.45, ['takes', 28.88], ['around', 29.15]),
  K(32.68, ['of', 31.5], ['every', 31.6], ['credit', 31.85]),
  K(33.96, ['About', 32.69]),
  K(35.2, ['on', 33.98]),
  K(37.25, ['out', 35.26], ['of', 35.46], ['the', 35.63], ["bank's", 35.84]),
  K(38.95, ['Why', 37.36], ['would', 37.58], ['a', 37.72], ['bank', 37.79]),
  K(39.98, ['Because', 38.99]),
  K(41.9, ['make', 39.84], ['stolen', 40.02], ['card', 40.37], ['numbers', 40.61]),
  K(43.38, ['and', 41.98], ['the', 42.12], ['card', 42.23], ['in', 42.45], ['your', 42.55]),
  K(45.1, ['is', 43.4], ['the', 43.5]),
  K(46.72, ['The', 45.19], ['deal', 45.29]),
  K(48.3, ['but', 46.61], ['the', 46.83], ['idea', 46.95], ['is', 47.25], ['the', 47.4]),
  K(50.38, ['So', 48.42], ['next', 48.68], ['time', 49.11], ['you', 49.2], ['tap,', 49.43]),
  K(51.4, ["you're", 50.47], ['not', 50.6], ['just', 50.86]),
  K(52.32, ['with', 51.42], ['your', 51.58]),
  K(53.95, ["You're", 52.36], ['starting', 52.55], ['a', 52.95]),
  K(55.18, ['and', 54.07], ['Apple', 54.18], ['takes', 54.64], ['a', 54.85]),
  K(99, ['at', 55.24], ['the', 55.35]),
];
const B = (text, at, out, o = {}) => ({ text, at, out, acc: 99, ...o });
const AMBER = { acc: 0 };
const BIGS = [
  B('iPhone', 1.08, 1.48), B('pay,', 1.67, 2.3), B('paid.', 2.96, 3.45, AMBER), B('you.', 4.45, 4.85), B('shop.', 5.96, 6.55),
  B('never', 7.58, 7.92, AMBER), B('hands over', 7.95, 8.34), B('card number.', 8.84, 9.65), B('one-time', 10.32, 10.92), B('token,', 11.37, 12.05, AMBER),
  B('baton', 12.25, 12.7), B('relay race.', 13.15, 14.5), B('terminal', 14.7, 15.1), B('card network.', 15.85, 16.8), B('runs it', 17.46, 17.98),
  B('bank.', 18.0, 18.72), B('checks it,', 19.13, 19.7), B('approves it,', 19.85, 20.48, AMBER), B('answer back.', 21.05, 21.95),
  B('second.', 22.83, 23.5), B('twist:', 24.05, 24.72, AMBER), B('pays Apple.', 25.65, 26.9, { acc: 5 }), B('US,', 27.21, 27.75),
  B('reportedly', 28.08, 28.85), B('0.15%', 29.68, 31.45, AMBER), B('purchase.', 32.05, 32.68), B('15 cents', 33.27, 33.96, AMBER),
  B('$100,', 34.12, 35.2), B('own fee.', 36.1, 37.25), B('pay?', 38.1, 38.95, { acc: 3 }), B('tokens', 39.48, 39.98, AMBER),
  B('useless,', 41.0, 41.9, AMBER), B('Apple Wallet', 42.63, 43.38), B('card you use.', 43.67, 45.1, { acc: 9 }), B('varies', 45.55, 46.0),
  B('by country,', 46.02, 46.72), B('same.', 47.47, 48.3, AMBER), B('remember:', 49.65, 50.38, AMBER), B('paying', 51.08, 51.4),
  B('phone.', 51.67, 52.32), B('relay race,', 53.01, 53.95), B('cut', 54.99, 55.18, AMBER), B('finish line.', 55.44, 99, AMBER),
];

// =====================================================================================
// ROLLING READOUTS and SFX plans
// =====================================================================================
const ROLLS = [
  { label: 'YOU PAY APPLE', show: [3.75, 4.98], v: t => kf(t, [[3.95, 15], [4.5, 0]]), fmt: n => '$0.' + pad2(n), amb: 0 },
  { label: 'THE SHOP PAYS APPLE', show: [5.1, 6.6], v: t => kf(t, [[5.4, 15], [6.0, 0]]), fmt: n => '$0.' + pad2(n), amb: 0 },
  { label: 'TOTAL TIME', show: [22.15, 23.6], v: t => kf(t, [[22.3, 0], [22.95, 5]]), words: ['0.0 s', '0.2 s', '0.4 s', '0.6 s', '0.8 s', '≈ 1 s'], amb: 5, up: true },
  { label: 'MARKET', show: [26.95, 28.8], v: t => kf(t, [[26.98, 0], [27.3, 2]]), words: ['UK', 'EU', 'US'], amb: 2, up: true },
  { label: "APPLE'S CUT · REPORTED", show: [28.9, 31.45], v: t => kf(t, [[29.7, 0], [31.15, 15]]), fmt: n => '0.' + pad2(n) + '%', up: true, amb: 15, maxBlur: 3 },
  { label: 'A STOLEN NUMBER IS', show: [40.0, 41.9], v: t => kf(t, [[40.92, 0], [41.12, 1]]), words: ['VALUABLE', 'USELESS'], amb: 1, up: true },
];

const SFX = [];
const sfx = (at, name, vol) => SFX.push({ at: +at.toFixed(3), name, vol });
BIGS.forEach((b, i) => sfx(b.at - 0.02, i % 2 ? 'click' : 'pop', 0.3));
[[0.0, 'whoosh-fast', 0.45], [0.67, 'tick', 0.3], [1.67, 'tick', 0.3], [2.96, 'impact-soft', 0.45], [3.69, 'whoosh-fast', 0.4], [6.68, 'whoosh-fast', 0.45],
 [7.58, 'tick', 0.3], [7.95, 'whoosh-soft', 0.35], [11.37, 'whoosh-fast', 0.45], [12.18, 'whoosh-low', 0.45], [13.15, 'whoosh-soft', 0.35], [13.38, 'whoosh-fast', 0.35],
 [14.3, 'whoosh-soft', 0.3], [14.57, 'whoosh-low', 0.45], [15.12, 'whoosh-fast', 0.45], [15.8, 'whoosh-fast', 0.4], [15.9, 'net', 0.25], [16.95, 'whoosh-soft', 0.35],
 [17.95, 'whoosh-low', 0.45], [19.13, 'whoosh-soft', 0.35], [19.86, 'impact-soft', 0.55], [20.53, 'whoosh-soft', 0.35], [21.05, 'whoosh-fast', 0.4], [21.6, 'pop', 0.35],
 [22.1, 'whoosh-soft', 0.35], [22.97, 'impact-soft', 0.4], [24.0, 'whoosh-fast', 0.45], [24.08, 'whoosh-low', 0.4], [24.7, 'whoosh-soft', 0.35], [25.62, 'whoosh-fast', 0.45],
 [26.05, 'impact', 0.5], [26.92, 'whoosh-soft', 0.35], [27.35, 'whoosh-low', 0.4], [28.08, 'whoosh-fast', 0.35], [29.66, 'whoosh-soft', 0.3], [31.17, 'impact-soft', 0.45],
 [31.45, 'whoosh-fast', 0.4], [32.63, 'whoosh-low', 0.45], [35.86, 'tick', 0.3], [36.3, 'whoosh-fast', 0.35], [36.62, 'pop', 0.35], [37.28, 'whoosh-fast', 0.4],
 [37.4, 'whoosh-low', 0.4], [38.12, 'tick', 0.3], [38.38, 'tick', 0.25], [38.95, 'whoosh-fast', 0.4], [39.48, 'whoosh-fast', 0.4], [40.02, 'whoosh-fast', 0.45],
 [41.0, 'impact', 0.55], [41.88, 'whoosh-low', 0.45], [43.67, 'whoosh-fast', 0.45], [45.13, 'whoosh-fast', 0.4], [45.3, 'whoosh-low', 0.4], [47.47, 'impact-soft', 0.5],
 [48.35, 'whoosh-fast', 0.4], [48.5, 'whoosh-low', 0.35], [49.43, 'tick', 0.35], [49.65, 'whoosh-soft', 0.35], [51.67, 'whoosh-fast', 0.4], [52.33, 'whoosh-fast', 0.4],
 [52.45, 'whoosh-soft', 0.3], [54.18, 'pop', 0.35], [54.64, 'whoosh-fast', 0.4], [54.99, 'impact', 0.5], [55.44, 'whoosh-fast', 0.45], [55.62, 'impact-soft', 0.5],
].forEach(a => sfx(...a));
// ticks on rolling numbers (thinned so they never machine-gun)
ROLLS.forEach(r => { let last = null, lt = -1; for (let t = r.show[0]; t <= r.show[1]; t += 1 / 240) { const n = Math.round(r.v(t)); if (last !== null && n !== last && t - lt > 0.07) { sfx(t, 'tick', 0.22); lt = t; } last = n; } });
// digit scramble ticks
for (let t = 10.34; t < 11.3; t += 0.09) sfx(t, 'tick', 0.16);
// receipt rows + network nodes + stream coins + globe pins + relay steps
[33.27, 34.12, 35.3, 36.12].forEach(a => sfx(a + 0.04, 'click', 0.22));
for (let i = 0; i < 6; i++) sfx(31.93 + i * 0.15, 'tick', 0.25);
for (let i = 0; i < 5; i++) sfx(45.55 + i * 0.17, 'pop', 0.22);
[13.2, 13.27, 13.34, 13.41, 52.5, 52.57, 52.64, 52.71].forEach(a => sfx(a, 'tick', 0.18));
[53.0, 53.24, 53.47, 55.44].forEach(a => sfx(a, 'click', 0.25));
[14.72, 15.87, 18.02, 21.1, 21.35].forEach(a => sfx(a, 'tick', 0.22));

window.VIDEO = { width: W, height: H, fps: 60, duration: DUR, bitrate: '25M', maxrate: '25M',
  audio: 'voiceover.mp3', audioStart: 0, sfx: SFX };

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
  const r = makeSpans($('front'), 'big', [...b.text]);
  r.spans.forEach((s, i) => { if (i >= b.acc) s.classList.add('acc'); });
  return { ...b, ...r };
});
function fitBigs() {
  bigs.forEach(b => {
    const base = parseFloat(getComputedStyle(b.el).fontSize);
    let w = 0; b.spans.forEach(s => (w += s.getBoundingClientRect().width));
    if (w > 960) b.el.style.fontSize = (base * 960 / w).toFixed(1) + 'px';
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
function setXf(o, s) {
  o.visible = s.s > 0.002;
  o.position.set(s.x || 0, s.y || 0, s.z || 0);
  o.rotation.set(s.rx || 0, s.ry || 0, s.rz || 0);
  o.scale.setScalar(Math.max(0.0001, s.s));
}

const mats = {
  frame: new THREE.MeshPhysicalMaterial({ color: 0xc9c2b7, metalness: 0.9, roughness: 0.26, clearcoat: 0.4 }),
  back: new THREE.MeshPhysicalMaterial({ color: 0xdcd5ca, metalness: 0.15, roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.4 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x060606, metalness: 0, roughness: 0.04, clearcoat: 1 }),
  lens: new THREE.MeshPhysicalMaterial({ color: 0x0a0a0c, metalness: 0.2, roughness: 0.05, clearcoat: 1 }),
  inkBody: new THREE.MeshPhysicalMaterial({ color: 0x24221f, metalness: 0.25, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.3 }),
  key: new THREE.MeshPhysicalMaterial({ color: 0x3d3935, metalness: 0.1, roughness: 0.45, clearcoat: 0.4 }),
  stone: new THREE.MeshPhysicalMaterial({ color: 0xf3eee6, metalness: 0, roughness: 0.55, clearcoat: 0.2 }),
  stoneInk: new THREE.MeshPhysicalMaterial({ color: 0x1f1d1b, metalness: 0.2, roughness: 0.4, clearcoat: 0.6 }),
  amber: new THREE.MeshPhysicalMaterial({ color: 0xe8862e, metalness: 0.25, roughness: 0.3, clearcoat: 0.8, emissive: 0xc8601a, emissiveIntensity: 0.25 }),
  coinEdge: new THREE.MeshPhysicalMaterial({ color: 0xe3963f, metalness: 0.85, roughness: 0.28, clearcoat: 0.5 }),
  cardEdge: new THREE.MeshPhysicalMaterial({ color: 0x2a2724, metalness: 0.3, roughness: 0.4 }),
};

// ---------------------------------------------------------------- phone
const phone = new THREE.Group(); scene.add(phone);
let phoneTex, phoneCtx;
{
  const s = rr(0.78, 1.6, 0.12); s.holes.push(rr(0.73, 1.55, 0.095));
  phone.add(slab(s, 0.078, -0.039, mats.frame, 0.006));
  phone.add(slab(rr(0.74, 1.56, 0.1), 0.01, -0.04, mats.back, 0.002));
  const bump = slab(rr(0.31, 0.31, 0.08), 0.014, -0.056, mats.back, 0.004); bump.position.set(-0.17, 0.56, -0.056); phone.add(bump);
  [[-0.24, 0.63], [-0.1, 0.63], [-0.17, 0.49]].forEach(([x, y]) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.052, 0.022, 40), mats.lens);
    l.rotation.x = Math.PI / 2; l.position.set(x, y, -0.066); phone.add(l);
  });
  phone.add(slab(rr(0.75, 1.57, 0.105), 0.007, 0.034, mats.glass, 0.002));
}
function buildPhoneScreen() {
  phoneTex = canvasTex(512, 1110); phoneCtx = phoneTex.userData.canvas.getContext('2d');
  const sg = planeUV(new THREE.ShapeGeometry(rr(0.71, 1.53, 0.09), 24), 0.71, 1.53);
  const screen = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: phoneTex, toneMapped: false, transparent: true }));
  screen.position.z = 0.0435; phone.add(screen);
}

// ---------------------------------------------------------------- card art (shared by 3D cards and the phone screen)
const STY = { ink: ['#3a3530', '#151413', '#fff'], amber: ['#f4ac62', '#d4691b', '#fff'], paper: ['#fdfbf7', '#e2d9cb', '#141312'],
  grey: ['#9a938a', '#5f5952', '#fff'], token: ['#f6b26b', '#d36c1c', '#fff'] };
function contactless(g, x, y, s, col, lw) {
  g.strokeStyle = col; g.lineWidth = lw; g.lineCap = 'round';
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x, y, s * (0.32 + i * 0.3), -0.8, 0.8); g.stroke(); }
}
function drawCardArt(g, x, y, w, h, style, o = {}) {
  const [c0, c1, fg] = STY[style], u = w / 1024;
  g.save(); rrect(g, x, y, w, h, w * 0.055); g.clip();
  const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fillRect(x, y, w, h);
  const sh = g.createRadialGradient(x + w * 0.85, y - h * 0.1, 0, x + w * 0.85, y - h * 0.1, w * 0.9);
  sh.addColorStop(0, 'rgba(255,255,255,.22)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(x, y, w, h);
  g.strokeStyle = fg === '#fff' ? 'rgba(255,255,255,.08)' : 'rgba(20,19,18,.07)'; g.lineWidth = 3 * u;
  for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(x + w * 1.02, y + h * 1.15, w * (0.3 + i * 0.075), 0, TAU); g.stroke(); }
  g.restore();
  if (o.back) {
    g.fillStyle = '#0c0b0a'; g.fillRect(x, y + 80 * u, w, 120 * u);
    g.fillStyle = 'rgba(255,255,255,.85)'; rrect(g, x + 70 * u, y + 270 * u, 560 * u, 80 * u, 8 * u); g.fill();
    return;
  }
  g.fillStyle = fg; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.font = `700 ${36 * u}px Inter`; g.letterSpacing = `${7 * u}px`; g.globalAlpha = 0.92; g.fillText(o.bank || '', x + 70 * u, y + 105 * u); g.globalAlpha = 1;
  if (o.token) {
    g.strokeStyle = fg; g.lineWidth = 12 * u; g.beginPath(); g.arc(x + 145 * u, y + 250 * u, 42 * u, Math.PI, 0); g.stroke();
    g.fillStyle = fg; rrect(g, x + 82 * u, y + 245 * u, 126 * u, 100 * u, 16 * u); g.fill();
    g.fillStyle = c1; g.beginPath(); g.arc(x + 145 * u, y + 287 * u, 13 * u, 0, TAU); g.fill(); g.fillRect(x + 140 * u, y + 290 * u, 10 * u, 30 * u);
  } else {
    const cg = g.createLinearGradient(x + 70 * u, y + 215 * u, x + 220 * u, y + 327 * u); cg.addColorStop(0, '#eadbb6'); cg.addColorStop(1, '#a88f60');
    g.fillStyle = cg; rrect(g, x + 70 * u, y + 215 * u, 150 * u, 112 * u, 18 * u); g.fill();
    g.strokeStyle = 'rgba(80,60,30,.45)'; g.lineWidth = 3 * u;
    [[70, 271, 220, 271], [145, 215, 145, 327], [70, 243, 120, 243], [170, 299, 220, 299]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(x + a * u, y + b * u); g.lineTo(x + c * u, y + d * u); g.stroke(); });
  }
  contactless(g, x + 290 * u, y + 271 * u, 90 * u, fg, 10 * u);
  if (o.num) { g.fillStyle = fg; g.font = `600 ${76 * u}px "Inter Display"`; g.letterSpacing = `${5 * u}px`; g.fillText(o.num, x + 70 * u, y + 470 * u); }
  g.font = `700 ${26 * u}px Inter`; g.letterSpacing = `${6 * u}px`; g.globalAlpha = 0.75; g.fillText(o.name || 'CARDHOLDER', x + 70 * u, y + 578 * u);
  g.textAlign = 'right'; g.fillText(o.kind || 'CREDIT', x + w - 70 * u, y + 578 * u); g.globalAlpha = 1; g.letterSpacing = '0px';
}

// ---------------------------------------------------------------- 3D cards
const CW = 0.86, CH = 0.542;
const cardGeo = { body: null, face: null };
function makeCard(frontTex, backTex) {
  if (!cardGeo.body) { cardGeo.face = planeUV(new THREE.ShapeGeometry(rr(CW, CH, 0.036), 16), CW, CH); }
  const g = new THREE.Group();
  g.add(slab(rr(CW - 0.004, CH - 0.004, 0.034), 0.008, -0.004, mats.cardEdge, 0.002));
  const fm = new THREE.MeshPhysicalMaterial({ map: frontTex, roughness: 0.32, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const bm = new THREE.MeshPhysicalMaterial({ map: backTex, roughness: 0.32, metalness: 0.05, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const f = new THREE.Mesh(cardGeo.face, fm); f.position.z = 0.0066; g.add(f);
  const b = new THREE.Mesh(cardGeo.face, bm); b.position.z = -0.0066; b.rotation.y = Math.PI; g.add(b);
  scene.add(g); return g;
}
const REAL = '4821 7730 1956 0042', TOKEN = '5310 8826 4479 1203';
const WALLET = [['amber', 'MERIDIAN BANK'], ['ink', 'NORTH BANK'], ['paper', 'HARBOR CREDIT'], ['grey', 'CITY BANK']];
let mainCard, mainFrontTex, streamCards = [], popCard, lastNum = '';
function buildCards() {
  mainFrontTex = canvasTex(1024, 646);
  const tokenTex = canvasTex(1024, 646, (g, w, h) => drawCardArt(g, 0, 0, w, h, 'token', { bank: 'DIGITAL TOKEN', num: TOKEN, token: true, name: 'ONE-TIME USE', kind: 'TOKEN' }));
  mainCard = makeCard(mainFrontTex, tokenTex);
  const backTex = canvasTex(1024, 646, (g, w, h) => drawCardArt(g, 0, 0, w, h, 'ink', { back: true }));
  const wTex = WALLET.map(([st, bank], i) => canvasTex(1024, 646, (g, w, h) => drawCardArt(g, 0, 0, w, h, st, { bank, num: ['•••• 4821', '•••• 1186', '•••• 6630', '•••• 2409'][i] })));
  for (let i = 0; i < 6; i++) streamCards.push(makeCard(wTex[(i + 1) % 4], backTex));
  popCard = makeCard(wTex[0], backTex);
}
function cardNum(t) {
  if (t < 10.3 || t > 13) return REAL;
  const R = rng(Math.floor(t * 24) * 7 + 3);
  return [...REAL].map((ch, i) => ch === ' ' ? ' ' : (t > 10.32 + i * 0.025 ? String(Math.floor(R() * 10)) : ch)).join('');
}
function drawMainFront(num) {
  if (num === lastNum) return; lastNum = num;
  const c = mainFrontTex.userData.canvas, g = c.getContext('2d');
  g.clearRect(0, 0, c.width, c.height);
  drawCardArt(g, 0, 0, c.width, c.height, 'ink', { bank: 'MERIDIAN BANK', num, name: 'YOUR REAL CARD', kind: 'CREDIT' });
  mainFrontTex.needsUpdate = true;
}

// shards for the "useless" shatter
const shards = new THREE.Group(); scene.add(shards);
const SH = [];
{
  const R = rng(21);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
    const m = new THREE.Mesh(new RoundedBoxGeometry(0.165, 0.17, 0.012, 2, 0.004), mats.amber);
    const x0 = (i - 2) * 0.172, y0 = (j - 1) * 0.18;
    shards.add(m);
    SH.push({ m, x0, y0, vx: x0 * 2.2 + (R() - 0.5) * 0.5, vy: y0 * 1.6 + (R() - 0.3) * 0.5, vz: 0.4 + R() * 0.8, r: [(R() - 0.5) * 9, (R() - 0.5) * 9, (R() - 0.5) * 6] });
  }
}

// ---------------------------------------------------------------- baton
const baton = new THREE.Group(); scene.add(baton);
{
  const inner = new THREE.Group(); inner.rotation.z = Math.PI / 2; baton.add(inner);
  inner.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.5, 10, 32), mats.amber));
  [-0.17, 0.17].forEach(y => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.079, 0.079, 0.035, 40), mats.stoneInk); b.position.y = y; inner.add(b); });
}

// ---------------------------------------------------------------- payment terminal
const terminal = new THREE.Group(); scene.add(terminal);
let termTex, termKey = '';
function buildTerminal() {
  terminal.add(new THREE.Mesh(new RoundedBoxGeometry(0.64, 1.1, 0.13, 5, 0.06), mats.inkBody));
  termTex = canvasTex(512, 420);
  const sc = new THREE.Mesh(planeUV(new THREE.ShapeGeometry(rr(0.52, 0.426, 0.035), 12), 0.52, 0.426), new THREE.MeshBasicMaterial({ map: termTex, toneMapped: false }));
  sc.position.set(0, 0.24, 0.0655); terminal.add(sc);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
    const k = new THREE.Mesh(new RoundedBoxGeometry(0.135, 0.075, 0.02, 2, 0.012), r === 3 && c === 2 ? mats.amber : mats.key);
    k.position.set((c - 1) * 0.165, -0.1 - r * 0.1, 0.066); terminal.add(k);
  }
}
function drawTerminal(st, p) {
  const k = st + '|' + Math.round(p * 24); if (k === termKey) return; termKey = k;
  const g = termTex.userData.canvas.getContext('2d'), w = 512, h = 420;
  g.fillStyle = '#0f0e0d'; g.fillRect(0, 0, w, h);
  const rg = g.createRadialGradient(256, 260, 0, 256, 260, 300); rg.addColorStop(0, `rgba(224,131,42,${0.18 + 0.35 * p})`); rg.addColorStop(1, 'rgba(224,131,42,0)');
  g.fillStyle = rg; g.fillRect(0, 0, w, h);
  g.textAlign = 'center'; g.fillStyle = '#fff'; g.font = '600 92px "Inter Display"'; g.fillText('$24.00', 256, 128);
  if (st === 'sent') {
    g.strokeStyle = AMB; g.lineWidth = 12; g.beginPath(); g.arc(256, 262, 62, 0, TAU); g.stroke();
    g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(226, 264); g.lineTo(249, 287); g.lineTo(290, 240); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '600 32px Inter'; g.fillText('Sent', 256, 384);
  } else {
    g.save(); g.translate(218, 262); contactless(g, 0, 0, 110, st === 'read' ? AMB : '#fff', 12); g.restore();
    if (st === 'read') { g.strokeStyle = AMB; g.lineWidth = 8; g.beginPath(); g.arc(256, 262, 80, -Math.PI / 2, -Math.PI / 2 + TAU * p); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '600 32px Inter'; g.fillText(st === 'read' ? 'Reading…' : 'Tap to pay', 256, 384);
  }
  termTex.needsUpdate = true;
}

// ---------------------------------------------------------------- bank
const bank = new THREE.Group(); scene.add(bank);
{
  const add = (geo, mat, x, y, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); bank.add(m); return m; };
  add(new RoundedBoxGeometry(1.22, 0.07, 0.52, 3, 0.012), mats.stoneInk, 0, -0.46);
  add(new RoundedBoxGeometry(1.12, 0.06, 0.46, 3, 0.012), mats.stone, 0, -0.395);
  add(new RoundedBoxGeometry(1.04, 0.05, 0.42, 3, 0.012), mats.stone, 0, -0.34);
  for (let i = 0; i < 5; i++) {
    const x = -0.4 + i * 0.2;
    add(new THREE.CylinderGeometry(0.052, 0.058, 0.52, 32), mats.stone, x, -0.055, 0.08);
    add(new RoundedBoxGeometry(0.14, 0.04, 0.14, 2, 0.008), mats.stone, x, 0.225, 0.08);
  }
  add(new RoundedBoxGeometry(1.1, 0.09, 0.44, 3, 0.012), mats.stoneInk, 0, 0.29);
  const tri = new THREE.Shape(); tri.moveTo(-0.6, 0); tri.lineTo(0.6, 0); tri.lineTo(0, 0.25); tri.lineTo(-0.6, 0);
  const ped = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.4, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 }), mats.stoneInk);
  ped.position.set(0, 0.335, -0.2); bank.add(ped);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 32), mats.amber); disc.rotation.x = Math.PI / 2; disc.position.set(0, 0.43, 0.215); bank.add(disc);
}

// ---------------------------------------------------------------- coin
const coin = new THREE.Group(); scene.add(coin);
function buildCoin() {
  const face = canvasTex(512, 512, (g, w) => {
    const rg = g.createRadialGradient(200, 180, 20, 256, 256, 300); rg.addColorStop(0, '#ffcf8f'); rg.addColorStop(0.6, '#eb9840'); rg.addColorStop(1, '#c4661c');
    g.fillStyle = rg; g.fillRect(0, 0, w, w);
    g.strokeStyle = 'rgba(120,55,10,.45)'; g.lineWidth = 10; g.beginPath(); g.arc(256, 256, 206, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(255,240,210,.5)'; g.lineWidth = 4; g.beginPath(); g.arc(256, 256, 190, 0, TAU); g.stroke();
    g.translate(256, 256); g.rotate(-Math.PI / 2); g.fillStyle = '#7a3a0c'; g.font = 'italic 500 300px Playfair'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('¢', 0, 6);
  });
  const fm = new THREE.MeshPhysicalMaterial({ map: face, metalness: 0.55, roughness: 0.32, clearcoat: 0.6 });
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.045, 72), [mats.coinEdge, fm, fm]);
  m.rotation.x = Math.PI / 2; coin.add(m);
}

// ---------------------------------------------------------------- globe of dots
const globe = new THREE.Group(); scene.add(globe);
const GR = 0.55, PINS = [['US', 39, -98], ['BR', -11, -52], ['UK', 54, -2], ['EU', 49, 11], ['ZA', -29, 24]];
const pinMeshes = [];
const ll = (lat, lon, r) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return new THREE.Vector3(r * Math.cos(a) * Math.sin(b), r * Math.sin(a), r * Math.cos(a) * Math.cos(b)); };
{
  const N = 1100, pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const y = 1 - (i + 0.5) / N * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
    pos.set([Math.cos(th) * r * GR, y * GR, Math.sin(th) * r * GR], i * 3);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dot = canvasTex(64, 64, g => { g.fillStyle = '#fff'; g.beginPath(); g.arc(32, 32, 26, 0, TAU); g.fill(); });
  dot.colorSpace = THREE.NoColorSpace;
  globe.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x141312, size: 0.021, alphaMap: dot, transparent: true, alphaTest: 0.4, opacity: 1 })));
  const occ = new THREE.Mesh(new THREE.SphereGeometry(GR * 0.985, 48, 32), new THREE.MeshBasicMaterial({ colorWrite: false }));
  globe.add(occ);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(GR * 1.16, 0.0022, 6, 200), mats.stoneInk); ring.rotation.x = Math.PI / 2; globe.add(ring);
  PINS.forEach(([, la, lo]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.03, 20, 14), mats.amber); m.position.copy(ll(la, lo, GR * 1.01)); globe.add(m); pinMeshes.push(m); });
}

// =====================================================================================
// 2D OVERLAYS
// =====================================================================================
function svg(tag, attrs, parent = $('ui')) { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
const v3 = new THREE.Vector3();
function project(obj, [x, y, z]) { v3.set(x, y, z); obj.localToWorld(v3); v3.project(camera); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H]; }
function toWorld(px, py, z = 0) {
  const v = new THREE.Vector3(px / W * 2 - 1, 1 - py / H * 2, 0.5).unproject(camera).sub(camera.position).normalize();
  return camera.position.clone().addScaledVector(v, (z - camera.position.z) / v.z);
}
let uiK = 1;
const uiPx = (x, y) => [540 + (x - 540) * uiK, 1040 + (y - 1040) * uiK];
const UI = $('ui'), UI2 = $('ui2');
const uiRoot = svg('g', {});

// callouts (unscaled layer, anchored to projected points)
function makeCallout(label, side) {
  const g = svg('g', {}, UI2);
  return { side, g, path: svg('path', { fill: 'none', stroke: INK, 'stroke-width': 2.5, pathLength: 1, 'stroke-dasharray': 1 }, g),
    ping: svg('circle', { r: 8, fill: 'none', stroke: INK, 'stroke-width': 2 }, g), dot: svg('circle', { r: 7, fill: INK }, g),
    text: Object.assign(svg('text', { class: 'cl-txt', 'text-anchor': side > 0 ? 'start' : 'end' }, g), { textContent: label }) };
}
const P3 = (obj, pt) => () => project(obj, pt);
let netNodesPx = [];
const CALLOUTS = [
  ['REAL CARD NUMBER.', -1, 8.9, 9.62, P3(mainCard ?? scene, [0, 0, 0]), [-40, 250], 'card:front'],
  ['TOKEN.', 1, 11.75, 12.05, null, [120, 230], 'card:token'],
  ['PAYMENT TERMINAL.', 1, 14.9, 15.75, P3(terminal, [0.3, -0.35, 0.07]), [90, 160]],
  ['CARD NETWORK.', -1, 16.15, 16.8, () => uiPx(...netNodesPx[5]), [-120, 150]],
  ['YOUR BANK.', 1, 18.4, 19.05, P3(bank, [0.5, -0.43, 0.26]), [70, 150]],
  ['YOUR BANK.', 1, 25.0, 26.85, P3(bank, [0.3, -0.45, 0.26]), [40, 150]],
  ['APPLE.', 1, 26.1, 26.85, P3(phone, [0.3, -0.62, 0.04]), [40, 150]],
  ['STOLEN.', -1, 40.3, 40.95, null, [-170, -150], 'card:stolen'],
  ['TOP OF WALLET.', -1, 44.05, 45.0, null, [-80, 215], 'pop'],
].map(([label, side, tin, tout, anchor, d, tag]) => ({ c: makeCallout(label, side), tin, tout, anchor, d, tag }));

// contactless ripples (unscaled layer)
const ripG = svg('g', {}, UI2);
const RIPT = [0.67, 1.67, 49.43];
const rips = []; for (let i = 0; i < 6; i++) rips.push(svg('path', { fill: 'none', stroke: AMB, 'stroke-width': 6, 'stroke-linecap': 'round' }, ripG));

// relay track
const trackG = svg('g', {}, uiRoot);
const TX = [-360, -120, 120, 360], TLAB = ['iPHONE', 'TERMINAL', 'NETWORK', 'BANK'];
const trackLine = svg('line', { x1: -430, y1: 0, x2: 430, y2: 0, stroke: 'rgba(20,19,18,.35)', 'stroke-width': 4, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1 }, trackG);
const trackTrail = svg('line', { x1: -360, y1: 0, x2: -360, y2: 0, stroke: AMB, 'stroke-width': 6, 'stroke-linecap': 'round' }, trackG);
const stations = TX.map((x, i) => {
  const g = svg('g', {}, trackG);
  const c = svg('circle', { cx: 0, cy: 0, r: 22, fill: '#f4f0e9', stroke: INK, 'stroke-width': 4 }, g);
  const l = Object.assign(svg('text', { class: 'sm-txt', x: 0, y: 66, 'text-anchor': 'middle' }, g), { textContent: TLAB[i] });
  const ic = svg('g', { transform: 'translate(0 -112)' }, g);
  const st = { fill: 'none', stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1 };
  const paths = [
    ['M-26 -48 h52 a12 12 0 0 1 12 12 v72 a12 12 0 0 1 -12 12 h-52 a12 12 0 0 1 -12 -12 v-72 a12 12 0 0 1 12 -12 Z', 'M-10 -38 h20'],
    ['M-30 -46 h60 a10 10 0 0 1 10 10 v82 a10 10 0 0 1 -10 10 h-60 a10 10 0 0 1 -10 -10 v-82 a10 10 0 0 1 10 -10 Z', 'M-22 -34 h44 v28 h-44 Z', 'M-20 14 h8 M-4 14 h8 M12 14 h8 M-20 30 h8 M-4 30 h8 M12 30 h8'],
    ['M-34 26 L0 -36 L36 18 Z', 'M-34 26 L36 18'],
    ['M-44 -16 L0 -46 L44 -16 Z', 'M-30 -8 v42 M-10 -8 v42 M10 -8 v42 M30 -8 v42', 'M-48 44 h96'],
  ][i].map(d => svg('path', { d, ...st }, ic));
  const nodes = i === 2 ? [[-34, 26], [0, -36], [36, 18]].map(([x, y]) => svg('circle', { cx: x, cy: y, r: 9, fill: INK }, ic)) : [];
  return { g, c, l, ic, paths, nodes, x };
});
const finishG = svg('g', {}, trackG);
for (let r = 0; r < 8; r++) for (let c = 0; c < 2; c++) svg('rect', { x: 440 + c * 13, y: -60 + r * 13, width: 13, height: 13, fill: (r + c) % 2 ? 'rgba(20,19,18,.08)' : INK }, finishG);
const runner = svg('rect', { x: -32, y: -12, width: 64, height: 24, rx: 12, fill: AMB }, trackG);
const runnerGlow = svg('circle', { r: 46, fill: 'rgba(224,131,42,.22)' }, trackG);
trackG.insertBefore(runnerGlow, runner);

// card network graph
const netG = svg('g', {}, uiRoot);
const ROUTE = [[130, 1000], [300, 770], [520, 900], [770, 730], [940, 960], [760, 1290], [540, 1060]];
const NET = [...ROUTE];
{
  const R = rng(5);
  while (NET.length < 22) {
    const p = [110 + R() * 860, 680 + R() * 700];
    if (NET.every(q => Math.hypot(p[0] - q[0], p[1] - q[1]) > 125)) NET.push(p);
  }
}
netNodesPx = NET;
const netEdges = [];
NET.forEach((p, i) => {
  const near = NET.map((q, j) => [j, Math.hypot(p[0] - q[0], p[1] - q[1])]).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]).slice(0, 2);
  near.forEach(([j]) => { if (!netEdges.some(([a, b]) => (a === j && b === i))) netEdges.push([i, j]); });
});
const netLines = netEdges.map(([a, b]) => svg('line', { x1: NET[a][0], y1: NET[a][1], x2: NET[b][0], y2: NET[b][1], stroke: 'rgba(20,19,18,.28)', 'stroke-width': 3, pathLength: 1, 'stroke-dasharray': 1 }, netG));
const routeBase = svg('path', { d: 'M' + ROUTE.map(p => p.join(' ')).join(' L'), fill: 'none', stroke: 'rgba(20,19,18,.5)', 'stroke-width': 4, 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1 }, netG);
const routeTrail = svg('path', { d: 'M' + ROUTE.map(p => p.join(' ')).join(' L'), fill: 'none', stroke: AMB, 'stroke-width': 8, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '0 1' }, netG);
const netDots = NET.map((p, i) => svg('circle', { cx: p[0], cy: p[1], r: i < ROUTE.length ? 13 : 9, fill: i < ROUTE.length ? INK : 'rgba(20,19,18,.55)' }, netG));
const pulseHalo = svg('circle', { r: 40, fill: 'rgba(224,131,42,.25)' }, netG);
const pulse = svg('circle', { r: 16, fill: AMB }, netG);
const routeLen = (() => { let L = [0]; for (let i = 1; i < ROUTE.length; i++) L.push(L[i - 1] + Math.hypot(ROUTE[i][0] - ROUTE[i - 1][0], ROUTE[i][1] - ROUTE[i - 1][1])); return L; })();
function routeAt(u) {
  const d = u * routeLen[routeLen.length - 1];
  let i = 1; while (i < routeLen.length - 1 && routeLen[i] < d) i++;
  const f = (d - routeLen[i - 1]) / (routeLen[i] - routeLen[i - 1]);
  return [lerp(ROUTE[i - 1][0], ROUTE[i][0], f), lerp(ROUTE[i - 1][1], ROUTE[i][1], f)];
}

// bank check: scan line + approval stamp
const scanG = svg('g', {}, uiRoot);
const scanGlow = svg('rect', { x: 170, y: -40, width: 740, height: 80, fill: 'rgba(224,131,42,.16)', rx: 40 }, scanG);
const scanLine = svg('rect', { x: 160, y: -3, width: 760, height: 6, rx: 3, fill: AMB }, scanG);
const stampG = svg('g', {}, uiRoot);
svg('circle', { r: 118, fill: 'rgba(247,244,238,.92)', stroke: AMB, 'stroke-width': 10 }, stampG);
const stampCheck = svg('path', { d: 'M-52 4 L-14 42 L58 -40', fill: 'none', stroke: AMB, 'stroke-width': 18, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1 }, stampG);

// answer arc + approved pill, and the fee arc (bank -> Apple)
const ansPath = svg('path', { fill: 'none', stroke: 'rgba(20,19,18,.45)', 'stroke-width': 3, 'stroke-dasharray': '10 12' }, uiRoot);
const pillG = svg('g', {}, uiRoot);
svg('rect', { x: -112, y: -30, width: 224, height: 60, rx: 30, fill: '#fff', stroke: 'rgba(20,19,18,.08)', 'stroke-width': 2 }, pillG);
Object.assign(svg('text', { class: 'cl-txt', x: 0, y: 9, 'text-anchor': 'middle', fill: AMB, style: 'fill:#e0832a' }, pillG), { textContent: 'APPROVED ✓' });
const feePath = svg('path', { fill: 'none', stroke: AMB, 'stroke-width': 4, 'stroke-dasharray': '10 12', 'stroke-linecap': 'round' }, uiRoot);

// timer ring around the phone ("in about a second")
const ringG = svg('g', {}, uiRoot);
svg('circle', { r: 380, fill: 'none', stroke: 'rgba(20,19,18,.12)', 'stroke-width': 2 }, ringG);
const ringTicks = []; for (let i = 0; i < 60; i++) ringTicks.push(svg('line', { stroke: 'rgba(20,19,18,.35)', 'stroke-width': i % 5 ? 2 : 3, 'stroke-linecap': 'round' }, ringG));
const ringArc = svg('circle', { r: 380, fill: 'none', stroke: AMB, 'stroke-width': 7, 'stroke-linecap': 'round', pathLength: 100 }, ringG);

// stream mini coins
const miniG = svg('g', {}, uiRoot);
const minis = []; for (let i = 0; i < 6; i++) {
  const g = svg('g', {}, miniG); svg('circle', { r: 28, fill: AMB }, g);
  Object.assign(svg('text', { x: 0, y: 12, 'text-anchor': 'middle', style: 'font: italic 500 38px Playfair; fill: #fff' }, g), { textContent: '¢' });
  minis.push(g);
}

// globe pin labels + same pulse (unscaled, projected)
const pinG = svg('g', {}, UI2);
const pinLabels = PINS.map(([code]) => {
  const g = svg('g', {}, pinG);
  const r = svg('rect', { x: -38, y: -21, width: 76, height: 42, rx: 21, fill: INK }, g);
  Object.assign(svg('text', { class: 'pin-txt', x: 1, y: 8, 'text-anchor': 'middle' }, g), { textContent: code });
  const stem = svg('line', { x1: 0, y1: 21, x2: 0, y2: 46, stroke: INK, 'stroke-width': 3 }, g);
  return { g, r, stem };
});
const samePulse = svg('circle', { r: 360, fill: 'none', stroke: AMB, 'stroke-width': 6 }, UI2);

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
// ACTOR STATES (pure functions of t)
// =====================================================================================
const bob = t => Math.sin(t * 1.9) * 0.018;
const sIn = (t, a, d = 0.45, v = 1) => v * E.outBack(clamp((t - a) / d));
const sOut = (t, a, d = 0.3) => 1 - E.inCubic(clamp((t - a) / d));

function phoneState(t) {
  const f = bob(t);
  if (t < 7.05) return {
    s: 0.8,
    x: kf(t, [[0, 1.6], [0.72, 0, E.outExpo], [6.62, 0], [7.0, -1.9, E.inCubic]]),
    y: kf(t, [[0, -1.5], [0.72, -0.14, E.outExpo]]) + f,
    rx: 0.08 + 0.32 * Math.sin(Math.PI * clamp((t - 0.6) / 0.45)) + 0.32 * Math.sin(Math.PI * clamp((t - 1.6) / 0.45)),
    ry: kf(t, [[0, -2.9], [0.72, -0.3, E.outExpo], [3.6, 0.22, E.linear], [6.6, -0.28, E.linear]]) + turn(t, 3.69, 4.35),
    rz: kf(t, [[0, 0.5], [0.72, 0.04, E.outExpo]]) + Math.sin(t * 1.3) * 0.015,
  };
  if (t > 20.45 && t < 27.3) return {
    s: Math.min(kf(t, [[20.45, 0], [20.95, 0.5, E.outBack], [22.1, 0.5], [22.6, 0.62, E.outCubic], [24.65, 0.62], [25.1, 0.5, E.outCubic]]), sOut(t, 26.92, 0.3) * 0.62),
    x: kf(t, [[20.45, -0.5], [22.1, -0.5], [22.6, 0, E.outCubic], [24.65, 0], [25.1, 0.45, E.outCubic]]),
    y: kf(t, [[20.45, -0.1], [22.1, -0.1], [22.6, -0.13]]) + f,
    rx: 0.08, ry: 0.25 * Math.sin(t * 0.8) + turn(t, 23.95, 24.75, 2), rz: Math.sin(t * 1.3) * 0.015,
  };
  if (t > 41.8 && t < 45.5) return {
    s: Math.min(sIn(t, 41.88, 0.5, 0.8), 0.8 * sOut(t, 45.13)), x: 0, y: -0.14 + f, z: kf(t, [[43.6, 0], [44.0, -0.25]]),
    rx: 0.06, ry: kf(t, [[41.88, -1.4], [42.4, -0.18, E.outExpo], [45.1, 0.16, E.linear]]), rz: 0.02,
  };
  if (t > 48.3 && t < 52.8) return {
    s: Math.min(sIn(t, 48.38, 0.5, 0.76), 0.76 * sOut(t, 52.33)), x: 0, y: -0.18 + f,
    rx: 0.08 + 0.32 * Math.sin(Math.PI * clamp((t - 49.36) / 0.45)),
    ry: kf(t, [[48.38, 1.6], [48.9, 0.25, E.outExpo], [51.6, -0.25, E.linear]]) + turn(t, 51.67, 52.25), rz: Math.sin(t * 1.3) * 0.015,
  };
  return { s: 0 };
}
function phoneScreen(t) {
  if (t > 41 && t < 46) return ['wallet' + (t > 43.67 ? '2' : ''), 0];
  if (t > 21.55 && t < 30) return ['done', prog(t, 21.6, 22.0, E.outCubic)];
  if (t > 51.08) return ['done', prog(t, 51.1, 51.5, E.outCubic)];
  return ['pay', 0];
}
function cardState(t) {
  const f = bob(t);
  if (t > 6.6 && t < 12.45) {
    const fwd = Math.sin(Math.PI * clamp((t - 7.95) / 0.8));
    return {
      s: Math.min(1, prog(t, 6.65, 7.0, E.outExpo) * 0.4 + 0.6) * sOut(t, 12.14, 0.25),
      x: kf(t, [[6.65, 1.8], [7.2, 0, E.outExpo]]), y: -0.1 + f, z: fwd * 0.35,
      rx: kf(t, [[6.65, 0.4], [7.2, 0.1, E.outExpo]]) + Math.sin(t * 1.1) * 0.03,
      ry: kf(t, [[6.65, -1.3], [7.2, -0.3, E.outExpo], [8.7, 0.15, E.linear], [8.95, -0.05], [11.3, 0.1, E.linear]]) + fwd * 0.3 + Math.PI * prog(t, 11.37, 11.95, E.outExpo),
      rz: kf(t, [[6.65, -0.3], [7.2, 0.03, E.outExpo]]) + shake(t, 7.58, 0.4, 36, 0.09),
    };
  }
  if (t > 38.9 && t < 41.02) {
    const yank = prog(t, 40.02, 40.3, E.outExpo);
    return {
      s: Math.min(sIn(t, 38.97, 0.5), 1), x: yank * 0.32, y: -0.1 + f + yank * 0.04, z: 0,
      rx: 0.1, ry: kf(t, [[38.97, 1.2], [39.4, -0.2, E.outExpo]]) + Math.PI * prog(t, 39.48, 40.0, E.outExpo) + yank * 0.35 + Math.sin(t) * 0.04,
      rz: -0.22 * yank + shake(t, 40.6, 0.35, 40, 0.05),
    };
  }
  return { s: 0 };
}
function batonState(t) {
  const f = bob(t);
  if (t > 12.15 && t < 13.6) {
    const drop = prog(t, 13.3, 13.55, E.inOutCubic);
    const st = toWorld(180, 1180);
    return { s: lerp(sIn(t, 12.18, 0.45), 0.25, drop) * (t > 13.54 ? 0 : 1), x: lerp(0, st.x, drop), y: lerp(0.2 + f, st.y, drop), z: 0,
      rx: 0.25, ry: lerp(turn(t, 12.18, 12.9, 1) + Math.sin(t * 2) * 0.3, 0, drop), rz: Math.sin(t * 1.7) * 0.08 };
  }
  if (t > 15.08 && t < 15.6) {
    const p = prog(t, 15.12, 15.5, E.inCubic);
    return { s: 0.55 * clamp((t - 15.08) / 0.06), x: lerp(0.05, 2.0, p), y: lerp(0.28, 0.32, p), z: 0.15, rx: 0.2, ry: -0.2, rz: 0 };
  }
  return { s: 0 };
}
function terminalState(t) {
  if (t < 14.5 || t > 16.3) return { s: 0 };
  const out = prog(t, 15.8, 16.2, E.inCubic);
  return { s: 0.95, x: -out * 2.2, y: kf(t, [[14.55, -1.9], [15.0, -0.12, E.outBack]]) + bob(t), z: 0,
    rx: -0.12 + shake(t, 15.12, 0.4, 30, 0.04), ry: kf(t, [[14.55, 0.6], [15.0, 0.22, E.outExpo], [15.8, -0.15, E.linear]]) - out * 0.5, rz: 0 };
}
function bankState(t) {
  const f = bob(t);
  if (t > 17.9 && t < 22.45) return {
    s: Math.min(sIn(t, 17.98, 0.5, 0.9), kf(t, [[20.5, 0.9], [20.95, 0.5, E.outCubic]])), x: kf(t, [[20.5, 0], [20.95, 0.5, E.outCubic], [22.1, 0.5], [22.4, 2.0, E.inCubic]]),
    y: -0.1 + f, rx: 0.12, ry: kf(t, [[17.98, -0.9], [18.5, -0.25, E.outExpo], [22.1, 0.25, E.linear]]), rz: 0,
  };
  if (t > 24.55 && t < 27.2) return {
    s: 0.5 * Math.min(1, prog(t, 24.6, 25.0, E.outCubic) * 1.5) * sOut(t, 26.9, 0.28), x: kf(t, [[24.6, -2.0], [25.05, -0.42, E.outExpo]]), y: -0.1 + f,
    rx: 0.12, ry: 0.3 + Math.sin(t * 0.8) * 0.1, rz: 0,
  };
  if (t > 37.2 && t < 39.2) return {
    s: Math.min(sIn(t, 37.3, 0.5, 0.85), 0.85 * sOut(t, 38.92, 0.25)), x: 0, y: -0.12 + f, rx: 0.14,
    ry: kf(t, [[37.3, 1.2], [37.8, 0.2, E.outExpo], [38.9, -0.2, E.linear]]), rz: shake(t, 38.1, 0.6, 18, 0.12),
  };
  return { s: 0 };
}
function coinState(t) {
  const f = bob(t);
  if (t > 2.88 && t < 6.5) {
    const p = prog(t, 2.96, 3.35, E.outExpo);
    return { s: Math.min(0.85 * clamp((t - 2.9) / 0.15), 0.85 * sOut(t, 6.15, 0.3)), x: lerp(0.05, 0.56, p), y: lerp(0.2, 0.28, p) + f, z: 0.15,
      rx: 0.15 + TAU * 2 * p, ry: -0.35 + Math.sin(t * 1.4) * 0.25, rz: shake(t, 3.97, 0.5, 30, 0.25) + shake(t, 5.3, 0.5, 30, 0.25) };
  }
  if (t > 25.5 && t < 31.75) {
    const fly = prog(t, 25.65, 26.05, E.inOutCubic);
    if (t < 26.9) {
      const A = uiPx(267, 1040), C = uiPx(550, 700), Bp = uiPx(833, 1010);
      const p = toWorld(qb(A[0], C[0], Bp[0], fly), qb(A[1], C[1], Bp[1], fly), 0.2);
      return { s: 0.55 * clamp((t - 25.55) / 0.12) * (1 - 0.35 * prog(t, 26.05, 26.3)), x: p.x, y: p.y + (t > 26.05 ? f : 0), z: 0.2, rx: TAU * 2 * fly, ry: 0.3, rz: 0 };
    }
    const c = prog(t, 26.92, 27.45, E.outExpo), q = toWorld(833, 1010, 0.2);
    return { s: lerp(0.36, 1.55, c) * sOut(t, 31.45, 0.25), x: lerp(q.x, 0, c), y: lerp(q.y, -0.12, c) + f, z: lerp(0.2, 0, c),
      rx: 0.12 + TAU * prog(t, 28.08, 28.6, E.outExpo) + TAU * prog(t, 31.12, 31.45, E.outExpo), ry: (t - 26.9) * 0.9, rz: 0 };
  }
  if (t > 54.1) {
    const st0 = uiPx(900, 905), st1 = uiPx(180, 905), top = uiPx(540, 720);
    const fly = prog(t, 54.64, 54.99, E.inOutCubic);
    const p = toWorld(qb(st0[0], top[0], st1[0], fly), qb(st0[1], top[1], st1[1], fly), 0.1);
    return { s: 0.42 * E.outBack(clamp((t - 54.16) / 0.35)), x: p.x, y: p.y + (t > 55 ? f : 0), z: 0.1, rx: TAU * 2 * fly + 0.1, ry: Math.sin(t * 1.3) * 0.4, rz: 0 };
  }
  return { s: 0 };
}
function streamState(i, t) {
  if (t < 31.4 || t > 32.95) return { s: 0 };
  const x = 1.9 - (t - 31.5 - i * 0.15) * 4.2;
  if (x > 1.9 || x < -1.9) return { s: 0 };
  return { s: 0.7, x, y: -0.12 + Math.sin(i * 1.7) * 0.03, z: 0, rx: 0.1, ry: 0.35 - x * 0.12, rz: Math.sin(x * 1.5) * 0.05 };
}
function popState(t) {
  if (t < 43.62 || t > 45.45) return { s: 0 };
  const p = prog(t, 43.67, 44.15, E.outExpo);
  return { s: lerp(0.56, 1.0, p) * sOut(t, 45.13), x: 0, y: lerp(-0.34, -0.22, p) + bob(t), z: lerp(0.07, 0.75, p),
    rx: lerp(0, 0.18, p), ry: lerp(0, -0.25, p) + Math.sin(t * 1.2) * 0.06 + TAU * prog(t, 43.67, 44.3, E.outExpo) * 0, rz: lerp(0, 0.06, p) };
}
function globeState(t) {
  if (t < 45.1 || t > 48.6) return { s: 0 };
  return { s: Math.min(sIn(t, 45.2, 0.55), sOut(t, 48.32, 0.25)), x: 0, y: -0.12 + bob(t), z: 0, rx: 0.32, ry: 1.0 - (t - 45.6) * 0.34, rz: 0.08 };
}

// =====================================================================================
// RENDER
// =====================================================================================
const SCENES = [0, 6.66, 12.14, 14.55, 17.95, 22.1, 24.7, 26.92, 31.45, 32.63, 37.28, 38.95, 41.88, 45.13, 48.35, 52.33, DUR];
function camZ(t) {
  let i = 0; while (i < SCENES.length - 2 && t >= SCENES[i + 1]) i++;
  const a = SCENES[i], b = SCENES[i + 1];
  return t < a + 0.5 ? lerp(5.42, 5.78, E.outCubic(clamp((t - a) / 0.5))) : lerp(5.78, 5.42, clamp((t - a - 0.5) / (b - a - 0.5)));
}
const shadows = [$('sh0'), $('sh1')];
const box = new THREE.Box3();
function screenBox(obj) {
  box.setFromObject(obj);
  if (box.isEmpty()) return null;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i < 8; i++) {
    v3.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera);
    const x = (v3.x + 1) / 2 * W, y = (1 - v3.y) / 2 * H;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1 };
}
const ACTORS = () => [['phone', phone], ['card', mainCard], ['baton', baton], ['terminal', terminal], ['bank', bank], ['coin', coin], ['globe', globe], ['pop', popCard],
  ...streamCards.map((c, i) => ['stream' + i, c]), ['shards', shards]];
let lastPhoneKey = '';
function drawPhone(mode, p) {
  const k = mode + '|' + Math.round(p * 30); if (k === lastPhoneKey) return; lastPhoneKey = k;
  const g = phoneCtx, w = 512, h = 1110;
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1d1915'); gr.addColorStop(1, '#060606');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const rg = g.createRadialGradient(256, 780, 0, 256, 780, 520); rg.addColorStop(0, 'rgba(224,131,42,.42)'); rg.addColorStop(1, 'rgba(224,131,42,0)');
  g.fillStyle = rg; g.fillRect(0, 0, w, h);
  g.textAlign = 'center';
  if (mode.startsWith('wallet')) {
    g.textAlign = 'left'; g.fillStyle = '#fff'; g.font = '700 56px "Inter Display"'; g.fillText('Wallet', 40, 190);
    const order = [3, 2, 1, 0];
    order.forEach((wi, k) => {
      const y = 250 + k * 118;
      if (wi === 0 && mode === 'wallet2') { g.strokeStyle = 'rgba(224,131,42,.7)'; g.lineWidth = 4; g.setLineDash([14, 12]); rrect(g, 40, y, 432, 272, 24); g.stroke(); g.setLineDash([]); return; }
      g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 24; g.shadowOffsetY = -6;
      drawCardArt(g, 40, y, 432, 272, WALLET[wi][0], { bank: WALLET[wi][1], num: '•••• ' + ['4821', '1186', '6630', '2409'][wi] }); g.restore();
    });
    g.textAlign = 'center'; g.letterSpacing = '0px'; g.fillStyle = 'rgba(255,255,255,.6)'; g.font = '500 28px Inter'; g.fillText('Default card', 256, 980);
  } else {
    drawCardArt(g, 46, 210, 420, 265, 'amber', { bank: 'MERIDIAN BANK', num: '•••• 4821' });
    g.textAlign = 'center'; g.letterSpacing = '0px';
    if (mode === 'pay') {
      g.save(); g.translate(226, 700); contactless(g, 0, 0, 120, '#fff', 12); g.restore();
      g.fillStyle = '#fff'; g.font = '600 40px "Inter Display"'; g.fillText('Hold Near Reader', 256, 900);
    } else {
      g.strokeStyle = AMB; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.arc(256, 700, 100, -Math.PI / 2, -Math.PI / 2 + TAU * p); g.stroke();
      const q = clamp(p * 1.6 - 0.5); g.lineJoin = 'round'; g.beginPath(); g.moveTo(210, 704); g.lineTo(210 + 32 * clamp(q * 2), 704 + 32 * clamp(q * 2));
      if (q > 0.5) g.lineTo(242 + 66 * (q - 0.5) * 2, 736 - 74 * (q - 0.5) * 2); g.stroke();
      g.fillStyle = '#fff'; g.font = '600 48px "Inter Display"'; g.fillText('Done', 256, 900);
    }
  }
  g.fillStyle = '#000'; rrect(g, 196, 28, 120, 36, 18); g.fill();
  phoneTex.needsUpdate = true;
}

function renderAt(t) {
  // ---------------- camera: always moving
  const cz = camZ(t);
  camera.position.set(Math.sin(t * 0.7) * 0.05, Math.cos(t * 0.9) * 0.03, cz);
  camera.lookAt(0, -0.03, 0);
  camera.updateMatrixWorld();
  uiK = 5.6 / cz;
  uiRoot.setAttribute('transform', `translate(540 1040) scale(${uiK.toFixed(4)}) translate(-540 -1040)`);

  // ---------------- actors
  setXf(phone, phoneState(t));
  const [pm, pp] = phoneScreen(t); drawPhone(pm, pp);
  const cs = cardState(t); setXf(mainCard, cs); drawMainFront(cardNum(t));
  setXf(baton, batonState(t));
  setXf(terminal, terminalState(t));
  drawTerminal(t < 14.85 ? 'tap' : t < 15.12 ? 'read' : 'sent', prog(t, 14.85, 15.1, E.linear));
  setXf(bank, bankState(t));
  setXf(coin, coinState(t));
  streamCards.forEach((c, i) => setXf(c, streamState(i, t)));
  setXf(popCard, popState(t));
  const gs = globeState(t); setXf(globe, gs);
  // shards burst from where the stolen card was at 41.0
  const shT = t - 41.0;
  shards.visible = shT > 0 && shT < 0.9;
  if (shards.visible) {
    setXf(shards, { ...cardState(40.999), s: 1 });
    SH.forEach(sd => {
      const e = E.outCubic(clamp(shT / 0.9));
      sd.m.position.set(sd.x0 + sd.vx * e, sd.y0 + sd.vy * e - 0.25 * shT * shT, sd.vz * e * 0.6);
      sd.m.rotation.set(sd.r[0] * e, sd.r[1] * e, sd.r[2] * e);
      sd.m.scale.setScalar(Math.max(0.0001, 1 - E.inCubic(clamp(shT / 0.9))));
    });
  }
  mats.amber.emissiveIntensity = 0.25 + 0.35 * Math.max(prog(t, 12.2, 12.5) * (1 - prog(t, 12.6, 13.2)), 0);

  scene.updateMatrixWorld();
  renderer.render(scene, camera);

  // ---------------- canvas dim (twist)
  const dim = prog(t, 23.95, 24.3) * (1 - prog(t, 24.55, 24.9));
  $('gl').style.filter = dim > 0.002 ? `blur(${(dim * 9).toFixed(1)}px)` : 'none';
  $('gl').style.opacity = (1 - 0.5 * dim).toFixed(3);

  // ---------------- contact shadows (two most present grounded actors)
  const grounded = [['phone', phone], ['card', mainCard], ['terminal', terminal], ['bank', bank], ['coin', coin], ['globe', globe], ['pop', popCard]]
    .filter(([, o]) => o.visible).map(([n, o]) => { const b = screenBox(o); if (b && n === 'globe') b.y1 = project(globe, [0, -GR, 0])[1] + 20; return { n, o, b, s: o.scale.x }; }).filter(a => a.b).sort((a, b) => b.s - a.s).slice(0, 2);
  shadows.forEach((el, i) => {
    const a = grounded[i];
    if (!a) { el.style.opacity = 0; return; }
    const w = (a.b.x1 - a.b.x0) * 0.85, cx = (a.b.x0 + a.b.x1) / 2, y = Math.min(1720, a.b.y1 + (a.n === 'coin' ? 70 : 34));
    el.style.left = cx.toFixed(1) + 'px'; el.style.top = y.toFixed(1) + 'px';
    el.style.transform = `scaleX(${clamp(w / 520, 0.15, 1.6).toFixed(3)})`;
    el.style.opacity = (clamp(a.s * 2.2) * (a.n === 'coin' ? 0.5 : 0.85) * (1 - 0.6 * dim) * (t < 0.5 ? prog(t, 0.2, 0.6) : 1)).toFixed(3);
  });

  // ---------------- glow
  const glow = Math.max(kf(t, [[2.94, 0], [3.2, 0.8], [3.8, 0]]), kf(t, [[19.84, 0], [20.05, 0.8], [20.6, 0]]), kf(t, [[24.0, 0], [24.25, 0.8], [24.9, 0]]),
    kf(t, [[26.03, 0], [26.25, 0.9], [26.9, 0]]), kf(t, [[29.6, 0], [30.2, 0.5], [31.2, 0.85], [31.6, 0]]), kf(t, [[47.45, 0], [47.7, 0.8], [48.3, 0]]),
    kf(t, [[49.62, 0], [49.9, 0.6], [50.5, 0]]), kf(t, [[54.97, 0], [55.15, 0.6], [55.4, 0.3], [55.7, 1]]));
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
    b.spans.forEach((s, i) => applyText(s, textState(t, b.at, b.out, i), drift));
  });

  // ---------------- callouts
  CALLOUTS.forEach(({ c, tin, tout, anchor, d, tag }) => {
    const p = prog(t, tin, tin + 0.38, E.outCubic), q = prog(t, tout, tout + 0.22, E.inCubic);
    const vis = p > 0 && q < 1;
    c.g.style.display = vis ? '' : 'none';
    if (!vis) return;
    let ax, ay;
    if (tag === 'card:front') [ax, ay] = project(mainCard, [-0.18, -0.12, 0.007]);
    else if (tag === 'card:token') [ax, ay] = project(mainCard, [0.2, 0.02, -0.007]);
    else if (tag === 'card:stolen') [ax, ay] = project(mainCard, [0.25, 0.15, -0.007]);
    else if (tag === 'pop') [ax, ay] = project(popCard, [-0.3, -0.2, 0.007]);
    else [ax, ay] = anchor();
    const tw = c.text.textContent.length * 22 + 30, by = ay + d[1];
    let bx = ax + d[0];
    if (c.side > 0) bx = Math.min(bx, W - 64 - tw - 70); else bx = Math.max(bx, 64 + tw + 70);
    const ex = bx + c.side * 70;
    c.path.setAttribute('d', `M${ax.toFixed(1)},${ay.toFixed(1)} L${bx.toFixed(1)},${by.toFixed(1)} L${ex.toFixed(1)},${by.toFixed(1)}`);
    c.path.setAttribute('stroke-dashoffset', (1 - p + q).toFixed(3));
    c.dot.setAttribute('cx', ax); c.dot.setAttribute('cy', ay); c.dot.setAttribute('r', 7 * clamp(p * 3) * (1 - q));
    const pp2 = prog(t, tin, tin + 0.6, E.outCubic);
    c.ping.setAttribute('cx', ax); c.ping.setAttribute('cy', ay); c.ping.setAttribute('r', 8 + pp2 * 26); c.ping.setAttribute('opacity', (1 - pp2) * (1 - q));
    c.text.setAttribute('x', ex + c.side * (14 + (1 - p) * 24)); c.text.setAttribute('y', by + 9);
    c.text.setAttribute('opacity', clamp((p - 0.4) / 0.6) * (1 - q));
  });

  // ---------------- contactless ripples off both sides of the phone
  let rv = false;
  rips.forEach((r, i) => {
    const T = RIPT.find(a => t >= a && t < a + 0.9);
    if (T === undefined || !phone.visible) { r.style.display = 'none'; return; }
    rv = true; r.style.display = '';
    const side = i < 3 ? 1 : -1, k = i % 3, u = clamp((t - T - k * 0.1) / 0.7);
    const [px, py] = project(phone, [side * 0.42, 0.25, 0]);
    const rad = 30 + E.outCubic(u) * 170, a = 0.7;
    const x0 = px + side * (rad * Math.cos(a) - rad * 0.9), y0 = py - rad * Math.sin(a);
    r.setAttribute('d', `M${(px - side * rad * 0.9 + side * rad * Math.cos(a)).toFixed(1)},${(py - rad * Math.sin(a)).toFixed(1)} A${rad.toFixed(1)} ${rad.toFixed(1)} 0 0 ${side > 0 ? 1 : 0} ${(px - side * rad * 0.9 + side * rad * Math.cos(a)).toFixed(1)},${(py + rad * Math.sin(a)).toFixed(1)}`);
    r.setAttribute('opacity', (u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0).toFixed(3));
    void x0;
  });
  ripG.style.display = rv ? '' : 'none';

  // ---------------- relay track
  const trA = prog(t, 13.12, 13.45, E.outCubic) * (1 - prog(t, 21.95, 22.2)), trW = prog(t, 52.38, 52.75, E.outCubic);
  const trO = Math.max(trA, trW);
  trackG.style.display = trO > 0.002 ? '' : 'none';
  if (trO > 0.002) {
    const mini = t < 30 ? prog(t, 14.25, 14.6, E.inOutCubic) : 0;
    const ty = t < 30 ? lerp(1180, 1690, mini) : 1150, ts = t < 30 ? lerp(1, 0.72, mini) : 1;
    trackG.setAttribute('transform', `translate(540 ${ty.toFixed(1)}) scale(${ts.toFixed(4)})`);
    trackG.style.opacity = trO.toFixed(3);
    const t0 = t < 30 ? 13.15 : 52.4;
    trackLine.setAttribute('stroke-dashoffset', (1 - prog(t, t0, t0 + 0.4, E.outCubic)).toFixed(3));
    stations.forEach((s, i) => {
      const a = E.outBack(clamp((t - t0 - 0.05 - i * 0.07) / 0.35));
      s.g.setAttribute('transform', `translate(${s.x} 0)`);
      s.c.setAttribute('r', (22 * a).toFixed(2));
      s.l.setAttribute('opacity', clamp((t - t0 - 0.15 - i * 0.07) / 0.3).toFixed(3));
      const icO = clamp((t - t0 - 0.1 - i * 0.07) / 0.25) * (1 - mini);
      s.ic.style.display = icO > 0.01 ? '' : 'none';
      s.ic.setAttribute('opacity', icO.toFixed(3));
      s.paths.forEach((p, j) => p.setAttribute('stroke-dashoffset', (1 - prog(t, t0 + 0.1 + i * 0.07 + j * 0.06, t0 + 0.45 + i * 0.07 + j * 0.06, E.outCubic)).toFixed(3)));
      s.nodes.forEach(n => n.setAttribute('r', (9 * E.outBack(clamp((t - t0 - 0.3) / 0.3))).toFixed(2)));
    });
    const idx = t < 30
      ? kf(t, [[13.5, 0], [14.7, 0], [15.0, 1], [15.85, 1], [16.15, 2], [18.0, 2], [18.3, 3], [21.05, 3], [21.6, 0]])
      : kf(t, [[53.0, 0], [53.2, 1], [53.24, 1], [53.44, 2], [53.47, 2], [53.67, 3], [55.44, 3], [55.8, 4.15, E.outCubic]]);
    const rx = idx <= 3 ? lerp(TX[Math.floor(Math.min(idx, 2.999))], TX[Math.floor(Math.min(idx, 2.999)) + 1], idx - Math.floor(Math.min(idx, 2.999))) : lerp(360, 480, idx - 3);
    const rO = t < 30 ? clamp((t - 13.5) / 0.08) : clamp((t - 52.8) / 0.2);
    const runY = -Math.abs(Math.sin(Math.PI * (idx % 1))) * 18;
    runner.setAttribute('x', (rx - 32).toFixed(1)); runner.setAttribute('y', (-12 + runY).toFixed(1)); runner.setAttribute('opacity', rO);
    runnerGlow.setAttribute('cx', rx.toFixed(1)); runnerGlow.setAttribute('cy', runY.toFixed(1)); runnerGlow.setAttribute('opacity', rO * (0.6 + 0.4 * Math.sin(t * 6)));
    const back = t > 21.0 && t < 30;
    trackTrail.setAttribute('x1', back ? 360 : -360); trackTrail.setAttribute('x2', rx.toFixed(1)); trackTrail.setAttribute('opacity', rO);
    finishG.style.display = t > 55.4 ? '' : 'none';
    finishG.setAttribute('transform', `translate(446 0) scale(1 ${E.outBack(clamp((t - 55.44) / 0.35)).toFixed(3)}) translate(-446 0)`);
  }

  // ---------------- card network
  const nO = prog(t, 15.82, 16.1) * (1 - prog(t, 17.98, 18.3));
  netG.style.display = nO > 0.002 ? '' : 'none';
  if (nO > 0.002) {
    netG.style.opacity = nO.toFixed(3);
    netLines.forEach((l, i) => l.setAttribute('stroke-dashoffset', (1 - prog(t, 15.88 + (i % 9) * 0.04, 16.25 + (i % 9) * 0.04, E.outCubic)).toFixed(3)));
    routeBase.setAttribute('stroke-dashoffset', (1 - prog(t, 15.9, 16.5, E.outCubic)).toFixed(3));
    netDots.forEach((d, i) => d.setAttribute('transform', `translate(${NET[i][0]} ${NET[i][1]}) scale(${E.outBack(clamp((t - 15.86 - (i % 11) * 0.035) / 0.3)).toFixed(3)}) translate(${-NET[i][0]} ${-NET[i][1]})`));
    const u = prog(t, 16.95, 17.98, E.inOutCubic);
    routeTrail.setAttribute('stroke-dasharray', `${u.toFixed(4)} 1`);
    const [px, py] = routeAt(u), pv = t > 16.88 ? 1 : 0;
    pulse.setAttribute('cx', px); pulse.setAttribute('cy', py); pulse.setAttribute('opacity', pv);
    pulseHalo.setAttribute('cx', px); pulseHalo.setAttribute('cy', py); pulseHalo.setAttribute('r', 34 + 8 * Math.sin(t * 9)); pulseHalo.setAttribute('opacity', pv);
  }

  // ---------------- bank scan + stamp
  const sc = prog(t, 19.1, 19.2) * (1 - prog(t, 19.72, 19.85));
  scanG.style.display = sc > 0.002 ? '' : 'none';
  if (sc > 0.002) { scanG.setAttribute('transform', `translate(0 ${lerp(740, 1330, prog(t, 19.13, 19.8, E.inOutCubic)).toFixed(1)})`); scanG.style.opacity = sc; }
  const stA = E.outBack(clamp((t - 19.85) / 0.35)), stO = 1 - prog(t, 20.45, 20.75);
  stampG.style.display = stA > 0.002 && stO > 0.002 ? '' : 'none';
  if (stA > 0.002 && stO > 0.002) {
    stampG.setAttribute('transform', `translate(540 1010) scale(${(stA * lerp(1.25, 1, clamp((t - 19.85) / 0.35))).toFixed(3)}) rotate(${(-12 + 12 * clamp((t - 19.85) / 0.35)).toFixed(2)})`);
    stampG.style.opacity = stO; stampCheck.setAttribute('stroke-dashoffset', (1 - prog(t, 19.95, 20.2, E.outCubic)).toFixed(3));
  }
  // answer arc (bank -> phone)
  const aO = prog(t, 20.95, 21.15) * (1 - prog(t, 21.85, 22.1));
  ansPath.style.display = pillG.style.display = aO > 0.002 ? '' : 'none';
  if (aO > 0.002) {
    ansPath.setAttribute('d', 'M865 1000 Q540 700 215 1000'); ansPath.style.opacity = aO;
    const u = prog(t, 21.05, 21.6, E.inOutCubic);
    pillG.setAttribute('transform', `translate(${qb(865, 540, 215, u).toFixed(1)} ${qb(980, 700, 980, u).toFixed(1)}) scale(${(E.outBack(clamp((t - 21.0) / 0.3)) * (1 - 0.3 * prog(t, 21.6, 21.8))).toFixed(3)})`);
    pillG.style.opacity = aO;
  }
  // fee arc (bank -> Apple)
  const fO = prog(t, 25.55, 25.75) * (1 - prog(t, 26.6, 26.9));
  feePath.style.display = fO > 0.002 ? '' : 'none';
  if (fO > 0.002) {
    feePath.setAttribute('d', 'M267 1040 Q550 700 833 1010');
    feePath.setAttribute('stroke-dasharray', `10 12`); feePath.style.opacity = fO;
    feePath.setAttribute('stroke-dashoffset', (-(t - 25.55) * 160).toFixed(1));
  }

  // ---------------- timer ring
  const rin = prog(t, 22.2, 22.5, E.outCubic) * (1 - prog(t, 23.55, 23.9));
  ringG.style.display = rin > 0.002 ? '' : 'none';
  if (rin > 0.002) {
    ringG.setAttribute('transform', `translate(540 1030) rotate(${(-90 + (1 - rin) * -40).toFixed(2)}) scale(${lerp(0.9, 1, rin).toFixed(4)})`);
    ringG.style.opacity = clamp(rin * 2);
    ringArc.setAttribute('stroke-dasharray', `${(100 * prog(t, 22.3, 22.97, E.inOutCubic)).toFixed(2)} 100`);
    ringTicks.forEach((l, i) => {
      const a = (i / 60) * TAU, on = clamp(rin * 60 - i), r1 = 400, r2 = 400 + (i % 5 ? 10 : 20) * on;
      l.setAttribute('x1', Math.cos(a) * r1); l.setAttribute('y1', Math.sin(a) * r1); l.setAttribute('x2', Math.cos(a) * r2); l.setAttribute('y2', Math.sin(a) * r2);
      l.setAttribute('opacity', on);
    });
  }

  // ---------------- stream mini coins
  let mv = false;
  minis.forEach((g, i) => {
    const u = (t - (31.93 + i * 0.15)) / 0.6;
    if (u < 0 || u > 1) { g.style.display = 'none'; return; }
    mv = true; g.style.display = '';
    g.setAttribute('transform', `translate(${(540 - u * 60).toFixed(1)} ${(880 - E.outCubic(u) * 200).toFixed(1)}) scale(${E.outBack(clamp(u * 3)).toFixed(3)})`);
    g.setAttribute('opacity', (1 - E.inCubic(clamp((u - 0.5) * 2))).toFixed(3));
  });
  miniG.style.display = mv ? '' : 'none';

  // ---------------- receipt
  const ro = prog(t, 32.66, 33.05, E.outExpo) * (1 - prog(t, 37.28, 37.55, E.inCubic));
  const rc = $('receipt');
  rc.style.visibility = ro > 0.003 ? 'visible' : 'hidden';
  if (ro > 0.003) {
    rc.style.opacity = clamp(ro * 1.4).toFixed(3);
    const ex = prog(t, 37.28, 37.55, E.inCubic);
    rc.style.transform = `translate(${(Math.sin(t * 0.8) * 6).toFixed(1)}px, ${((1 - prog(t, 32.66, 33.05, E.outExpo)) * 120 + ex * 80 + Math.sin(t * 1.9) * 8).toFixed(1)}px) scale(${(lerp(0.9, 1, ro) * uiK).toFixed(4)}) rotate(${(lerp(4, -1.5, prog(t, 32.66, 33.3)) + Math.sin(t * 0.7) * 0.6).toFixed(2)}deg)`;
    rc.style.filter = ro < 0.98 ? `blur(${((1 - ro) * 14).toFixed(1)}px)` : 'none';
    const row = (id, a) => {
      const p = E.outExpo(clamp((t - a) / 0.5)), el = $(id);
      el.style.opacity = clamp(p * 1.5).toFixed(3); el.style.transform = `translateY(${((1 - p) * 30).toFixed(1)}px)`;
      el.style.filter = p < 0.95 ? `blur(${((1 - p) * 10).toFixed(1)}px)` : 'none';
    };
    row('r1', 33.27); row('r2', 34.12); row('r3', 35.3); row('r4', 36.12);
    $('rrule').style.opacity = prog(t, 35.0, 35.3).toFixed(3);
    const bp = E.outExpo(clamp((t - 35.6) / 0.6));
    $('rbar').style.opacity = clamp(bp * 2).toFixed(3);
    $('rfill').style.width = (bp * 93) + '%';
    const cut = prog(t, 36.3, 36.65, E.inOutCubic);
    const cutEl = $('rcut');
    cutEl.style.left = 'calc(' + (bp * 93) + '% - 2px)';
    cutEl.style.opacity = (clamp((t - 35.9) / 0.2) * (1 - prog(t, 36.6, 36.7))).toFixed(3);
    cutEl.style.transform = `translate(${(-cut * 60).toFixed(1)}px, ${(-cut * 370).toFixed(1)}px) scale(${lerp(1, 0.6, cut).toFixed(3)})`;
    $('r1v').style.transform = `scale(${(1 + 0.18 * Math.sin(Math.PI * prog(t, 36.6, 36.95))).toFixed(3)})`;
  }

  // ---------------- globe pins
  const gv = globe.visible;
  pinG.style.display = gv ? '' : 'none';
  pinMeshes.forEach((m, i) => {
    const pop = E.outBack(clamp((t - 45.55 - i * 0.17) / 0.35)), same = Math.sin(Math.PI * prog(t, 47.47, 48.0));
    m.scale.setScalar(Math.max(0.0001, pop * (1 + same * 0.8)));
    if (!gv) return;
    const wp = new THREE.Vector3(); m.getWorldPosition(wp);
    const n = wp.clone().sub(new THREE.Vector3().setFromMatrixPosition(globe.matrixWorld)).normalize();
    const facing = n.dot(camera.position.clone().sub(wp).normalize());
    const L = pinLabels[i];
    const o = pop * clamp((facing - 0.15) / 0.2) * gs.s;
    L.g.style.display = o > 0.01 ? '' : 'none';
    if (o <= 0.01) return;
    v3.copy(wp).project(camera);
    const x = (v3.x + 1) / 2 * W, y = (1 - v3.y) / 2 * H;
    L.g.setAttribute('transform', `translate(${x.toFixed(1)} ${(y - 62).toFixed(1)}) scale(${pop.toFixed(3)})`);
    L.g.setAttribute('opacity', o.toFixed(3));
    L.r.setAttribute('fill', mix(INK, AMB, prog(t, 47.42, 47.6)));
    L.stem.setAttribute('stroke', mix(INK, AMB, prog(t, 47.42, 47.6)));
  });
  const sp = prog(t, 47.47, 48.2, E.outCubic);
  samePulse.style.display = sp > 0 && sp < 1 && gv ? '' : 'none';
  if (gv) { const [gx, gy] = project(globe, [0, 0, 0]); samePulse.setAttribute('cx', gx); samePulse.setAttribute('cy', gy); }
  samePulse.setAttribute('r', (330 + sp * 110).toFixed(1)); samePulse.setAttribute('opacity', (1 - sp).toFixed(3));

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
      d.textContent = r.words ? (r.words[m] ?? '') : (m < 0 ? '' : r.fmt(m));
      d.style.transform = `translateY(${((r.up ? m - v : v - m) * 150).toFixed(1)}px)`;
      d.style.filter = speed > 1 ? `blur(${Math.min(r.maxBlur ?? 8, speed * (r.words ? 2 : 0.12)).toFixed(1)}px)` : 'none';
      d.style.color = (m === r.amb && Math.abs(v - r.amb) < 0.5) ? AMB : INK;
    });
  });

  // ---------------- grain
  const RG = rng(Math.floor(t * 60) + 11);
  $('grain').style.backgroundPosition = `${Math.floor(RG() * 256)}px ${Math.floor(RG() * 256)}px`;
}

// =====================================================================================
// LAYOUT CHECK: text vs objects, objects vs readouts (used before the full render)
// =====================================================================================
window.checkAt = t => {
  renderAt(t);
  let tb = 0;
  [...kick, ...bigs].forEach(x => { if (x.el.style.display === 'none') return; x.spans.forEach(s => { if (s.style.visibility === 'hidden' || +s.style.opacity < 0.05) return; const r = s.getBoundingClientRect(); if (r.height) tb = Math.max(tb, r.bottom - (r.height * 0.18)); }); });
  const hits = [];
  let ro = false; rolls.forEach(r => { if (+r.el.style.opacity > 0.05) ro = true; });
  const objs = [];
  ACTORS().forEach(([n, o]) => {
    if (!o.visible) return;
    if (n === 'globe') { // exact: sample the dot sphere and the orbit ring instead of a loose AABB
      let y0 = 1e9, x0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (let i = 0; i < 400; i++) { const a = i / 400 * TAU;
        [[Math.cos(a) * GR, Math.sin(a) * GR, 0], [Math.cos(a) * GR * 1.16, 0, Math.sin(a) * GR * 1.16]].forEach(pt => { const [x, y] = project(globe, pt); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }); }
      for (let i = 0; i < 400; i++) { const u = i / 400 * TAU; const [x, y] = project(globe, [0, Math.cos(u) * GR, Math.sin(u) * GR]); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      objs.push([n, { x0, y0, x1, y1 }]); return;
    }
    const b = screenBox(o); if (b) objs.push([n, b]);
  });
  [['track', trackG], ['net', netG], ['stamp', stampG], ['ring', ringG], ['pill', pillG], ['ans', ansPath], ['fee', feePath], ['minis', miniG], ['pins', pinG], ['rips', ripG], ['receipt', $('receipt')],
   ...CALLOUTS.map((c, i) => ['callout' + i, c.c.text])].forEach(([n, el]) => {
    if (el.style.display === 'none' || el.style.visibility === 'hidden' || +(el.getAttribute?.('opacity') ?? 1) < 0.05 || +(el.style.opacity || 1) < 0.05) return;
    const r = el.getBoundingClientRect(); if (r.width < 1) return; objs.push([n, { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom }]);
  });
  objs.forEach(([n, b]) => {
    if (tb > 0 && b.y0 < tb + 24) hits.push(`${n} top ${b.y0.toFixed(0)} < text ${tb.toFixed(0)}`);
    if (ro && n !== 'track' && b.y1 > 1530) hits.push(`${n} bottom ${b.y1.toFixed(0)} into readout`);
    if (b.x0 < -10 && b.x1 > 0 && !n.startsWith('stream') && n !== 'phone' && n !== 'card' && n !== 'terminal' && n !== 'bank' && n !== 'baton') hits.push(`${n} off-left ${b.x0.toFixed(0)}`);
  });
  return hits;
};

window.READY = (async () => {
  await document.fonts.load('italic 500 100px Playfair');
  await document.fonts.load('600 100px "Inter Display"');
  await document.fonts.load('700 30px Inter');
  buildPhoneScreen(); buildCards(); buildTerminal(); buildCoin();
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
