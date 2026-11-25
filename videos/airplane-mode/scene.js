// "Why airplane mode exists": full film in the battery-ageing system.
// Every visual is a pure function of t (seconds), keyed to the voiceover's word times.
// Layout is designed in screen pixels: 3D objects are placed with pxToWorld so that
// nothing ever enters the text zone (y < 640) or the readout zone (y > 1500).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const { clamp, lerp, E, prog, rng, mix, kf } = window.Anim;
const $ = id => document.getElementById(id);
const W = 1080, H = 1920, SVGNS = 'http://www.w3.org/2000/svg', TAU = Math.PI * 2;
const DUR = 58.5;
const AMB = '#e0832a', INK = '#141312';

// =====================================================================================
// TYPE PLAN (word times measured from the voiceover)
// =====================================================================================
const CARDS = [];
const C = (kick, text, at, out, o = {}) => CARDS.push({ kick, text, at, out, ...o });
C([['Airlines', 0.06], ["aren't", 0.38]], 'scared', 0.49, 1.12);
C([['your', 1.14], ['phone', 1.22], ['will', 1.77]], 'crash', 1.93, 2.24, { strike: 2.04 });
C([['the', 2.2]], 'plane.', 2.34, 2.95);
C([["They're", 3.01], ['worried', 3.16], ['about', 3.44]], 'something', 3.62, 4.15);
C([['much', 4.15]], 'smaller.', 4.26, 5.3, { amber: true });
C([['On', 5.36], ['the', 5.61]], 'ground,', 5.91, 6.3);
C([['your', 6.3], ['phone', 6.36], ['talks', 6.58], ['to', 6.86]], 'one tower.', 7.23, 8.1);
C([['As', 8.15], ['you', 8.55], ['move,', 8.81], ['it', 9.02]], 'hands off', 9.21, 9.7);
C([['to', 9.72], ['the', 9.85]], 'next.', 10.06, 10.4);
C([['Now', 10.42], ['try', 10.9], ['that', 11.0], ['at', 11.4]], '900 km/h', 11.65, 13.32, { amber: true });
C([['ten', 13.46], ['kilometres', 13.55]], 'up.', 14.23, 15.0);
C([['Up', 15.07], ['there,', 15.32], ['your', 15.76], ['phone', 15.96], ['can', 16.17], ['hear', 16.4]], 'many towers', 16.66, 17.65);
C([['at', 17.69], ['once,', 17.75], ['but', 17.96]], "can't hold on.", 18.21, 19.6, { accFrom: 6 });
C([['So', 19.72], ['it', 20.48], ['does', 20.65], ['what', 20.78], ['phones', 20.88], ['do', 21.29]], 'weak signal:', 21.89, 22.72);
C([['it', 22.8], ['turns', 22.98], ['up', 23.11], ['the', 23.42]], 'power', 23.64, 24.2, { amber: true });
C([['and', 24.22], ['keeps', 24.55]], 'shouting.', 24.71, 25.6, { amber: true, shake: true });
C([['That', 25.66], ['noise', 25.85], ['can', 26.07], ['leak', 26.43], ['into', 26.58]], 'cockpit headsets', 26.94, 27.7);
C([['as', 27.72], ['a', 27.88]], 'buzz', 28.14, 28.75, { amber: true, buzz: true });
C([['pilots', 28.78], ['can', 28.79], ['actually', 29.15]], 'hear.', 29.69, 30.15);
C([['Multiply', 30.17], ['it', 31.02], ['by', 31.16]], 'hundreds', 31.47, 31.85);
C([['of', 31.87]], 'passengers,', 31.94, 32.42);
C([['and', 32.47], ['ground', 32.74], ['networks', 32.98], ['get', 33.38]], 'flooded.', 33.57, 34.82, { amber: true });
C([["Here's", 34.89], ['the', 35.18]], 'twist:', 35.46, 36.0, { amber: true });
C([['some', 36.02], ['planes', 36.33], ['now', 36.65], ['carry', 36.97], ['a', 37.2]], 'tiny cell tower', 37.3, 38.55, { accFrom: 5 });
C([['on', 38.6]], 'board.', 38.91, 39.5);
C([["It's", 39.53], ['so', 39.73]], 'close,', 40.06, 40.6);
C([['your', 40.6], ['phone', 40.65], ['can', 40.97]], 'whisper', 41.37, 41.85, { amber: true });
C([['instead', 41.85], ['of', 42.17]], 'shout.', 42.46, 43.1, { strike: 42.72 });
C([['The', 43.14], ['problem', 43.26], ['was', 43.5], ['never', 43.63], ['the', 43.96]], 'phone.', 44.19, 44.85);
C([["It's", 44.89], ['the', 45.03]], 'distance.', 45.33, 46.18, { huge: true, amber: true });
C([['Airplane', 46.22], ['mode', 46.69], ['shuts', 46.9], ['the', 47.14]], 'cellular radio', 47.38, 48.42);
C([], 'off.', 48.56, 49.0, { amber: true });
C([['Wi-Fi', 49.02], ['and', 49.58], ['Bluetooth', 49.72], ['can', 49.92], ['come', 50.2]], 'back on.', 50.35, 50.95);
C([['So', 50.99], ["it's", 51.58], ['not', 51.68], ['about', 51.81], ['your', 52.05], ['phone', 52.21]], 'falling', 52.62, 53.0);
C([['out', 53.03], ['of', 53.34], ['the', 53.49]], 'sky.', 53.72, 54.25);
C([["It's", 54.27], ['about', 54.33]], 'stopping', 54.98, 55.55);
C([['it', 55.58], ['from', 55.64]], 'screaming', 55.81, 56.45, { amber: true });
C([['for', 56.47], ['towers', 56.5]], "it can't reach.", 56.95, 99, { accFrom: 3 });

// =====================================================================================
// ROLLING READOUTS
// =====================================================================================
const ROLLS = [
  { label: 'SPEED', show: [11.45, 13.4], v: t => kf(t, [[11.65, 0], [12.5, 900, E.outCubic]]), fmt: n => n + ' KM/H', amberAbove: 850 },
  { label: 'ALTITUDE', show: [13.42, 15.05], v: t => kf(t, [[13.5, 0], [14.35, 10, E.outCubic]]), fmt: n => n + ' KM', amberAbove: 9.5 },
  { label: 'TOWERS IN RANGE', show: [16.55, 19.65], v: t => kf(t, [[16.66, 1], [17.5, 24, E.outCubic]]), fmt: n => String(n), amberAbove: 20 },
  { label: 'TRANSMIT POWER', show: [22.75, 25.6], v: t => kf(t, [[23.0, 0], [23.7, 1], [24.2, 2], [24.71, 3, E.outExpo]]), words: ['LOW', 'MEDIUM', 'HIGH', 'MAX'], amberWord: 3 },
  { label: 'PHONES ON BOARD', show: [31.3, 32.45], v: t => kf(t, [[31.47, 1], [32.2, 300, E.outCubic]]), fmt: n => String(n), amberAbove: 250 },
  { label: 'NETWORK LOAD', show: [32.6, 34.85], v: t => kf(t, [[32.75, 12], [33.6, 100, E.outCubic]]), fmt: n => n + '%', amberAbove: 85 },
  { label: 'TRANSMIT POWER', show: [40.55, 43.05], v: t => kf(t, [[40.7, 3], [41.4, 0, E.outCubic]]), words: ['LOW', 'MEDIUM', 'HIGH', 'MAX'], amberWord: 3, up: true },
  { label: 'DISTANCE TO TOWER', show: [44.85, 46.15], v: t => kf(t, [[45.0, 0], [45.6, 10, E.outCubic]]), fmt: n => n + ' KM', amberAbove: 9.5 },
];

// =====================================================================================
// SFX PLAN
// =====================================================================================
const SFX = [];
const sfx = (at, name, vol) => SFX.push({ at: +Math.max(0, at).toFixed(3), name, vol });
CARDS.forEach((c, i) => sfx(c.at - 0.02, i % 2 ? 'click' : 'pop', 0.28));
[[0.0, 'whoosh-fast', 0.45], [1.18, 'whoosh-soft', 0.3], [1.93, 'impact-soft', 0.45], [2.32, 'whoosh-fast', 0.42], [3.0, 'whoosh-low', 0.4],
 [4.24, 'whoosh-fast', 0.4], [4.3, 'impact-soft', 0.35], [5.34, 'whoosh-low', 0.45], [7.23, 'tick', 0.35], [9.2, 'whoosh-soft', 0.35], [10.05, 'whoosh-soft', 0.35],
 [10.4, 'whoosh-low', 0.5], [11.6, 'whoosh-fast', 0.45], [13.44, 'whoosh-low', 0.45], [15.05, 'whoosh-low', 0.45], [18.2, 'impact-soft', 0.4],
 [19.7, 'whoosh-low', 0.42], [21.88, 'tick', 0.4], [23.62, 'whoosh-soft', 0.35], [24.7, 'impact', 0.5], [25.64, 'whoosh-low', 0.45], [26.4, 'whoosh-soft', 0.3],
 [26.92, 'whoosh-soft', 0.3], [29.68, 'pop', 0.25], [30.15, 'whoosh-low', 0.45], [32.45, 'whoosh-soft', 0.35], [33.55, 'impact-soft', 0.45],
 [34.87, 'whoosh-fast', 0.42], [35.44, 'whoosh-fast', 0.45], [37.28, 'pop', 0.3], [38.9, 'impact-soft', 0.4], [39.5, 'whoosh-low', 0.42],
 [41.36, 'whoosh-soft', 0.22], [42.45, 'impact-soft', 0.42], [43.12, 'whoosh-low', 0.42], [44.17, 'whoosh-fast', 0.4], [45.32, 'impact', 0.45],
 [46.2, 'whoosh-low', 0.45], [46.69, 'click', 0.4], [48.48, 'impact-soft', 0.45], [49.02, 'click', 0.38], [49.72, 'click', 0.38],
 [50.97, 'whoosh-soft', 0.35], [52.6, 'whoosh-fast', 0.45], [53.7, 'whoosh-low', 0.45], [55.8, 'whoosh-fast', 0.42], [56.2, 'impact-soft', 0.42],
 [57.18, 'impact', 0.5]].forEach(a => sfx(...a));
// "dit-dit-dit" buzz on the headset
[28.14, 28.22, 28.3, 28.52, 28.6, 28.68, 29.0, 29.08, 29.16].forEach(at => sfx(at, 'tick', 0.3));
// tower pops in the many-towers field
for (let i = 0; i < 8; i++) sfx(16.66 + i * 0.1, 'tick', 0.18);
// ticks on rolling numbers (thinned)
ROLLS.forEach(r => { let last = null, lt = -1; for (let t = r.show[0]; t <= r.show[1]; t += 1 / 240) { const n = Math.round(r.v(t)); if (last !== null && n !== last && t - lt > 0.07) { sfx(t, 'tick', 0.2); lt = t; } last = n; } });

window.VIDEO = { width: W, height: H, fps: 60, duration: DUR, bitrate: '25M', maxrate: '25M', audio: 'voiceover.mp3', audioStart: 0, sfx: SFX };

// =====================================================================================
// TEXT DOM
// =====================================================================================
function makeSpans(parent, cls, parts) {
  const el = document.createElement('div'); el.className = cls; parent.appendChild(el);
  const spans = parts.map(p => { const s = document.createElement('span'); s.textContent = p; el.appendChild(s); return s; });
  return { el, spans };
}
const cards = CARDS.map(c => {
  const k = c.kick.length ? makeSpans($('front'), 'kicker', c.kick.map((w, i) => (i ? ' ' : '') + w[0])) : null;
  const b = makeSpans(c.huge ? $('back') : $('front'), c.huge ? 'big huge' : 'big', [...c.text]);
  b.spans.forEach((s, i) => { if (c.amber || (c.accFrom !== undefined && i >= c.accFrom)) s.classList.add('acc'); });
  if (c.strike) { b.strikeEl = document.createElement('div'); b.strikeEl.className = 'strike'; b.el.appendChild(b.strikeEl); }
  return { ...c, k, b };
});
function fitBigs() {
  cards.forEach(c => {
    const el = c.b.el, base = parseFloat(getComputedStyle(el).fontSize);
    let w = 0; c.b.spans.forEach(s => (w += s.getBoundingClientRect().width));
    const max = c.huge ? 1000 : 960;
    if (w > max) el.style.fontSize = (base * max / w).toFixed(1) + 'px';
    let ww = 0; c.b.spans.forEach(s => (ww += s.getBoundingClientRect().width)); c.strikeW = ww + 30;
  });
}
function textState(t, tin, tout, i) {
  const p = E.outExpo(clamp((t - tin - i * 0.03) / 0.62));
  const q = E.inCubic(clamp((t - tout - i * 0.012) / 0.26));
  return { o: clamp(p * 1.6) * (1 - q), y: (1 - p) * 80 - q * 60, b: (1 - p) * 26 + q * 18, s: 1 + (1 - p) * 0.1 - q * 0.05 };
}
function applyText(s, st, dx = 0, dy = 0) {
  const vis = st.o > 0.003;
  s.style.visibility = vis ? 'visible' : 'hidden';
  if (!vis) return;
  s.style.opacity = st.o.toFixed(3);
  s.style.transform = `translate(${dx.toFixed(1)}px,${(st.y + dy).toFixed(1)}px) scale(${st.s.toFixed(4)})`;
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
scene.add(new THREE.AmbientLight(0xffffff, 0.3));
const U = H / (2 * 5.5 * Math.tan(15 * Math.PI / 180)); // px per world unit at z = 0

const _v = new THREE.Vector3(), _d = new THREE.Vector3();
function pxToWorld(px, py, z = 0, out = new THREE.Vector3()) {
  _v.set(px / W * 2 - 1, 1 - py / H * 2, 0.5).unproject(camera);
  _d.copy(_v).sub(camera.position).normalize();
  return out.copy(camera.position).addScaledVector(_d, (z - camera.position.z) / _d.z);
}

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

// ---------------------------------------------------------------- phone
const pm = {
  frame: new THREE.MeshPhysicalMaterial({ color: 0xc9c2b7, metalness: 0.9, roughness: 0.26, clearcoat: 0.4 }),
  back: new THREE.MeshPhysicalMaterial({ color: 0xdcd5ca, metalness: 0.15, roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.4 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x060606, metalness: 0, roughness: 0.04, clearcoat: 1 }),
  lens: new THREE.MeshPhysicalMaterial({ color: 0x0a0a0c, metalness: 0.2, roughness: 0.05, clearcoat: 1 }),
};
const phone = new THREE.Group(); scene.add(phone);
const phoneSpin = new THREE.Group(); phone.add(phoneSpin);
{
  const s = rr(0.78, 1.6, 0.12); s.holes.push(rr(0.73, 1.55, 0.095));
  phoneSpin.add(slab(s, 0.078, -0.039, pm.frame, 0.006));
  phoneSpin.add(slab(rr(0.74, 1.56, 0.1), 0.01, -0.04, pm.back, 0.002));
  const bump = slab(rr(0.31, 0.31, 0.08), 0.014, -0.056, pm.back, 0.004); bump.position.set(-0.17, 0.56, -0.056); phoneSpin.add(bump);
  [[-0.24, 0.63], [-0.1, 0.63], [-0.17, 0.49]].forEach(([x, y]) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.052, 0.022, 40), pm.lens);
    l.rotation.x = Math.PI / 2; l.position.set(x, y, -0.066); phoneSpin.add(l);
  });
  phoneSpin.add(slab(rr(0.75, 1.57, 0.105), 0.007, 0.034, pm.glass, 0.002));
}
let screenTex, screenCtx;
function buildScreen() {
  screenTex = canvasTex(512, 1110); screenCtx = screenTex.userData.canvas.getContext('2d');
  const sg = planeUV(new THREE.ShapeGeometry(rr(0.71, 1.53, 0.09), 24), 0.71, 1.53);
  const screen = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false, transparent: true }));
  screen.position.z = 0.0435; phoneSpin.add(screen);
}
const phoneMats = [pm.frame, pm.back, pm.glass, pm.lens];
// screen canvas px -> phone local coords
const scr = (u, v) => [(u / 512 - 0.5) * 0.71, (0.5 - v / 1110) * 1.53, 0.045];

// glyphs
const PLANE_GLYPH = new Path2D('M50 4 C55 4 57 11 57 19 L57 37 L96 60 L96 69 L57 57 L57 80 L69 89 L69 95 L50 90 L31 95 L31 89 L43 80 L43 57 L4 69 L4 60 L43 37 L43 19 C43 11 45 4 50 4 Z');
function glyph(g, name, cx, cy, s, col) {
  g.save(); g.translate(cx, cy); g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
  if (name === 'plane') { g.rotate(Math.PI / 4); g.translate(-50 * s, -50 * s); g.scale(s, s); g.fill(PLANE_GLYPH); }
  if (name === 'cell') { for (let i = 0; i < 4; i++) { rrect(g, (-34 + i * 18) * s, (20 - 12 - i * 10) * s, 12 * s, (12 + i * 10) * s, 3 * s); g.fill(); } }
  if (name === 'wifi') {
    g.lineWidth = 7 * s;
    [34, 22, 10].forEach(r => { g.beginPath(); g.arc(0, 18 * s, r * s, -Math.PI * 0.78, -Math.PI * 0.22); g.stroke(); });
    g.beginPath(); g.arc(0, 18 * s, 4 * s, 0, TAU); g.fill();
  }
  if (name === 'bt') {
    g.lineWidth = 6 * s; g.beginPath();
    g.moveTo(-14 * s, -14 * s); g.lineTo(16 * s, 12 * s); g.lineTo(0, 28 * s); g.lineTo(0, -28 * s); g.lineTo(16 * s, -12 * s); g.lineTo(-14 * s, 14 * s); g.stroke();
  }
  g.restore();
}
function bars(g, x, y, n, s, on, col) {
  for (let i = 0; i < 4; i++) {
    g.fillStyle = i < n ? col : 'rgba(255,255,255,.22)';
    rrect(g, x + i * 13 * s, y - (8 + i * 7) * s, 9 * s, (8 + i * 7) * s, 2.5 * s); g.fill();
  }
}
let lastKey = '';
function drawScreen(s) {
  const k = JSON.stringify(s);
  if (k === lastKey) return; lastKey = k;
  const g = screenCtx, w = 512, h = 1110;
  g.textAlign = 'center';
  if (s.mode === 'cc') {
    g.fillStyle = '#100e0c'; g.fillRect(0, 0, w, h);
    const rg = g.createRadialGradient(256, 300, 0, 256, 300, 600); rg.addColorStop(0, 'rgba(224,131,42,.22)'); rg.addColorStop(1, 'rgba(224,131,42,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
    // status bar
    g.fillStyle = '#fff'; g.font = '600 26px Inter'; g.textAlign = 'left'; g.fillText(s.ap ? '' : 'Carrier', 52, 90);
    if (s.ap) glyph(g, 'plane', 400, 80, 0.3, '#fff'); else bars(g, 380, 92, 4, 1.1, true, '#fff');
    if (s.wifi) glyph(g, 'wifi', 450, 80, 0.5, '#fff');
    g.textAlign = 'center';
    // connectivity module
    g.fillStyle = 'rgba(255,255,255,.1)'; rrect(g, 40, 180, 432, 432, 64); g.fill();
    const tiles = [['plane', 152, 292, s.ap, true], ['cell', 360, 292, s.cell, false], ['wifi', 152, 500, s.wifi, false], ['bt', 360, 500, s.bt, false]];
    tiles.forEach(([n, x, y, on, amberOn]) => {
      const pop = s.pops && s.pops[n] ? s.pops[n] : 0;
      g.fillStyle = on ? (amberOn ? '#e0832a' : '#f4f1ec') : 'rgba(255,255,255,.18)';
      g.beginPath(); g.arc(x, y, 78 * (1 + 0.08 * pop), 0, TAU); g.fill();
      glyph(g, n, x, y, n === 'plane' ? 0.78 : 1.25, on ? (amberOn ? '#fff' : '#141312') : '#fff');
    });
    // sliders
    g.fillStyle = 'rgba(255,255,255,.1)'; rrect(g, 40, 650, 200, 360, 56); g.fill(); rrect(g, 272, 650, 200, 360, 56); g.fill();
    g.fillStyle = '#f4f1ec'; g.save(); rrect(g, 40, 650, 200, 360, 56); g.clip(); g.fillRect(40, 830, 200, 200); g.restore();
    g.save(); rrect(g, 272, 650, 200, 360, 56); g.clip(); g.fillRect(272, 880, 200, 200); g.restore();
  } else {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1d1915'); gr.addColorStop(1, '#060606');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const rg = g.createRadialGradient(256, 760, 0, 256, 760, 520); rg.addColorStop(0, `rgba(224,131,42,${0.35 + 0.5 * s.hot})`); rg.addColorStop(1, 'rgba(224,131,42,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.font = '600 26px Inter'; g.textAlign = 'left'; g.fillText(s.search ? 'Searching' + '...'.slice(0, s.dots) : 'Carrier  5G', 52, 90);
    bars(g, 392, 92, s.bars, 1.1, true, s.bars <= 1 ? '#e0832a' : '#fff');
    g.textAlign = 'center';
    g.fillStyle = 'rgba(255,255,255,.72)'; g.font = '500 26px Inter'; g.fillText('Tuesday, 25 November', 256, 190);
    g.fillStyle = '#fff'; g.font = '600 150px "Inter Display"'; g.fillText('9:41', 256, 340);
    // big signal meter
    const bx = 256 - 2 * 62 + 10, by = 840;
    for (let i = 0; i < 4; i++) {
      g.fillStyle = i < s.bars ? (s.bars <= 1 ? '#e0832a' : '#fff') : 'rgba(255,255,255,.18)';
      rrect(g, bx + i * 62, by - 60 - i * 50, 40, 60 + i * 50, 12); g.fill();
    }
    g.fillStyle = s.search ? '#e0832a' : 'rgba(255,255,255,.75)'; g.font = '700 30px Inter'; g.letterSpacing = '6px';
    g.fillText(s.search ? 'SEARCHING' : 'CONNECTED', 262, 920); g.letterSpacing = '0px';
  }
  g.fillStyle = '#000'; rrect(g, 196, 28, 120, 36, 18); g.fill();
  screenTex.needsUpdate = true;
}

// ---------------------------------------------------------------- airliner
const am = {
  body: new THREE.MeshPhysicalMaterial({ color: 0xf4f0ea, metalness: 0.05, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
  wing: new THREE.MeshPhysicalMaterial({ color: 0xdedad3, metalness: 0.25, roughness: 0.38, clearcoat: 0.5 }),
  eng: new THREE.MeshPhysicalMaterial({ color: 0xcfcac2, metalness: 0.6, roughness: 0.3, clearcoat: 0.6 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x1b1a19, metalness: 0.3, roughness: 0.4 }),
  fin: new THREE.MeshPhysicalMaterial({ color: 0xe0832a, metalness: 0.1, roughness: 0.35, clearcoat: 0.6 }),
};
const plane = new THREE.Group(); scene.add(plane);      // view tilt + placement
const planeYaw = new THREE.Group(); plane.add(planeYaw);
const planeBody = new THREE.Group(); planeYaw.add(planeBody); planeBody.rotation.order = 'XZY';
function buildPlane() {
  const tex = canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#f4f0ea'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e4dfd7'; g.fillRect(w * 0.16, 0, w * 0.18, h);           // belly tone
    [0, 0.5, 1].forEach(u => {
      const cx = u * w, belly = u === 0.5 ? -1 : 1;
      g.fillStyle = '#e0832a'; g.fillRect(cx + belly * 34 - 8, h * 0.08, 16, h * 0.8);
      g.fillStyle = '#1d1c1b';
      for (let i = 0; i < 26; i++) { const y = h * 0.22 + i * h * 0.024; rrect(g, cx - 13, y, 26, 6, 3); g.fill(); }
      rrect(g, cx - 14, h * 0.86, 28, 8, 3); g.fill();
    });
  });
  // lathe along +Y, then turned so the nose points to +X. Lathe phi 0 faces +Z.
  const prof = [[0.0, -1.0], [0.035, -0.98], [0.07, -0.88], [0.105, -0.66], [0.122, -0.42], [0.125, -0.1], [0.125, 0.62], [0.118, 0.78], [0.098, 0.9], [0.066, 0.97], [0.03, 0.995], [0.0, 1.0]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const fg = new THREE.LatheGeometry(prof, 64);
  // rewrite v so windows map along the length
  const p = fg.attributes.position, uv = fg.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setY(i, 1 - (p.getY(i) + 1) / 2);
  fg.rotateZ(-Math.PI / 2);
  tex.rotation = 0;
  const bodyMat = am.body.clone(); bodyMat.map = tex; am.bodyTex = bodyMat;
  const fus = new THREE.Mesh(fg, bodyMat); planeBody.add(fus);
  // cockpit windows
  [-1, 1].forEach(sd => {
    const cw = new THREE.Mesh(new RoundedBoxGeometry(0.07, 0.03, 0.02, 2, 0.008), am.dark);
    cw.position.set(0.9, 0.04, sd * 0.06); cw.rotation.y = sd * 0.5; cw.rotation.z = -0.35; planeBody.add(cw);
  });
  const ex = (pts, depth, mat) => {
    const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
    return new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 }), mat);
  };
  const wing = ex([[0.3, 0], [0.3, 0.1], [-0.36, 0.98], [-0.5, 0.98], [-0.26, 0.1], [-0.26, 0], [-0.26, -0.1], [-0.5, -0.98], [-0.36, -0.98], [0.3, -0.1]], 0.024, am.wing);
  wing.geometry.rotateX(Math.PI / 2); wing.position.set(0.02, -0.06, 0); planeBody.add(wing);
  const tail = ex([[-0.7, 0], [-0.7, 0.04], [-0.93, 0.36], [-1.0, 0.36], [-0.92, 0.04], [-0.92, 0], [-0.92, -0.04], [-1.0, -0.36], [-0.93, -0.36], [-0.7, -0.04]], 0.016, am.wing);
  tail.geometry.rotateX(Math.PI / 2); tail.position.set(0, 0.03, 0); planeBody.add(tail);
  const fin = ex([[-0.62, 0.08], [-0.9, 0.5], [-1.0, 0.5], [-0.97, 0.08]], 0.02, am.fin);
  fin.position.z = -0.01; planeBody.add(fin);
  [-1, 1].forEach(sd => {
    const e = new THREE.Group(); e.position.set(0.08, -0.13, sd * 0.42); planeBody.add(e);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.05, 0.24, 32, 1, true), am.eng); c.rotation.z = Math.PI / 2; e.add(c);
    const capG = new THREE.CircleGeometry(0.056, 32); const cap = new THREE.Mesh(capG, am.dark); cap.rotation.y = Math.PI / 2; cap.position.x = 0.115; e.add(cap);
    const py = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.012), am.wing); py.position.set(-0.02, 0.06, 0); e.add(py);
  });
}
const planeMats = () => [am.bodyTex, am.wing, am.eng, am.dark, am.fin];

// ---------------------------------------------------------------- onboard cell (picocell)
const pico = new THREE.Group(); scene.add(pico);
const picoMat = {
  box: new THREE.MeshPhysicalMaterial({ color: 0x1f1e1d, metalness: 0.3, roughness: 0.35, clearcoat: 0.7 }),
  led: new THREE.MeshStandardMaterial({ color: 0xffb35c, emissive: 0xff8a2a, emissiveIntensity: 1.4 }),
  ant: new THREE.MeshStandardMaterial({ color: 0x2a2928, roughness: 0.4 }),
};
{
  pico.add(new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.34, 0.14, 4, 0.04), picoMat.box));
  const led = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.035, 0.02, 2, 0.01), picoMat.led); led.position.set(0, -0.08, 0.072); pico.add(led);
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.03, 24), picoMat.led); dot.position.set(-0.16, 0.08, 0.071); pico.add(dot);
  [-0.16, 0.16].forEach(x => { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.36, 16), picoMat.ant); a.position.set(x, 0.33, 0); pico.add(a); });
}
const picoMats = [picoMat.box, picoMat.led, picoMat.ant];

// =====================================================================================
// 2D OVERLAYS
// =====================================================================================
function svg(tag, attrs, parent = $('ui')) { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
const show = (el, o) => { const v = o > 0.002; el.style.display = v ? '' : 'none'; if (v) el.style.opacity = clamp(o).toFixed(3); return v; };
const v3 = new THREE.Vector3();
function project(obj, [x, y, z]) { v3.set(x, y, z); obj.localToWorld(v3); v3.project(camera); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H]; }
const defs = svg('defs', {});
const clip = svg('clipPath', { id: 'below' }, defs); svg('rect', { x: 0, y: 610, width: W, height: 900 }, clip);

function towerD(h) {
  const w = h * 0.44, hh = h * 0.8, tw = w * 0.1, N = 5;
  let d = `M${-w / 2} 0 L${-tw} ${-hh} M${w / 2} 0 L${tw} ${-hh}`;
  for (let k = 0; k < N; k++) {
    const y0 = -hh * k / N, y1 = -hh * (k + 1) / N, x0 = lerp(w / 2, tw, k / N), x1 = lerp(w / 2, tw, (k + 1) / N);
    d += ` M${-x0} ${y0} L${x1} ${y1} M${x0} ${y0} L${-x1} ${y1} M${-x1} ${y1} L${x1} ${y1}`;
  }
  d += ` M0 ${-hh} L0 ${-h} M${-tw - 12} ${-hh + 6} L${-tw - 12} ${-hh - 34} M${tw + 12} ${-hh + 6} L${tw + 12} ${-hh - 34}`;
  return d;
}
function makeTower(parent, h, sw = 4) {
  const g = svg('g', {}, parent);
  const p = svg('path', { d: towerD(h), fill: 'none', stroke: INK, 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1 }, g);
  const arcs = [1, 2].map(i => svg('path', { d: `M${-22 * i} ${-h - 8 - 12 * i} Q0 ${-h - 30 - 22 * i} ${22 * i} ${-h - 8 - 12 * i}`, fill: 'none', stroke: AMB, 'stroke-width': sw * 0.9, 'stroke-linecap': 'round' }, g));
  return { g, p, arcs, h };
}
function setTower(T, x, y, s, draw, sig, o = 1) {
  T.g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${s.toFixed(4)})`);
  T.g.style.opacity = o;
  T.p.setAttribute('stroke-dashoffset', (1 - draw).toFixed(4));
  T.arcs.forEach((a, i) => a.setAttribute('opacity', clamp(sig * 2 - i * 0.6).toFixed(3)));
}

// callouts (reference style)
function makeCallout(label, side) {
  const g = svg('g', {});
  return { side, g, path: svg('path', { fill: 'none', stroke: INK, 'stroke-width': 2.5, pathLength: 1, 'stroke-dasharray': 1 }, g),
    ping: svg('circle', { r: 8, fill: 'none', stroke: INK, 'stroke-width': 2 }, g), dot: svg('circle', { r: 7, fill: INK }, g),
    text: Object.assign(svg('text', { class: 'cl-txt', 'text-anchor': side > 0 ? 'start' : 'end' }, g), { textContent: label }) };
}
const CALLOUTS = [
  ['CELLULAR RADIO.', 1, 4.45, 5.25, () => phoneSpin, [0.2, 0.5, 0.05], [150, 150]],
  ['TOWER 1.', -1, 7.3, 9.15, () => null, () => towerTop(0), [-40, -150]],
  ['YOUR PHONE.', 1, 12.15, 13.3, () => planeBody, [0.45, 0.04, 0.125], [150, 190]],
  ['1 BAR.', 1, 21.95, 22.7, () => phoneSpin, [0.15, -0.16, 0.05], [190, 120]],
  ['COCKPIT HEADSET.', 1, 27.05, 28.0, () => null, () => [HS.x + 150, HS.y + 60], [70, 230]],
  ['ONBOARD CELL.', 1, 37.75, 39.0, () => pico, [0.0, 0.0, 0.07], [170, 210]],
  ['AIRPLANE MODE.', -1, 47.0, 48.35, () => phoneSpin, scr(152, 292), [-150, 230]],
  ['CELLULAR OFF.', 1, 48.55, 49.0, () => phoneSpin, scr(360, 292), [150, 260]],
  ['WI-FI + BT.', -1, 49.8, 50.9, () => phoneSpin, scr(152, 500), [-150, 250]],
].map(([label, side, tin, tout, obj, pt, d]) => ({ c: makeCallout(label, side), tin, tout, obj, pt, d }));

// ---- act 1: radio rings around the small phone
const ringsG = svg('g', { 'clip-path': 'url(#below)' });
const rings = [...Array(6)].map(() => svg('circle', { fill: 'none', stroke: AMB, 'stroke-width': 4 }, ringsG));

// ---- act 2: ground + 3 towers
const groundG = svg('g', {}, $('backsvg'));
const groundLine = svg('path', { d: 'M40 0 L1040 0', stroke: INK, 'stroke-width': 3, fill: 'none', pathLength: 1, 'stroke-dasharray': 1, 'stroke-linecap': 'round' }, groundG);
const hatch = svg('g', {}, groundG);
for (let i = 0; i < 26; i++) svg('line', { x1: 60 + i * 38, y1: 0, x2: 40 + i * 38, y2: 20, stroke: 'rgba(20,19,18,.25)', 'stroke-width': 2 }, hatch);
const gTowers = [0, 1, 2].map(() => makeTower(groundG, 300));
const coverage = [0, 1, 2].map(() => svg('path', { fill: 'none', stroke: 'rgba(20,19,18,.28)', 'stroke-width': 2.5, 'stroke-dasharray': '10 12' }, groundG));
const TX = [180, 540, 900], GY = 1400;
const towerTop = i => [TX[i], GY - 300 - 10];
const linkG = svg('g', {});
const links = [0, 1, 2].map(() => svg('line', { stroke: AMB, 'stroke-width': 5, 'stroke-linecap': 'round' }, linkG));
const linkDots = [0, 1, 2].map(() => svg('circle', { r: 9, fill: AMB }, linkG));

// ---- act 3: speed streaks + altitude ruler
const streakG = svg('g', {}, $('backsvg'));
const RS = rng(21);
const streaks = [...Array(22)].map(() => ({ el: svg('line', { stroke: 'rgba(20,19,18,.28)', 'stroke-width': 3, 'stroke-linecap': 'round' }, streakG), y: 660 + RS() * 800, sp: 0.7 + RS() * 0.8, ph: RS(), len: 80 + RS() * 220 }));
const rulerG = svg('g', {});
const rulerLine = svg('line', { x1: 110, x2: 110, y1: 1440, y2: 1440, stroke: INK, 'stroke-width': 3 }, rulerG);
const rulerTicks = [...Array(11)].map((_, i) => svg('line', { x1: 110, x2: i % 5 ? 132 : 146, y1: 1440 - i * 66, y2: 1440 - i * 66, stroke: INK, 'stroke-width': i % 5 ? 2 : 3 }, rulerG));
const rulerLbl = Object.assign(svg('text', { class: 'amb-txt', x: 160, y: 790 }, rulerG), { textContent: '10 KM' });
const rulerGround = svg('line', { x1: 70, x2: 1010, y1: 1440, y2: 1440, stroke: 'rgba(20,19,18,.35)', 'stroke-width': 3, 'stroke-dasharray': '4 10', 'stroke-linecap': 'round' }, rulerG);

// ---- act 4: field of towers + flickering links
const fieldG = svg('g', {}, $('backsvg'));
const RF = rng(5);
const FIELD = [];
[[1170, 0.34, 8, 820], [1265, 0.46, 7, 900], [1365, 0.6, 5, 960], [1455, 0.74, 4, 1000]].forEach(([y, s, n, span], row) => {
  for (let i = 0; i < n; i++) {
    const x = 540 + (n === 1 ? 0 : (i / (n - 1) - 0.5) * span) + (RF() - 0.5) * 40;
    FIELD.push({ T: makeTower(fieldG, 150, 5), x, y, s, d: RF() * 0.5 + row * 0.12, seed: Math.floor(RF() * 1e6) });
  }
});
const fieldLinkG = svg('g', {});
const fieldLinks = FIELD.map(() => svg('line', { stroke: AMB, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-dasharray': '14 10' }, fieldLinkG));
const fieldX = FIELD.map(() => svg('path', { d: 'M-10 -10 L10 10 M10 -10 L-10 10', stroke: INK, 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none' }, fieldLinkG));

// ---- act 5: transmit power ring
const pwrG = svg('g', {});
svg('circle', { r: 360, fill: 'none', stroke: 'rgba(20,19,18,.12)', 'stroke-width': 2 }, pwrG);
const pwrTicks = [...Array(72)].map((_, i) => svg('line', { stroke: 'rgba(20,19,18,.35)', 'stroke-width': i % 6 ? 2 : 3, 'stroke-linecap': 'round' }, pwrG));
const pwrArc = svg('circle', { r: 360, fill: 'none', stroke: AMB, 'stroke-width': 8, 'stroke-linecap': 'round', pathLength: 100 }, pwrG);
const shoutG = svg('g', { 'clip-path': 'url(#below)' });
const shouts = [...Array(6)].map(() => svg('circle', { fill: 'none', stroke: AMB, 'stroke-width': 7 }, shoutG));

// ---- act 6: headset + noise + buzz waveform
const HS = { x: 640, y: 980 };
const hsG = svg('g', {});
const hsPaths = [
  'M-150 30 C-150 -190 150 -190 150 30', 'M-126 20 C-126 -160 126 -160 126 20',
  'M-196 10 Q-196 -10 -176 -10 L-118 -10 Q-98 -10 -98 10 L-98 150 Q-98 170 -118 170 L-176 170 Q-196 170 -196 150 Z',
  'M98 10 Q98 -10 118 -10 L176 -10 Q196 -10 196 10 L196 150 Q196 170 176 170 L118 170 Q98 170 98 150 Z',
  'M-150 150 C-150 250 -70 272 6 254',
].map(d => svg('path', { d, fill: 'none', stroke: INK, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1 }, hsG));
const hsMic = svg('circle', { cx: 20, cy: 252, r: 15, fill: INK }, hsG);
const hsSound = [-1, 1].flatMap(sd => [1, 2, 3].map(i => svg('path', { d: `M${sd * (210 + i * 26)} ${80 - 30 - i * 16} Q${sd * (226 + i * 30)} 80 ${sd * (210 + i * 26)} ${80 + 30 + i * 16}`, fill: 'none', stroke: AMB, 'stroke-width': 5, 'stroke-linecap': 'round' }, hsG)));
const noisePath = svg('path', { fill: 'none', stroke: AMB, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': '2 14' });
const waveG = svg('g', {});
const waveBase = svg('line', { x1: 120, x2: 960, y1: 1380, y2: 1380, stroke: 'rgba(20,19,18,.25)', 'stroke-width': 2 }, waveG);
const wave = svg('path', { fill: 'none', stroke: AMB, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, waveG);

// ---- act 7: top-down plane with seats, rain onto overloaded towers
const topG = svg('g', {});
const topPaths = [
  'M-330 -40 L250 -40 C330 -40 360 -12 372 0 C360 12 330 40 250 40 L-330 40 C-352 40 -364 20 -366 0 C-364 -20 -352 -40 -330 -40 Z',
  'M70 -40 L-50 -215 L-104 -215 L-58 -40', 'M70 40 L-50 215 L-104 215 L-58 40',
  'M-286 -40 L-340 -118 L-368 -118 L-350 -40', 'M-286 40 L-340 118 L-368 118 L-350 40',
].map(d => svg('path', { d, fill: 'none', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1 }, topG));
const SEATS = [];
const RSe = rng(9);
for (let c = 0; c < 36; c++) for (let r = 0; r < 6; r++) SEATS.push({ el: svg('circle', { cx: -300 + c * 15.5, cy: -26 + r * 10.4 + (r > 2 ? 0 : 0), r: 3.4, fill: 'rgba(20,19,18,.35)' }, topG), d: RSe() });
const netG = svg('g', {}, $('backsvg'));
const NT = [150, 345, 540, 735, 930];
const nTowers = NT.map(() => makeTower(netG, 180, 4));
const nLoads = NT.map(() => { const g = svg('g', {}, netG); return { g, box: svg('rect', { x: 46, y: -150, width: 22, height: 150, rx: 5, fill: 'none', stroke: INK, 'stroke-width': 3 }, g), fill: svg('rect', { x: 49, y: -3, width: 16, height: 0, rx: 3, fill: INK }, g) }; });
const netGround = svg('line', { x1: 50, x2: 1030, y1: 0, y2: 0, stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round' }, netG);
const rainG = svg('g', {});
const RR2 = rng(13);
const rain = [...Array(46)].map(() => ({ el: svg('circle', { r: 6, fill: AMB }, rainG), x0: -280 + RR2() * 560, tgt: Math.floor(RR2() * 5), ph: RR2(), sp: 1.1 + RR2() * 0.7 }));

// ---- act 8/9: whisper rings, distance dimension
const whG = svg('g', {});
const whispers = [...Array(3)].map(() => svg('circle', { fill: 'none', stroke: INK, 'stroke-width': 2.5 }, whG));
const gapG = svg('g', {});
const gapLine = svg('line', { stroke: INK, 'stroke-width': 3 }, gapG);
const gapEnds = [0, 1].map(() => svg('line', { stroke: INK, 'stroke-width': 3 }, gapG));
const gapLbl = Object.assign(svg('text', { class: 'cl-txt', 'text-anchor': 'middle' }, gapG), { textContent: '1 METRE' });
const distG = svg('g', {}, $('backsvg'));
const distTower = makeTower(distG, 240, 5);
const distLine = svg('line', { x1: 0, x2: 0, stroke: AMB, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': '3 14' }, distG);
const distHeads = [0, 1].map(() => svg('path', { d: 'M-16 0 L0 -22 L16 0', fill: 'none', stroke: AMB, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, distG));

// ---- act 11: towers it can't reach
const endG = svg('g', {}, $('backsvg'));
const ET = [170, 355, 540, 725, 910];
const eTowers = ET.map(() => makeTower(endG, 170, 4));
const endGround = svg('line', { x1: 60, x2: 1020, y1: 0, y2: 0, stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1 }, endG);
const reachG = svg('g', {});
const reaches = ET.map(() => svg('line', { stroke: AMB, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': '10 12' }, reachG));
const reachX = ET.map(() => svg('path', { d: 'M-12 -12 L12 12 M12 -12 L-12 12', stroke: AMB, 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none' }, reachG));
const scream = svg('g', { 'clip-path': 'url(#below)' });
const screams = [...Array(5)].map(() => svg('circle', { fill: 'none', stroke: AMB, 'stroke-width': 6 }, scream));

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
// TIMELINE HELPERS
// =====================================================================================
const inOut = (t, a, b, din = 0.4, dout = 0.35, ei = E.outExpo, eo = E.inCubic) => prog(t, a, a + din, ei) * (1 - prog(t, b - dout, b, eo));
const hash = n => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
// keyframes on [px, py, scale] tuples
function kf3(t, keys) { return [0, 1, 2].map(j => kf(t, keys.map(k => [k[0], k[1][j], k[2]]))); }

// ---------------------------------------------------------------- phone track
function phoneTrack(t) {
  // returns [px, py, scale, opacity]
  const k = [
    [1.05, [800, 820, 0.05]], [1.45, [790, 800, 0.2], E.outBack], [2.95, [800, 790, 0.21]],
    [3.6, [560, 1020, 0.46], E.inOutCubic], [4.2, [540, 1030, 0.48]], [4.6, [540, 1000, 0.16], E.outExpo], [5.25, [540, 990, 0.17]],
    [5.7, [150, 860, 0.2], E.inOutCubic], [7.8, [330, 860, 0.2], E.linear], [9.21, [560, 860, 0.2], E.linear], [10.06, [870, 860, 0.2], E.inOutCubic], [10.5, [1300, 760, 0.2], E.inCubic],
    [19.6, [1300, 760, 0.2]], [20.1, [540, 1030, 0.5], E.outExpo], [25.6, [540, 1020, 0.52], E.linear], [26.1, [210, 1000, 0.2], E.outExpo], [29.9, [230, 990, 0.2], E.linear], [30.3, [-250, 990, 0.2], E.inCubic],
    [39.3, [-250, 1040, 0.3]], [39.8, [180, 1040, 0.3], E.outExpo], [40.06, [200, 1040, 0.3]], [40.5, [390, 1040, 0.3], E.outExpo], [43.0, [400, 1040, 0.3], E.linear],
    [43.5, [540, 830, 0.2], E.outExpo], [46.0, [540, 830, 0.2], E.linear], [46.6, [540, 1040, 0.56], E.outExpo], [50.9, [540, 1030, 0.58], E.linear],
    [51.5, [540, 1000, 0.42], E.outCubic], [52.55, [540, 990, 0.42]], [53.4, [600, 2400, 0.42], E.inCubic], [99, [600, 2400, 0.42]],
  ];
  const [x, y, s] = kf3(t, k);
  const o = (t < 1.08 ? 0 : 1) * (t > 10.45 && t < 19.62 ? 0 : 1) * (t > 30.25 && t < 39.35 ? 0 : 1) * (t > 53.4 ? 0 : 1);
  return [x, y, s, o];
}
function phoneRot(t) {
  const spin = TAU * (prog(t, 1.2, 1.85, E.outExpo) + prog(t, 20.1, 20.75, E.outExpo) + prog(t, 44.19, 44.85, E.outExpo) + prog(t, 46.22, 46.9, E.outExpo));
  const ry = kf(t, [[1.2, -0.4], [3.0, 0.3, E.linear], [3.6, -0.25], [4.2, 0.2, E.linear], [5.25, -0.15], [6.0, 0.35], [10.3, 0.25, E.linear], [20.2, -0.3], [25.6, 0.25, E.linear],
    [26.1, 0.4], [29.9, 0.2], [39.8, 0.45], [43.0, 0.3, E.linear], [43.5, -0.2], [46.1, 0.15, E.linear], [46.9, -0.18], [50.9, 0.12, E.linear], [51.5, 0.3], [52.6, 0.2]]);
  const rz = kf(t, [[5.7, 0], [6.2, -0.1], [9.2, -0.14], [10.06, -0.25], [10.5, 0], [52.62, 0], [53.4, 2.6, E.inCubic]]);
  const rx = kf(t, [[0, 0.15], [52.62, 0.1], [53.4, 1.4, E.inCubic]]);
  return [rx, ry + spin, rz];
}

// ---------------------------------------------------------------- plane track
function planeTrack(t) {
  // [px, py, scale, heading(yaw), roll, pitch, opacity]
  const k = [
    [0, [1500, 1060, 0.5]], [0.9, [540, 1010, 0.55], E.outExpo], [2.95, [500, 1000, 0.56], E.linear], [3.6, [300, 790, 0.3], E.inOutCubic], [4.25, [280, 780, 0.29], E.linear], [4.8, [-400, 700, 0.29], E.inCubic],
    [10.42, [-500, 1000, 0.48]], [11.2, [520, 1020, 0.5], E.outExpo], [13.4, [560, 1010, 0.52], E.linear], [14.3, [560, 900, 0.5], E.inOutCubic], [15.0, [560, 880, 0.5], E.linear],
    [15.6, [540, 790, 0.36], E.inOutCubic], [19.5, [560, 780, 0.36], E.linear], [20.0, [1500, 700, 0.36], E.inCubic],
    [34.6, [1500, 1040, 0.5]], [35.2, [540, 1030, 0.56], E.outExpo], [38.9, [540, 1020, 0.6], E.linear], [39.5, [540, 1020, 0.3], E.inCubic],
    [53.4, [1600, 950, 0.5]], [54.2, [560, 960, 0.5], E.outExpo], [58.5, [520, 940, 0.53], E.linear],
  ];
  const [x, y, s] = kf3(t, k);
  const yaw = kf(t, [[0, -0.15], [0.9, -0.55, E.outExpo], [2.95, -0.75, E.linear], [3.6, -0.5], [10.42, -0.3], [11.2, -0.55, E.outExpo], [15.0, -0.75, E.linear], [15.6, -0.35], [19.5, -0.55, E.linear],
    [34.6, -0.3], [35.2, -0.6, E.outExpo], [38.9, -0.8, E.linear], [53.4, -0.2], [54.2, -0.6, E.outExpo], [58.5, -0.8, E.linear]]) + TAU * prog(t, 35.46, 36.15, E.outExpo);
  const roll = kf(t, [[0, 0.5], [0.9, -0.12, E.outExpo], [1.93, -0.1], [2.34, -0.1], [2.95, 0.05, E.linear], [54.2, 0.0]]) + TAU * prog(t, 2.34, 2.95, E.outExpo)
    + (t > 1.93 && t < 2.3 ? Math.sin((t - 1.93) * 60) * 0.12 * (1 - (t - 1.93) / 0.37) : 0) + Math.sin(t * 1.4) * 0.03;
  const pitch = kf(t, [[13.46, 0], [14.0, 0.28], [15.0, 0.12], [15.6, 0]]) + Math.sin(t * 1.1) * 0.02;
  const o = (t > 4.8 && t < 10.42 ? 0 : 1) * (t > 20.0 && t < 34.6 ? 0 : 1) * (t > 39.5 && t < 53.4 ? 0 : 1) * (t < 50 ? clamp(1 - prog(t, 39.1, 39.5)) : 1);
  return { x, y, s, yaw, roll, pitch, o };
}

// =====================================================================================
// RENDER
// =====================================================================================
const tmpW = new THREE.Vector3();
function renderAt(t) {
  const fl = Math.sin(t * 1.9) * 7; // float in px

  // ---------------- camera: tiny sway (parallax), objects are placed in px space
  camera.position.set(Math.sin(t * 0.7) * 0.05, Math.cos(t * 0.9) * 0.03, 5.5);
  camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  // slow global push: grows inside each act, eases back at cuts
  const push = 1 + 0.035 * Math.sin(t * 0.45) + 0.02 * Math.sin(t * 1.13);

  // ---------------- phone
  const [ppx, ppy, ps, po] = phoneTrack(t);
  phone.visible = po > 0.001 && ps > 0.01;
  if (phone.visible) {
    pxToWorld(540 + (ppx - 540) * push, 1000 + (ppy + fl - 1000) * push, 0, tmpW); phone.position.copy(tmpW);
    phone.scale.setScalar(ps * push);
    const [rx, ry, rz] = phoneRot(t);
    const shake = (t > 24.71 && t < 25.6 ? 1 : 0) * Math.sin(t * 70) * 0.05;
    phone.rotation.set(rx + Math.sin(t * 1.3) * 0.03, ry + Math.sin(t * 0.8) * 0.05, rz + shake);
    fadeMats(phoneMats, po);
  }
  // screen state
  const ss = (t >= 46.22 && t < 53.5)
    ? { mode: 'cc', ap: t >= 46.69, cell: t < 48.49, wifi: t >= 49.02, bt: t >= 49.72,
        pops: { plane: +(2 * Math.sin(Math.PI * clamp((t - 46.69) / 0.3))).toFixed(1), cell: 0, wifi: +(2 * Math.sin(Math.PI * clamp((t - 49.02) / 0.3))).toFixed(1), bt: +(2 * Math.sin(Math.PI * clamp((t - 49.72) / 0.3))).toFixed(1) } }
    : { mode: 'lock', bars: t < 20.2 ? (t > 15 ? 2 : 4) : t < 25.7 ? Math.round(kf(t, [[20.5, 4], [21.9, 1]])) : t > 39 && t < 43.2 ? Math.round(kf(t, [[40.06, 1], [40.6, 4]])) : 4,
        search: (t > 20.6 && t < 25.7) || (t > 3 && t < 5.3), dots: Math.floor(t * 3) % 4, hot: +(kf(t, [[23.6, 0], [24.7, 1], [25.6, 0.4]])).toFixed(2) };
  drawScreen(ss);

  // ---------------- plane
  const P = planeTrack(t);
  plane.visible = P.o > 0.001;
  if (plane.visible) {
    pxToWorld(540 + (P.x - 540) * push, 1000 + (P.y + fl * 0.8 - 1000) * push, 0, tmpW); plane.position.copy(tmpW);
    plane.scale.setScalar(P.s * push);
    plane.rotation.set(0.32, 0, 0);
    planeYaw.rotation.y = P.yaw;
    planeBody.rotation.set(P.roll, 0, P.pitch);
    const xr = t < 45 ? 1 - 0.65 * kf(t, [[36.9, 0], [37.3, 1]]) : 1;
    fadeMats(planeMats(), P.o * xr);
  }

  // ---------------- pico (onboard cell)
  const pin = prog(t, 37.3, 37.75, E.outBack), pgo = prog(t, 39.1, 39.5);
  const pOn = t > 37.25 && t < 43.1;
  pico.visible = pOn;
  if (pOn) {
    let px, py, s;
    if (t < 39.3) { const [a, b] = project(planeBody, [0.15, 0.0, 0]); px = a; py = b; s = 0.32 * pin * P.s / 0.6 * (1 + 0.5 * pgo); }
    else { [px, py, s] = kf3(t, [[39.3, [560, 1020, 0.3]], [39.8, [880, 1040, 0.62], E.outExpo], [40.06, [860, 1040, 0.62]], [40.5, [700, 1040, 0.62], E.outExpo], [43.0, [690, 1040, 0.62], E.linear]]); py += fl; }
    pxToWorld(px, py, 0.12, tmpW); pico.position.copy(tmpW); pico.scale.setScalar(Math.max(0.001, s));
    pico.rotation.set(0.15, kf(t, [[37.3, -0.6], [39.0, 0.3, E.linear], [39.8, -0.35], [43, -0.2, E.linear]]) + Math.sin(t) * 0.05, 0);
    picoMat.led.emissiveIntensity = 1.2 + 0.6 * Math.sin(t * 6);
    fadeMats(picoMats, 1 - prog(t, 42.8, 43.1));
  }

  scene.updateMatrixWorld();
  renderer.render(scene, camera);

  // ---------------- contact shadow under the main object
  const sh = $('shadow');
  let shO = 0, shY = 1500, shS = 1;
  if (phone.visible) { const [, by] = project(phone, [0, -0.85, 0]); shY = by + 30; shO = po * clamp(ps * 4) * 0.9; shS = ps / 0.5; }
  if (plane.visible && P.o > 0.5) { shY = P.y + P.s * 520 + 40; shO = 0.45 * P.o; shS = P.s * 1.6; }
  if (t > 5.3 && t < 10.5) shO = 0;
  sh.style.top = Math.min(1480, shY).toFixed(1) + 'px';
  sh.style.opacity = (shO * (0.85 + Math.sin(t * 1.9) * 0.08)).toFixed(3);
  sh.style.transform = `scaleX(${clamp(shS, 0.25, 1.4).toFixed(3)})`;

  // ---------------- glow / warm
  const glow = Math.max(kf(t, [[24.6, 0], [24.9, 0.9], [25.5, 0.9], [25.9, 0]]), kf(t, [[37.3, 0], [37.8, 0.5], [39.3, 0.5], [39.8, 0]]), kf(t, [[46.6, 0], [47.0, 0.45], [48.4, 0.45], [48.8, 0]]), kf(t, [[55.8, 0], [56.0, 0.6], [56.3, 0]]));
  $('glow').style.opacity = glow.toFixed(3);
  $('glow').style.transform = `scale(${(0.85 + 0.15 * Math.sin(t * 2)).toFixed(3)})`;
  $('warm').style.opacity = (0.35 * kf(t, [[24.7, 0], [24.85, 1], [25.5, 1], [25.8, 0]])).toFixed(3);

  // ---------------- type
  const dx = Math.sin(t * 0.6) * 4, dy = -Math.sin(t * 0.9) * 6;
  cards.forEach(c => {
    if (c.k) {
      if (t < c.kick[0][1] - 0.1 || t > c.out + 0.6) c.k.el.style.display = 'none';
      else { c.k.el.style.display = ''; c.k.spans.forEach((s, i) => applyText(s, textState(t, c.kick[i][1], c.out, 0), dx, dy)); }
    }
    const b = c.b;
    if (t < c.at - 0.1 || t > c.out + 0.7) { b.el.style.display = 'none'; return; }
    b.el.style.display = '';
    b.spans.forEach((s, i) => {
      const st = textState(t, c.at, c.out, i);
      if (c.huge) st.s *= lerp(1.12, 1, prog(t, c.at, c.at + 1.2, E.outCubic));
      let jx = 0, jy = 0;
      if (c.shake && t > c.at) { jx = Math.sin(t * 83 + i * 2) * 4 * (1 - prog(t, c.at, c.out)); jy = Math.cos(t * 71 + i) * 3 * (1 - prog(t, c.at, c.out)); }
      if (c.buzz && t > c.at) { const on = Math.floor((t - c.at) / 0.08) % 3 !== 2; jx = on ? (hash(Math.floor(t * 60) * 7 + i) - 0.5) * 9 : 0; }
      applyText(s, st, (c.huge ? 0 : dx) + jx, (c.huge ? 0 : dy) + jy);
    });
    if (b.strikeEl) {
      const p = prog(t, c.strike, c.strike + 0.3, E.outExpo), q = prog(t, c.out, c.out + 0.25);
      b.strikeEl.style.width = c.strikeW + 'px'; b.strikeEl.style.marginLeft = (-c.strikeW / 2) + 'px';
      b.strikeEl.style.transform = `translate(${dx}px,${dy}px) scaleX(${p.toFixed(4)})`; b.strikeEl.style.opacity = (1 - q).toFixed(3);
    }
  });

  // ---------------- callouts
  CALLOUTS.forEach(({ c, tin, tout, obj, pt, d }) => {
    const p = prog(t, tin, tin + 0.38, E.outCubic), q = prog(t, tout, tout + 0.22, E.inCubic);
    const vis = p > 0 && q < 1;
    c.g.style.display = vis ? '' : 'none';
    if (!vis) return;
    const o = obj();
    const [ax, ay] = o ? project(o, pt) : pt();
    const tw = c.text.textContent.length * 22 + 30, by = ay + d[1];
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

  const [phX, phY] = phone.visible ? project(phone, [0, 0, 0]) : [540, 1000];

  // ---------------- act 1: radio rings from the small phone
  const rO = inOut(t, 4.3, 5.35, 0.2, 0.35);
  if (show(ringsG, rO)) rings.forEach((r, i) => {
    const u = ((t - 4.3) * 1.3 + i / rings.length) % 1;
    r.setAttribute('cx', phX); r.setAttribute('cy', phY); r.setAttribute('r', (90 + u * 380).toFixed(1));
    r.setAttribute('opacity', ((1 - u) * clamp(u * 6)).toFixed(3)); r.setAttribute('stroke-width', (5 - 3 * u).toFixed(2));
  });

  // ---------------- act 2: ground + towers + handoff links
  const gO = inOut(t, 5.36, 10.75, 0.3, 0.35, E.outCubic);
  if (show(groundG, gO)) {
    const gy = GY + (1 - prog(t, 5.36, 5.8, E.outExpo)) * 40 + prog(t, 10.4, 10.75, E.inCubic) * 160;
    groundG.setAttribute('transform', `translate(0 ${gy - GY})`);
    groundLine.setAttribute('transform', `translate(0 ${GY})`); hatch.setAttribute('transform', `translate(0 ${GY})`);
    groundLine.setAttribute('stroke-dashoffset', 1 - prog(t, 5.36, 5.9, E.outCubic));
    hatch.style.opacity = prog(t, 5.6, 6.0);
    gTowers.forEach((T, i) => {
      const a = 5.55 + i * 0.22;
      const active = i === (t < 9.21 ? 0 : t < 10.06 ? 1 : 2);
      setTower(T, TX[i], GY, 1, prog(t, a, a + 0.6, E.outCubic), active && t > 6.4 ? 0.5 + 0.5 * Math.sin(t * 8) : 0);
      const cv = prog(t, 6.4 + i * 0.12, 6.9 + i * 0.12, E.outCubic);
      const r = 230 * cv;
      coverage[i].setAttribute('d', `M${TX[i] - r} ${GY} A${r} ${r} 0 0 1 ${TX[i] + r} ${GY}`);
      coverage[i].setAttribute('stroke', active ? 'rgba(224,131,42,.65)' : 'rgba(20,19,18,.22)');
    });
  }
  const lO = inOut(t, 6.4, 10.4, 0.2, 0.25);
  if (show(linkG, lO)) {
    const [, pb] = project(phone, [0, -0.8, 0]);
    links.forEach((l, i) => {
      const start = i === 0 ? 6.4 : i === 1 ? 9.21 : 10.06, end = i === 0 ? 9.21 : i === 1 ? 10.06 : 99;
      const on = prog(t, start, start + 0.22, E.outCubic) * (1 - prog(t, end, end + 0.15));
      const [tx, ty] = towerTop(i);
      const ty2 = ty + (gO < 1 ? (1 - gO) * 0 : 0);
      const ex = lerp(phX, tx, on), ey = lerp(pb, ty2, on);
      l.setAttribute('x1', phX); l.setAttribute('y1', pb); l.setAttribute('x2', ex); l.setAttribute('y2', ey);
      l.setAttribute('opacity', on > 0.01 ? 1 : 0);
      const u = (t * 1.6) % 1;
      linkDots[i].setAttribute('cx', lerp(tx, phX, u)); linkDots[i].setAttribute('cy', lerp(ty2, pb, u));
      linkDots[i].setAttribute('opacity', (on > 0.95 ? 1 : 0) * Math.sin(Math.PI * u));
    });
  }

  // ---------------- act 3: speed streaks + altitude ruler
  const stO = inOut(t, 11.55, 15.1, 0.3, 0.4) * (0.5 + 0.5 * prog(t, 11.65, 12.2));
  if (show(streakG, stO)) streaks.forEach(s => {
    const u = ((t * s.sp * 1.6 + s.ph) % 1), x = 1180 - u * 1400;
    s.el.setAttribute('x1', x); s.el.setAttribute('x2', x + s.len); s.el.setAttribute('y1', s.y); s.el.setAttribute('y2', s.y);
    s.el.setAttribute('opacity', Math.sin(Math.PI * u).toFixed(3));
  });
  const ruO = inOut(t, 13.46, 15.1, 0.3, 0.35);
  if (show(rulerG, ruO)) {
    const h = prog(t, 13.5, 14.35, E.outCubic);
    rulerLine.setAttribute('y2', 1440 - 660 * h);
    rulerTicks.forEach((l, i) => l.setAttribute('opacity', clamp(h * 10 - i + 0.5)));
    rulerLbl.setAttribute('opacity', prog(t, 14.1, 14.4)); rulerLbl.setAttribute('y', 790 + (1 - prog(t, 14.1, 14.4, E.outCubic)) * 30);
    rulerGround.setAttribute('opacity', 1);
  }

  // ---------------- act 4: tower field + flickering links
  const fO = inOut(t, 15.3, 19.75, 0.3, 0.35, E.outCubic);
  if (show(fieldG, fO)) FIELD.forEach(f => {
    const a = 16.66 + f.d * 1.1;
    setTower(f.T, f.x, f.y, f.s * E.outBack(clamp((t - a) / 0.35)) + 0.0001, prog(t, a, a + 0.4), t > 16.4 ? 0.5 + 0.5 * Math.sin(t * 7 + f.seed) : 0);
  });
  const fLO = inOut(t, 16.4, 19.6, 0.15, 0.3);
  if (show(fieldLinkG, fLO)) {
    const [sx, sy] = plane.visible ? project(planeBody, [0.45, 0, 0.125]) : [540, 800];
    FIELD.forEach((f, i) => {
      const a = 16.66 + f.d * 1.1;
      const tx = f.x, ty = f.y - 150 * f.s - 10;
      const frame = Math.floor(t * 9);
      const broken = t > 18.21;
      const alive = t > a && (broken ? hash(frame * 31 + i) > 0.72 : hash(frame * 17 + i) > 0.25);
      const reach = broken ? 0.35 + 0.4 * hash(frame * 13 + i) : 1;
      fieldLinks[i].setAttribute('x1', sx); fieldLinks[i].setAttribute('y1', sy);
      fieldLinks[i].setAttribute('x2', lerp(sx, tx, reach)); fieldLinks[i].setAttribute('y2', lerp(sy, ty, reach));
      fieldLinks[i].setAttribute('opacity', alive ? 0.85 : 0);
      fieldLinks[i].setAttribute('stroke-dashoffset', (-t * 60).toFixed(1));
      fieldX[i].setAttribute('transform', `translate(${lerp(sx, tx, reach).toFixed(1)} ${lerp(sy, ty, reach).toFixed(1)}) scale(${broken && alive ? 1 : 0})`);
      fieldX[i].setAttribute('stroke', AMB);
    });
  }

  // ---------------- act 5: power ring + shouting rings
  const pwO = inOut(t, 22.8, 25.62, 0.38, 0.3, E.outCubic);
  if (show(pwrG, pwO)) {
    pwrG.setAttribute('transform', `translate(${phX.toFixed(1)} ${phY.toFixed(1)}) rotate(${(-90 + (1 - pwO) * -40).toFixed(2)}) scale(${lerp(0.9, 1, pwO).toFixed(4)})`);
    const v = kf(t, [[23.0, 8], [23.7, 35], [24.2, 62], [24.71, 100, E.outExpo]]);
    pwrArc.setAttribute('stroke-dasharray', `${(pwO * v).toFixed(2)} 100`);
    pwrArc.setAttribute('stroke', v > 60 ? AMB : INK);
    pwrTicks.forEach((l, i) => {
      const a = (i / 72) * TAU, on = clamp(pwO * 72 - i), r1 = 380, r2 = 380 + (i % 6 ? 10 : 20) * on;
      l.setAttribute('x1', Math.cos(a) * r1); l.setAttribute('y1', Math.sin(a) * r1); l.setAttribute('x2', Math.cos(a) * r2); l.setAttribute('y2', Math.sin(a) * r2);
      l.setAttribute('opacity', on);
      l.setAttribute('stroke', i / 72 * 100 < v ? 'rgba(224,131,42,.9)' : 'rgba(20,19,18,.35)');
    });
  }
  const shO2 = inOut(t, 24.71, 25.65, 0.05, 0.3);
  if (show(shoutG, shO2)) shouts.forEach((r, i) => {
    const u = ((t - 24.71) * 2.2 + i / shouts.length) % 1;
    r.setAttribute('cx', phX); r.setAttribute('cy', phY); r.setAttribute('r', (330 + u * 420).toFixed(1));
    r.setAttribute('opacity', ((1 - u) * 0.9).toFixed(3)); r.setAttribute('stroke-width', (9 - 6 * u).toFixed(2));
  });

  // ---------------- act 6: noise -> headset, buzz waveform
  const hO = inOut(t, 26.3, 30.15, 0.3, 0.35, E.outCubic);
  if (show(hsG, hO)) {
    const draw = prog(t, 26.6, 27.3, E.outCubic);
    const buzzing = t > 28.14 && t < 29.4 && Math.floor((t - 28.14) / 0.08) % 3 !== 2;
    const jx = buzzing ? (hash(Math.floor(t * 60)) - 0.5) * 10 : 0, jy = buzzing ? (hash(Math.floor(t * 60) + 99) - 0.5) * 6 : 0;
    hsG.setAttribute('transform', `translate(${(HS.x + jx).toFixed(1)} ${(HS.y + fl + jy).toFixed(1)}) scale(${lerp(0.9, 1, draw).toFixed(4)})`);
    hsPaths.forEach((p, i) => p.setAttribute('stroke-dashoffset', (1 - clamp(draw * 1.4 - i * 0.1)).toFixed(4)));
    hsMic.setAttribute('opacity', draw);
    const hear = prog(t, 29.69, 30.0, E.outCubic);
    hsSound.forEach((p, i) => {
      const k = i % 3;
      const on = Math.max(buzzing ? 1 : 0, hear) * (0.5 + 0.5 * Math.sin(t * 14 - k * 1.2));
      p.setAttribute('opacity', (on * clamp((t - 28.1) * 5)).toFixed(3));
    });
  }
  const nO = inOut(t, 26.43, 28.2, 0.1, 0.4);
  if (show(noisePath, nO)) {
    const a = [phX + 70, phY - 40], b = [HS.x - 220, HS.y + 60];
    const L = prog(t, 26.43, 27.0, E.outCubic);
    let d = '';
    for (let k = 0; k <= 40; k++) {
      const u = (k / 40) * L, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u) + Math.sin(u * 22 - t * 14) * 22 * Math.sin(Math.PI * u);
      d += `${k ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
    }
    noisePath.setAttribute('d', d);
  }
  const wO = inOut(t, 27.9, 30.15, 0.25, 0.35);
  if (show(waveG, wO)) {
    let d = '';
    for (let k = 0; k <= 168; k++) {
      const x = 120 + k * 5, ph = (x - 120) / 840;
      const tt = t - ph * 0.25;
      const burst = (tt > 28.14 && tt < 29.4 && Math.floor((tt - 28.14) / 0.08) % 3 !== 2) ? 1 : 0;
      const amp = burst ? 46 * (0.6 + 0.4 * hash(k * 3 + Math.floor(t * 30))) : 6 * Math.sin(k * 0.9 + t * 9);
      d += `${k ? 'L' : 'M'}${x},${(1380 + (k % 2 ? amp : -amp)).toFixed(1)}`;
    }
    wave.setAttribute('d', d);
    waveBase.setAttribute('opacity', 1);
  }

  // ---------------- act 7: top-down plane, seats light up, rain floods towers
  const tO = inOut(t, 30.3, 34.85, 0.4, 0.35, E.outCubic);
  if (show(topG, tO)) {
    const up = prog(t, 32.47, 33.0, E.inOutCubic);
    const ty = lerp(1000, 850, up) + fl, sc = lerp(1.18, 0.95, up);
    topG.setAttribute('transform', `translate(540 ${ty.toFixed(1)}) scale(${(sc * lerp(0.92, 1, tO)).toFixed(4)})`);
    const draw = prog(t, 30.3, 31.0, E.outCubic);
    topPaths.forEach((p, i) => p.setAttribute('stroke-dashoffset', (1 - clamp(draw * 1.3 - i * 0.06)).toFixed(4)));
    const lit = prog(t, 31.47, 32.2, E.linear);
    SEATS.forEach(s => { const on = lit > s.d; s.el.setAttribute('fill', on ? AMB : 'rgba(20,19,18,.3)'); s.el.setAttribute('r', on ? 4.4 : 3.2); s.el.setAttribute('opacity', clamp(draw * 2 - 0.6)); });
  }
  const ntO = inOut(t, 32.47, 34.85, 0.4, 0.35, E.outCubic);
  if (show(netG, ntO)) {
    const ny = 1460 + (1 - prog(t, 32.47, 32.9, E.outExpo)) * 60;
    netG.setAttribute('transform', `translate(0 ${ny})`);
    const flood = prog(t, 32.75, 33.6, E.outCubic);
    NT.forEach((x, i) => {
      const shake = flood > 0.9 ? Math.sin(t * 60 + i) * 3 : 0;
      setTower(nTowers[i], x + shake, 0, 1, prog(t, 32.5 + i * 0.07, 33.0 + i * 0.07), flood > 0.9 ? 0.5 + 0.5 * Math.sin(t * 16 + i) : 0);
      const L = nLoads[i]; L.g.setAttribute('transform', `translate(${x + shake} 0)`);
      const lv = clamp(flood * (0.92 + 0.08 * hash(i)) + 0.03 * Math.sin(t * 9 + i));
      L.fill.setAttribute('height', (144 * lv).toFixed(1)); L.fill.setAttribute('y', (-3 - 144 * lv).toFixed(1));
      L.fill.setAttribute('fill', lv > 0.8 ? AMB : INK);
    });
  }
  const raO = inOut(t, 32.6, 34.7, 0.3, 0.4);
  if (show(rainG, raO)) rain.forEach(r => {
    const u = ((t * r.sp + r.ph) % 1);
    const x0 = 540 + r.x0 * 0.95, y0 = 840, x1 = NT[r.tgt], y1 = 1460 - 190;
    r.el.setAttribute('cx', lerp(x0, x1, u).toFixed(1)); r.el.setAttribute('cy', lerp(y0, y1, E.inQuad(u)).toFixed(1));
    r.el.setAttribute('opacity', (Math.sin(Math.PI * u)).toFixed(3));
  });

  // ---------------- act 8: whisper rings + 1 metre gap
  const whO = inOut(t, 41.3, 43.0, 0.2, 0.35);
  if (show(whG, whO)) whispers.forEach((r, i) => {
    const u = ((t - 41.3) * 0.9 + i / whispers.length) % 1;
    r.setAttribute('cx', phX); r.setAttribute('cy', phY); r.setAttribute('r', (175 + u * 70).toFixed(1));
    r.setAttribute('opacity', ((1 - u) * 0.8).toFixed(3));
  });
  const gpO = inOut(t, 40.2, 43.0, 0.35, 0.3, E.outCubic);
  if (show(gapG, gpO) && pico.visible) {
    const [qx] = project(pico, [0, 0, 0]);
    const y = 1365 + fl, ax = phX, bx = qx;
    const L = prog(t, 40.25, 40.7, E.outCubic);
    gapLine.setAttribute('x1', ax); gapLine.setAttribute('x2', lerp(ax, bx, L)); gapLine.setAttribute('y1', y); gapLine.setAttribute('y2', y);
    gapEnds[0].setAttribute('x1', ax); gapEnds[0].setAttribute('x2', ax); gapEnds[0].setAttribute('y1', y - 14); gapEnds[0].setAttribute('y2', y + 14);
    gapEnds[1].setAttribute('x1', bx); gapEnds[1].setAttribute('x2', bx); gapEnds[1].setAttribute('y1', y - 14); gapEnds[1].setAttribute('y2', y + 14);
    gapEnds[1].setAttribute('opacity', L > 0.95 ? 1 : 0);
    gapLbl.setAttribute('x', (ax + bx) / 2); gapLbl.setAttribute('y', y + 50); gapLbl.setAttribute('opacity', prog(t, 40.5, 40.8));
  }

  // ---------------- act 9: phone above, tower below, distance
  const dO = inOut(t, 43.2, 46.2, 0.35, 0.35, E.outCubic);
  if (show(distG, dO)) {
    const base = 1470;
    setTower(distTower, 540, base, 1, prog(t, 43.3, 43.9, E.outCubic), 0.5 + 0.5 * Math.sin(t * 7));
    const top = 950 + fl, bot = base - 240 - 50;
    const L = prog(t, 44.89, 45.5, E.outCubic);
    distLine.setAttribute('y1', top); distLine.setAttribute('y2', lerp(top, bot, L));
    distLine.setAttribute('transform', 'translate(540 0)');
    distHeads[0].setAttribute('transform', `translate(540 ${top}) `); distHeads[0].setAttribute('opacity', L > 0.02 ? 1 : 0);
    distHeads[1].setAttribute('transform', `translate(540 ${lerp(top, bot, L)}) rotate(180)`); distHeads[1].setAttribute('opacity', L > 0.95 ? 1 : 0);
  }

  // ---------------- act 11: screaming rings + towers out of reach
  const scO = inOut(t, 55.81, 56.4, 0.05, 0.25);
  if (show(scream, scO)) {
    const [cx, cy] = project(planeBody, [0.45, 0, 0.125]);
    screams.forEach((r, i) => {
      const u = ((t - 55.81) * 2.6 + i / screams.length) % 1;
      r.setAttribute('cx', cx); r.setAttribute('cy', cy); r.setAttribute('r', (60 + u * 420).toFixed(1));
      r.setAttribute('opacity', ((1 - u) * 0.9).toFixed(3));
    });
  }
  const eO = inOut(t, 56.3, 99, 0.4, 0.3, E.outCubic);
  if (show(endG, eO)) {
    const ey = 1470 + (1 - prog(t, 56.3, 56.8, E.outExpo)) * 50;
    endG.setAttribute('transform', `translate(0 ${ey})`);
    endGround.setAttribute('stroke-dashoffset', 1 - prog(t, 56.3, 56.8, E.outCubic));
    ET.forEach((x, i) => setTower(eTowers[i], x, 0, 1, prog(t, 56.4 + i * 0.06, 56.9 + i * 0.06, E.outCubic), 0));
  }
  const reO = inOut(t, 56.95, 99, 0.2, 0.3);
  if (show(reachG, reO)) {
    const [sx, sy] = project(planeBody, [0.0, -0.12, 0]);
    ET.forEach((x, i) => {
      const a = 56.95 + i * 0.05, L = prog(t, a, a + 0.45, E.outCubic);
      const stop = 0.42 + 0.08 * Math.sin(i * 2.3);   // never gets there
      const ex = lerp(sx, x, stop * L), ey2 = lerp(sy + 40, 1470 - 180, stop * L);
      reaches[i].setAttribute('x1', sx); reaches[i].setAttribute('y1', sy + 40); reaches[i].setAttribute('x2', ex); reaches[i].setAttribute('y2', ey2);
      reaches[i].setAttribute('stroke-dashoffset', (-t * 50).toFixed(1));
      const xm = prog(t, 57.19 + i * 0.05, 57.45 + i * 0.05, E.outBack);
      reachX[i].setAttribute('transform', `translate(${ex.toFixed(1)} ${ey2.toFixed(1)}) scale(${xm.toFixed(3)})`);
    });
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
      if (r.words) d.textContent = r.words[m] ?? ''; else d.textContent = m < 0 ? '' : r.fmt(m);
      const dir = r.up ? m - v : v - m;
      d.style.transform = `translateY(${(dir * 150).toFixed(1)}px)`;
      d.style.filter = speed > 1 ? `blur(${Math.min(r.words ? 8 : 2, speed * (r.words ? 2 : 0.05)).toFixed(1)}px)` : 'none';
      const amb = (r.amberAbove !== undefined && v > r.amberAbove && Math.round(v) === m) || (r.words && m === r.amberWord && Math.abs(v - m) < 0.5);
      d.style.color = amb ? AMB : INK;
    });
  });

  // ---------------- grain
  const RG = rng(Math.floor(t * 60) + 11);
  $('grain').style.backgroundPosition = `${Math.floor(RG() * 256)}px ${Math.floor(RG() * 256)}px`;
}

// =====================================================================================
// LAYOUT CHECK: object boxes vs text boxes (used by the overlap scan before rendering)
// =====================================================================================
const _box = new THREE.Box3(), _c = new THREE.Vector3();
function screenBox(obj) {
  _box.setFromObject(obj, true); if (_box.isEmpty()) return null;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i < 8; i++) {
    _c.set(i & 1 ? _box.max.x : _box.min.x, i & 2 ? _box.max.y : _box.min.y, i & 4 ? _box.max.z : _box.min.z).project(camera);
    const x = (_c.x + 1) / 2 * W, y = (1 - _c.y) / 2 * H; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  return [x0, y0, x1, y1];
}
window.layoutCheck = t => {
  renderAt(t);
  const objs = [];
  if (phone.visible) objs.push(['phone', screenBox(phone)]);
  if (plane.visible) objs.push(['plane', screenBox(planeBody)]);
  if (pico.visible) objs.push(['pico', screenBox(pico)]);
  [['ui', $('ui')], ['back', $('backsvg')]].forEach(([n, root]) => [...root.children].forEach((g, i) => {
    if (g.tagName === 'defs' || g.style.display === 'none' || +(g.style.opacity || 1) < 0.05) return;
    if (g === ringsG || g === shoutG || g === scream || g === streakG) return; // full-bleed effects, clipped below the text zone
    const r = g.getBoundingClientRect(); if (r.width * r.height > 0) objs.push([n + i, [r.left, r.top, r.right, r.bottom]]);
  }));
  const text = [];
  document.querySelectorAll('.kicker, .big').forEach(el => {
    if (el.style.display === 'none') return;
    [...el.querySelectorAll('span')].forEach(s => { if (s.style.visibility !== 'hidden' && +s.style.opacity > 0.1) { const r = s.getBoundingClientRect(); text.push([r.left, r.top + r.height * 0.12, r.right, r.bottom - r.height * 0.08]); } });
  });
  document.querySelectorAll('.readout').forEach(el => { if (el.style.display !== 'none' && +el.style.opacity > 0.1) { const r = el.getBoundingClientRect(); text.push([r.left + 200, r.top + 10, r.right - 200, r.bottom - 20]); } });
  return { objs, text };
};

window.READY = (async () => {
  await document.fonts.load('italic 500 100px Playfair');
  await document.fonts.load('600 100px "Inter Display"');
  await document.fonts.load('700 30px Inter');
  buildScreen(); buildPlane();
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
