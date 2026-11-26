// "Why your $1,199 iPhone only costs $450 to make": house style from battery-ageing.
// Every visual is a pure function of t (seconds), keyed to word times force-aligned from the voiceover (words.txt).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const { clamp, lerp, E, prog, rng, mix, kf } = window.Anim;
const $ = id => document.getElementById(id);
const W = 1080, H = 1920, SVGNS = 'http://www.w3.org/2000/svg', TAU = Math.PI * 2, PI = Math.PI;
const DUR = 60.15;

// =====================================================================================
// TYPE PLAN
// =====================================================================================
const K = (out, ...words) => ({ words, out });
const KICKERS = [
  K(3.88, ['This', 0.0], ['iPhone', 0.27], ['costs', 0.75]),
  K(5.12, ['The', 3.97], ['parts', 4.05]),
  K(6.95, ['About', 5.18]),
  K(10.6, ['So', 7.26], ['where', 7.51], ['does', 7.87], ['the', 8.02], ['other', 8.18]),
  K(11.88, ["Let's", 10.66], ['take', 10.84], ['it', 11.03]),
  K(14.3, ['The', 11.93], ['most', 12.02], ['expensive', 12.27], ['part', 12.88], ['is', 13.28], ['the', 13.43]),
  K(17.65, ['The', 14.37], ['A19 Pro', 14.5], ['costs', 15.38], ['Apple', 15.75], ['about', 16.12]),
  K(19.95, ['Next', 17.75], ['come', 18.12], ['the', 18.3]),
  K(22.7, ['Memory', 20.05], ['and', 20.42], ['storage', 20.52], ['cost', 21.04], ['around', 21.39]),
  K(25.4, ['The', 22.76], ['aluminium', 22.93], ['body', 23.44], ['costs', 23.76]),
  K(27.75, ['And', 25.46], ['the', 25.55], ['battery?', 25.61], ['About', 26.36]),
  K(29.15, ['Add', 27.81], ['assembly', 28.07], ['and', 28.57]),
  K(31.65, ['and', 29.21], ["you're", 29.34], ['at', 29.49], ['roughly', 29.55]),
  K(33.55, ['But', 31.82], ["that's", 31.99], ['not', 32.25], ['the', 32.41]),
  K(36.02, ['Apple', 33.65], ['spends', 34.01], ['over', 34.42]),
  K(37.7, ['a', 36.11], ['year', 36.15]),
  K(42.3, ['Then', 37.77], ["there's", 37.99]),
  K(43.92, ['Even', 42.45], ['after', 42.69], ['making', 42.98]),
  K(45.8, ['Apple', 43.96], ['keeps', 44.35], ['about', 44.63]),
  K(47.18, ['of', 45.86], ['every', 46.08]),
  K(49.6, ['But', 47.25], ['the', 47.38], ['phone', 47.45], ["isn't", 47.82], ['where', 48.1], ['the', 48.28]),
  K(54.5, ['keep', 52.87], ['about', 53.11]),
  K(55.92, ['of', 54.57], ['every', 54.72]),
  K(57.52, ['You', 56.01], ["didn't", 56.09], ['just', 56.27], ['buy', 56.48], ['a', 56.71]),
  K(99, ['You', 57.58], ['bought', 57.69], ['a', 57.87]),
];
const B = (text, at, out, o = {}) => ({ text, at, out, acc: 99, ...o });
const AMBER = { acc: 0 };
const BIGS = [
  B('$1,199.', 1.14, 3.88), B('inside it?', 4.34, 5.12), B('$450.', 5.54, 6.95, AMBER),
  B('$750', 8.47, 9.8, AMBER), B('go?', 9.84, 10.6), B('apart.', 11.1, 11.88),
  B('chip.', 13.52, 14.3), B('A19 Pro', 14.5, 15.32), B('$90.', 16.35, 17.65, AMBER),
  B('screen', 18.37, 18.95), B('cameras.', 19.04, 19.95), B('storage', 20.52, 20.98), B('$40.', 21.61, 22.7, AMBER),
  B('body', 23.44, 24.08), B('$21.', 24.13, 25.4, AMBER), B('battery?', 25.61, 26.3),
  B('$4.', 26.66, 27.75, { huge: true, ...AMBER }), B('assembly', 28.07, 28.5), B('testing,', 28.67, 29.15),
  B('$450.', 29.92, 31.65, AMBER), B('real cost.', 32.49, 33.55, { acc: 5 }), B('$30 billion', 34.64, 36.02, AMBER),
  B('designing', 36.54, 37.05), B('these.', 37.08, 37.7),
  B('shipping,', 38.13, 38.78), B('marketing,', 38.82, 39.5), B("store's cut,", 39.54, 40.68), B('free updates.', 40.95, 42.3),
  B('the phone,', 43.38, 43.92), B('36¢', 44.84, 45.8, { huge: true, ...AMBER }), B('dollar.', 46.43, 47.18),
  B('big money.', 48.37, 49.6, { acc: 4 }),
  B('iCloud,', 49.67, 50.38), B('App Store,', 50.43, 51.02), B('Apple Music', 51.07, 51.84), B('Apple Pay', 52.13, 52.84),
  B('75¢', 53.39, 54.5, { huge: true, ...AMBER }), B('dollar.', 55.1, 55.92),
  B('phone.', 56.75, 57.52, { strike: 57.12 }), B('ticket', 57.93, 58.42), B('into Apple.', 58.47, 99, { huge: true, ...AMBER }),
];

// =====================================================================================
// ROLLING READOUTS
// =====================================================================================
const usd = n => '$' + n.toLocaleString('en-US');
const ROLLS = [
  { label: 'IPHONE 17 PRO MAX · PRICE', show: [1.1, 3.95], v: t => kf(t, [[1.14, 0], [2.95, 1199, E.outCubic]]), fmt: usd, up: true, maxBlur: 2 },
  { label: 'COST OF THE PARTS', show: [5.35, 7.15], v: t => kf(t, [[5.54, 1199], [6.35, 450, E.outCubic]]), fmt: usd, maxBlur: 2, amber: v => v < 451 },
  { label: 'A19 PRO CHIP', show: [16.2, 17.65], v: t => kf(t, [[16.35, 0], [16.95, 90, E.outCubic]]), fmt: usd, up: true },
  { label: 'MEMORY + STORAGE', show: [21.45, 22.7], v: t => kf(t, [[21.61, 0], [22.15, 40, E.outCubic]]), fmt: usd, up: true },
  { label: 'ALUMINIUM BODY', show: [23.95, 25.4], v: t => kf(t, [[24.13, 0], [24.6, 21, E.outCubic]]), fmt: usd, up: true },
  { label: 'BATTERY', show: [26.5, 27.75], v: t => kf(t, [[26.66, 0], [27.0, 4, E.outCubic]]), fmt: usd, up: true, amber: v => v > 3.5 },
  { label: 'TOTAL TO BUILD', show: [29.75, 31.65], v: t => kf(t, [[29.92, 0], [30.75, 450, E.outCubic]]), fmt: usd, up: true, maxBlur: 2, amber: v => v > 449 },
  { label: 'R&D · EVERY YEAR', show: [34.5, 36.05], v: t => kf(t, [[34.64, 0], [35.3, 30, E.outCubic]]), fmt: n => '$' + n + 'B+', up: true },
  { label: 'HARDWARE · KEPT PER $1', show: [44.7, 47.15], v: t => kf(t, [[44.84, 0], [45.5, 36, E.outCubic]]), fmt: n => n + '¢', up: true },
  { label: 'SERVICES · KEPT PER $1', show: [53.25, 55.95], v: t => kf(t, [[53.39, 36], [54.15, 75, E.outCubic]]), fmt: n => n + '¢', up: true, amber: v => v > 74 },
];

// =====================================================================================
// SFX
// =====================================================================================
const SFX = [];
const sfx = (at, name, vol) => SFX.push({ at: +Math.max(0, at).toFixed(3), name, vol });
BIGS.forEach((b, i) => sfx(b.at - 0.02, i % 2 ? 'click' : 'pop', 0.3));
[[0.0, 'whoosh-fast', 0.45], [4.05, 'whoosh-fast', 0.4], [4.34, 'whoosh-soft', 0.3], [6.95, 'whoosh-fast', 0.38], [7.55, 'whoosh-soft', 0.3],
 [8.47, 'impact-soft', 0.4], [9.84, 'tick', 0.35], [10.62, 'whoosh-low', 0.4], [11.08, 'impact', 0.5], [13.5, 'whoosh-soft', 0.35],
 [14.5, 'whoosh-soft', 0.25], [18.3, 'whoosh-fast', 0.35], [19.0, 'whoosh-fast', 0.35], [20.05, 'whoosh-soft', 0.3], [20.52, 'whoosh-soft', 0.25],
 [22.8, 'whoosh-fast', 0.35], [25.55, 'whoosh-fast', 0.35], [26.64, 'impact-soft', 0.55], [28.05, 'whoosh-low', 0.45], [28.62, 'impact-soft', 0.4],
 [28.7, 'tick', 0.35], [29.9, 'impact-soft', 0.35], [31.85, 'whoosh-low', 0.4], [33.65, 'whoosh-soft', 0.3], [36.5, 'whoosh-soft', 0.35],
 [37.08, 'whoosh-fast', 0.3], [38.1, 'whoosh-fast', 0.35], [38.8, 'whoosh-soft', 0.25], [39.5, 'whoosh-soft', 0.25], [40.95, 'whoosh-soft', 0.25],
 [42.35, 'whoosh-fast', 0.38], [43.95, 'whoosh-low', 0.4], [44.48, 'impact-soft', 0.45], [47.2, 'whoosh-fast', 0.38], [48.36, 'impact-soft', 0.35],
 [52.9, 'whoosh-low', 0.4], [53.37, 'impact-soft', 0.45], [56.0, 'whoosh-fast', 0.38], [57.12, 'whoosh-soft', 0.3], [57.6, 'whoosh-fast', 0.42],
 [57.9, 'impact-soft', 0.4], [58.45, 'impact', 0.5]].forEach(a => sfx(...a));
ROLLS.forEach(r => { let last = null, lt = -1; for (let t = r.show[0]; t <= r.show[1]; t += 1 / 240) { const n = Math.round(r.v(t)); if (last !== null && n !== last && t - lt > 0.07) { sfx(t, 'tick', 0.2); lt = t; } last = n; } });
[49.67, 50.43, 51.07, 52.13].forEach(a => sfx(a + 0.02, 'pop', 0.25));

window.VIDEO = { width: W, height: H, fps: 60, duration: DUR, bitrate: '25M', maxrate: '25M', audio: 'voiceover.mp3', audioStart: 0, sfx: SFX };

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
  const r = makeSpans($('front'), b.huge ? 'big huge' : 'big', [...b.text]);
  r.spans.forEach((s, i) => { if (i >= b.acc) s.classList.add('acc'); });
  if (b.strike) { r.strike = document.createElement('div'); r.strike.className = 'strike'; r.el.appendChild(r.strike); }
  return { ...b, ...r };
});
function fitBigs() {
  bigs.forEach(b => {
    const base = parseFloat(getComputedStyle(b.el).fontSize);
    let w = 0; b.spans.forEach(s => (w += s.getBoundingClientRect().width));
    const max = b.huge ? 980 : 960;
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
function matsOf(group) { const s = new Set(); group.traverse(o => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => s.add(m)); }); return [...s]; }

// ---------------------------------------------------------------- phone (exploded-view rig)
const PW = 0.78, PH = 1.64;
const phone = new THREE.Group(); scene.add(phone);
const L = {}; // layers: disp, board, batt, cam, body
['disp', 'board', 'batt', 'cam', 'body'].forEach(k => { L[k] = { g: new THREE.Group() }; phone.add(L[k].g); });
const silver = () => new THREE.MeshPhysicalMaterial({ color: 0xcfc8bd, metalness: 0.9, roughness: 0.28, clearcoat: 0.4 });
const backMat = () => new THREE.MeshPhysicalMaterial({ color: 0xddd6cb, metalness: 0.55, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3 });
let chip, mem, sto, chipMat, memMat, stoMat, screenTex;
{
  // body: aluminium unibody = frame ring + back + full-width camera plateau
  const b = L.body.g;
  const ring = rr(PW, PH, 0.13); ring.holes.push(rr(PW - 0.05, PH - 0.05, 0.105));
  b.add(slab(ring, 0.078, -0.039, silver(), 0.006));
  b.add(slab(rr(PW - 0.04, PH - 0.04, 0.11), 0.01, -0.042, backMat(), 0.002));
  const plat = new THREE.Mesh(new RoundedBoxGeometry(PW - 0.06, 0.4, 0.03, 4, 0.012), silver());
  plat.position.set(0, 0.56, -0.05); b.add(plat);
  // camera module: three lenses + flash + LiDAR, sits in the plateau
  const c = L.cam.g;
  const ringM = new THREE.MeshPhysicalMaterial({ color: 0x9d968c, metalness: 1, roughness: 0.25 });
  const lensM = new THREE.MeshPhysicalMaterial({ color: 0x07080a, metalness: 0.3, roughness: 0.05, clearcoat: 1 });
  const carrier = new THREE.Mesh(new RoundedBoxGeometry(0.36, 0.34, 0.02, 3, 0.03), new THREE.MeshStandardMaterial({ color: 0x2b2c2f, metalness: 0.5, roughness: 0.5 }));
  carrier.position.set(-0.17, 0.6, -0.055); c.add(carrier);
  [[-0.25, 0.69], [-0.25, 0.51], [-0.1, 0.6]].forEach(([x, y]) => {
    const r1 = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.03, 48), ringM); r1.rotation.x = PI / 2; r1.position.set(x, y, -0.072); c.add(r1);
    const r2 = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.034, 48), lensM); r2.rotation.x = PI / 2; r2.position.set(x, y, -0.074); c.add(r2);
  });
  [[0.25, 0.68, 0.032], [0.25, 0.53, 0.028]].forEach(([x, y, r]) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.03, 32), new THREE.MeshStandardMaterial({ color: 0xf1e8d6, roughness: 0.3, emissive: 0x332211 }));
    m.rotation.x = PI / 2; m.position.set(x, y, -0.07); c.add(m);
  });
  // logic board with A19 Pro, memory and storage
  const bd = L.board.g;
  const pcb = new THREE.Mesh(new RoundedBoxGeometry(0.66, 0.42, 0.018, 3, 0.008), new THREE.MeshStandardMaterial({ color: 0x23302a, metalness: 0.35, roughness: 0.55 }));
  pcb.position.set(0, 0.5, 0); bd.add(pcb);
  const R = rng(5);
  for (let i = 0; i < 26; i++) {
    const w = 0.015 + R() * 0.04, h = 0.012 + R() * 0.03, x = -0.3 + R() * 0.6, y = 0.32 + R() * 0.36;
    if (Math.abs(x - 0.02) < 0.13 && Math.abs(y - 0.5) < 0.12) continue;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.01), new THREE.MeshStandardMaterial({ color: R() > 0.5 ? 0x8d8a85 : 0x1a1a1b, metalness: 0.6, roughness: 0.4 }));
    m.position.set(x, y, 0.012); bd.add(m);
  }
  const chipTex = canvasTex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#c9c6c0'); gr.addColorStop(1, '#8f8c87');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1c1b1a'; g.textAlign = 'center'; g.font = '700 64px "Inter Display"'; g.fillText('A19', w / 2, 128);
    g.font = '700 30px Inter'; g.letterSpacing = '8px'; g.fillText('PRO', w / 2 + 4, 176);
  });
  chipMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: chipTex, metalness: 0.7, roughness: 0.3, emissive: 0xe0832a, emissiveIntensity: 0 });
  const sideM = new THREE.MeshStandardMaterial({ color: 0x77736d, metalness: 0.8, roughness: 0.3 });
  chip = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.17, 0.02), [sideM, sideM, sideM, sideM, chipMat, sideM]);
  chip.position.set(0.02, 0.5, 0.02); bd.add(chip);
  const darkChip = label => canvasTex(256, 192, (g, w, h) => {
    g.fillStyle = '#1d1d1f'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,255,.55)'; g.textAlign = 'center';
    g.font = '700 26px Inter'; g.letterSpacing = '6px'; g.fillText(label, w / 2 + 3, h / 2 + 10);
  });
  memMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: darkChip('RAM'), roughness: 0.45, emissive: 0xe0832a, emissiveIntensity: 0 });
  stoMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: darkChip('NAND'), roughness: 0.45, emissive: 0xe0832a, emissiveIntensity: 0 });
  const dside = new THREE.MeshStandardMaterial({ color: 0x151516, roughness: 0.5 });
  mem = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.016), [dside, dside, dside, dside, memMat, dside]); mem.position.set(-0.2, 0.6, 0.018); bd.add(mem);
  sto = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.016), [dside, dside, dside, dside, stoMat, dside]); sto.position.set(0.22, 0.4, 0.018); bd.add(sto);
  // battery
  const bt = L.batt.g;
  const battMat = new THREE.MeshPhysicalMaterial({ color: 0x232325, metalness: 0.3, roughness: 0.42, clearcoat: 0.6, emissive: 0xe0832a, emissiveIntensity: 0 });
  const bm = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.92, 0.036, 4, 0.016), battMat); bm.position.set(0, -0.28, 0); bt.add(bm);
  const labTex = canvasTex(560, 830, (g, w, h) => {
    g.fillStyle = '#1e1e20'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; rrect(g, 30, 30, w - 60, h - 60, 18); g.stroke();
    g.fillStyle = '#e0832a'; g.font = 'italic 500 170px Playfair'; g.textAlign = 'center'; g.fillText('Li-ion', w / 2, 360);
    g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '700 22px Inter'; g.letterSpacing = '6px'; g.fillText('RECHARGEABLE CELL', w / 2, 430);
    g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(70, 560 + i * 30); g.lineTo(w - 70 - (i % 3) * 90, 560 + i * 30); g.stroke(); }
  });
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.84), new THREE.MeshStandardMaterial({ map: labTex, roughness: 0.55, metalness: 0.1 }));
  lab.position.set(0, -0.28, 0.0185); bt.add(lab);
  L.batt.glow = battMat;
}
function buildScreen() {
  screenTex = canvasTex(512, 1080, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2a1f17'); gr.addColorStop(1, '#070707');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const rg = g.createRadialGradient(256, 780, 0, 256, 780, 560); rg.addColorStop(0, 'rgba(224,131,42,.62)'); rg.addColorStop(1, 'rgba(224,131,42,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
    g.textAlign = 'center';
    g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '500 26px Inter'; g.fillText('Thursday 26 November', 256, 150);
    g.fillStyle = '#fff'; g.font = '600 156px "Inter Display"'; g.fillText('9:41', 256, 300);
    g.fillStyle = 'rgba(255,255,255,.2)'; rrect(g, 180, 1030, 152, 8, 4); g.fill();
    g.fillStyle = '#000'; rrect(g, 196, 30, 120, 36, 18); g.fill();
  });
  const d = L.disp.g;
  d.add(slab(rr(PW - 0.02, PH - 0.02, 0.12), 0.007, 0.034, new THREE.MeshPhysicalMaterial({ color: 0x060606, metalness: 0, roughness: 0.04, clearcoat: 1 }), 0.002));
  const sw = PW - 0.07, sh = PH - 0.07;
  const sg = planeUV(new THREE.ShapeGeometry(rr(sw, sh, 0.1), 24), sw, sh);
  const scr = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false, transparent: true }));
  scr.position.z = 0.0435; d.add(scr);
}
const LZ = { disp: 0.85, board: 0.38, batt: -0.02, cam: -0.42, body: -0.85 };

// blueprint edges (R&D beat)
const bpMat = new THREE.LineBasicMaterial({ color: 0x141312, transparent: true, opacity: 0 });
function addEdges(group) { group.traverse(o => { if (o.isMesh && !o.userData.noEdge) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 12), bpMat); e.userData.noEdge = true; o.add(e); } }); }

// ---------------------------------------------------------------- coin
const coin = new THREE.Group(); scene.add(coin);
{
  const face = canvasTex(512, 512, (g, w, h) => {
    const gr = g.createRadialGradient(200, 180, 20, 256, 256, 300); gr.addColorStop(0, '#f6d29a'); gr.addColorStop(0.6, '#e2a456'); gr.addColorStop(1, '#b8752f');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(90,50,15,.45)'; g.lineWidth = 6; g.beginPath(); g.arc(256, 256, 222, 0, TAU); g.stroke();
    g.lineWidth = 2; g.beginPath(); g.arc(256, 256, 206, 0, TAU); g.stroke();
    g.fillStyle = 'rgba(80,42,10,.85)'; g.textAlign = 'center'; g.font = 'italic 500 230px Playfair'; g.fillText('$1', 248, 320);
    g.font = '700 24px Inter'; g.letterSpacing = '9px'; g.fillText('ONE DOLLAR', 260, 395);
  });
  const faceM = new THREE.MeshPhysicalMaterial({ map: face, metalness: 0.75, roughness: 0.32, clearcoat: 0.3 });
  const edgeM = new THREE.MeshPhysicalMaterial({ color: 0xd59a52, metalness: 0.9, roughness: 0.35 });
  const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.07, 120, 1); geo.rotateX(PI / 2); geo.rotateZ(PI / 2);
  const m = new THREE.Mesh(geo, [edgeM, faceM, faceM]); coin.add(m);
}

// ---------------------------------------------------------------- ticket
const ticket = new THREE.Group(); scene.add(ticket);
{
  const w = 0.82, h = 1.5, r = 0.07, n = 0.07, ny = -0.4;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, ny - n); s.absarc(w / 2, ny, n, -PI / 2, PI / 2, true);
  s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, ny + n); s.absarc(-w / 2, ny, n, PI / 2, -PI / 2, true); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const paper = new THREE.MeshPhysicalMaterial({ color: 0xf2e9d8, roughness: 0.75, metalness: 0, clearcoat: 0.2 });
  ticket.add(slab(s, 0.02, -0.01, paper, 0.004));
  const tex = canvasTex(574, 1050, (g, W2, H2) => {
    g.fillStyle = '#f4ecdc'; g.fillRect(0, 0, W2, H2);
    g.fillStyle = '#e0832a'; g.fillRect(0, 0, W2, 210);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '700 34px Inter'; g.letterSpacing = '14px'; g.fillText('ADMIT ONE', W2 / 2 + 7, 125);
    g.letterSpacing = '0px'; g.fillStyle = '#141312'; g.font = 'italic 500 168px Playfair'; g.fillText('Apple', W2 / 2, 420);
    g.font = '700 24px Inter'; g.letterSpacing = '8px'; g.fillStyle = 'rgba(20,19,18,.6)'; g.fillText('THE ECOSYSTEM', W2 / 2 + 4, 488);
    g.fillText('VALID FOR LIFE', W2 / 2 + 4, 530);
    g.strokeStyle = 'rgba(20,19,18,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(70, 590); g.lineTo(W2 - 70, 590); g.stroke();
    g.fillStyle = '#141312'; g.font = '700 22px Inter'; g.letterSpacing = '6px'; g.textAlign = 'left'; g.fillText('ICLOUD · MUSIC', 70, 640); g.fillText('APP STORE · PAY', 70, 680);
    g.textAlign = 'right'; g.fillStyle = '#e0832a'; g.font = 'italic 500 64px Playfair'; g.letterSpacing = '0px'; g.fillText('75¢', W2 - 70, 682);
    g.setLineDash([14, 12]); g.strokeStyle = 'rgba(20,19,18,.45)'; g.lineWidth = 4; g.beginPath(); g.moveTo(40, 762); g.lineTo(W2 - 40, 762); g.stroke(); g.setLineDash([]);
    const RB = rng(9); let x = 90; g.fillStyle = '#141312';
    while (x < W2 - 90) { const bw = 3 + Math.floor(RB() * 4) * 3; g.fillRect(x, 830, bw, 120); x += bw + 4 + Math.floor(RB() * 3) * 3; }
    g.textAlign = 'center'; g.font = '600 22px Inter'; g.letterSpacing = '8px'; g.fillStyle = 'rgba(20,19,18,.6)'; g.fillText('NO. 0001199', W2 / 2 + 4, 995);
  });
  const fg = planeUV(new THREE.ShapeGeometry(s, 32), w, h);
  const front = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 })); front.position.z = 0.0145; ticket.add(front);
}

// =====================================================================================
// 2D OVERLAYS
// =====================================================================================
function svg(tag, attrs, parent = $('ui')) { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
const v3 = new THREE.Vector3();
function project(obj, [x, y, z]) { v3.set(x, y, z); obj.localToWorld(v3); v3.project(camera); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H]; }

function makeCallout(label, side) {
  const g = svg('g', {});
  return { side, g, path: svg('path', { fill: 'none', stroke: '#141312', 'stroke-width': 2.5, pathLength: 1, 'stroke-dasharray': 1 }, g),
    ping: svg('circle', { r: 8, fill: 'none', stroke: '#141312', 'stroke-width': 2 }, g), dot: svg('circle', { r: 7, fill: '#141312' }, g),
    text: Object.assign(svg('text', { class: 'cl-txt', 'text-anchor': side > 0 ? 'start' : 'end' }, g), { textContent: label }) };
}
const CALLOUTS = [
  ['17 PRO MAX.', -1, 0.6, 3.75, () => L.disp.g, [-0.3, -0.25, 0.05], [-90, 150]],
  ['A19 PRO.', -1, 14.5, 17.55, () => chip, [-0.06, -0.04, 0.012], [-150, 160]],
  ['DISPLAY.', -1, 18.42, 18.92, () => L.disp.g, [-0.28, -0.3, 0.05], [-110, 150]],
  ['CAMERAS.', -1, 19.08, 19.92, () => L.cam.g, [-0.25, 0.51, -0.09], [-120, 170]],
  ['MEMORY.', -1, 20.1, 22.62, () => mem, [-0.04, 0, 0.01], [-130, 170]],
  ['STORAGE.', 1, 20.56, 22.62, () => sto, [0.04, 0, 0.01], [90, 200]],
  ['ALUMINIUM BODY.', -1, 22.95, 25.36, () => L.body.g, [-0.3, -0.45, -0.04], [-70, 150]],
  ['BATTERY.', -1, 25.64, 27.7, () => L.batt.g, [-0.22, -0.45, 0.02], [-90, 150]],
].map(([label, side, tin, tout, obj, pt, d]) => ({ c: makeCallout(label, side), tin, tout, obj, pt, d }));

// price bar ($1,199 = $450 parts + $750 ?)
const barG = svg('g', {});
const BX = 120, BW = 840, BY = 1420, PART = BW * 450 / 1199;
const barTrack = svg('rect', { x: BX, y: BY, width: BW, height: 44, rx: 22, fill: 'none', stroke: 'rgba(20,19,18,.25)', 'stroke-width': 2 }, barG);
const barInk = svg('rect', { x: BX, y: BY, width: 0, height: 44, rx: 22, fill: '#141312' }, barG);
const barAmb = svg('rect', { x: BX + PART + 8, y: BY, width: 0, height: 44, rx: 22, fill: '#e0832a' }, barG);
const barL1 = Object.assign(svg('text', { class: 'sm-txt', x: BX + 6, y: BY - 26 }, barG), { textContent: 'PARTS' });
const barV1 = Object.assign(svg('text', { class: 'md-txt', x: BX + 4, y: BY + 104 }, barG), { textContent: '$450' });
const barL2 = Object.assign(svg('text', { class: 'sm-txt', x: BX + BW - 6, y: BY - 26, 'text-anchor': 'end' }, barG), { textContent: 'WHERE DOES IT GO?' });
const barV2 = Object.assign(svg('text', { class: 'md-txt', x: BX + BW - 4, y: BY + 104, 'text-anchor': 'end', fill: '#e0832a' }, barG), { textContent: '$750' });
barV2.style.fill = '#e0832a';
const barQ = Object.assign(svg('text', { class: 'md-txt', x: BX + PART + 8 + (BW - PART - 8) / 2, y: BY + 34, 'text-anchor': 'middle' }, barG), { textContent: '?' });
barQ.style.fill = '#fff'; barQ.style.fontSize = '40px';

// tested badge
const badgeG = svg('g', {});
const badgeC = svg('circle', { r: 50, fill: 'none', stroke: '#141312', 'stroke-width': 4, pathLength: 1, 'stroke-dasharray': 1 }, badgeG);
const badgeK = svg('path', { d: 'M-22 2 L-6 18 L24 -16', fill: 'none', stroke: '#e0832a', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1 }, badgeG);
const badgeT = Object.assign(svg('text', { class: 'cl-txt', y: 96, 'text-anchor': 'middle' }, badgeG), { textContent: 'TESTED.' });

// blueprint dimension lines
const dimG = svg('g', {});
const dimV = svg('path', { fill: 'none', stroke: '#141312', 'stroke-width': 2.5, pathLength: 1, 'stroke-dasharray': 1 }, dimG);
const dimH = svg('path', { fill: 'none', stroke: '#141312', 'stroke-width': 2.5, pathLength: 1, 'stroke-dasharray': 1 }, dimG);
const dimVT = Object.assign(svg('text', { class: 'cl-txt', 'text-anchor': 'middle' }, dimG), { textContent: '163.4 MM' });
const dimHT = Object.assign(svg('text', { class: 'cl-txt', 'text-anchor': 'middle' }, dimG), { textContent: '78 MM' });
const gridG = svg('g', {}, $('backsvg'));
for (let i = 0; i <= 18; i++) svg('line', { x1: i * 60, y1: 0, x2: i * 60, y2: H, stroke: 'rgba(20,19,18,.07)', 'stroke-width': i % 3 ? 1 : 2 }, gridG);
for (let i = 0; i <= 32; i++) svg('line', { x1: 0, y1: i * 60, x2: W, y2: i * 60, stroke: 'rgba(20,19,18,.07)', 'stroke-width': i % 3 ? 1 : 2 }, gridG);

// hidden-cost icons
const ICONS = [
  { at: 38.13, x: 205, y: 840, label: 'SHIPPING', d: ['M-62 -26 L0 -58 L62 -26 L62 42 L0 74 L-62 42 Z', 'M-62 -26 L0 6 L62 -26', 'M0 6 L0 74', 'M-31 -42 L31 -10'] },
  { at: 38.82, x: 875, y: 840, label: 'MARKETING', d: ['M-64 -22 L-34 -22 L38 -58 L38 58 L-34 22 L-64 22 Z', 'M-34 22 L-22 64 L0 64 L-8 26', 'M58 -26 Q76 0 58 26', 'M70 -46 Q100 0 70 46'] },
  { at: 39.54, x: 205, y: 1290, label: "STORE'S CUT", d: ['M-58 -22 L58 -22 L50 66 L-50 66 Z', 'M-26 -22 Q-26 -64 0 -64 Q26 -64 26 -22'], pct: true },
  { at: 40.95, x: 875, y: 1290, label: 'FREE UPDATES', d: ['M54 -14 A56 56 0 1 0 44 34', 'M30 -40 L56 -12 L62 -48'] },
].map(ic => {
  const g = svg('g', {});
  const paths = ic.d.map(d => svg('path', { d, fill: 'none', stroke: '#141312', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', pathLength: 1, 'stroke-dasharray': 1 }, g));
  const ring = svg('circle', { r: 112, fill: 'rgba(255,255,255,.55)', stroke: 'rgba(20,19,18,.12)', 'stroke-width': 2 }, g); g.insertBefore(ring, g.firstChild);
  let pct = null; if (ic.pct) { pct = Object.assign(svg('text', { class: 'md-txt', y: 40, 'text-anchor': 'middle' }, g), { textContent: '%' }); pct.style.fill = '#e0832a'; }
  const lbl = Object.assign(svg('text', { class: 'cl-txt', y: 160, 'text-anchor': 'middle' }, g), { textContent: ic.label });
  return { ...ic, g, paths, pct, lbl };
});

// coin ring
const ringG = svg('g', {});
const ringIn = svg('g', {}, ringG);
svg('circle', { r: 300, fill: 'none', stroke: 'rgba(20,19,18,.14)', 'stroke-width': 2 }, ringG);
const ringTicks = []; for (let i = 0; i < 100; i++) ringTicks.push(svg('line', { stroke: 'rgba(20,19,18,.35)', 'stroke-width': i % 5 ? 2 : 3, 'stroke-linecap': 'round' }, ringIn));
const ringArc = svg('circle', { r: 300, fill: 'none', stroke: '#e0832a', 'stroke-width': 9, 'stroke-linecap': 'round', pathLength: 100 }, ringIn);

// service tiles
const GLYPH = {
  cloud: '<path d="M-38 24 Q-64 24 -64 0 Q-64 -24 -38 -24 Q-30 -50 0 -50 Q32 -50 40 -20 Q64 -18 64 4 Q64 24 40 24 Z" fill="none" stroke="#141312" stroke-width="7" stroke-linejoin="round"/>',
  store: [[-30, -30], [30, -30], [-30, 30], [30, 30]].map(([x, y], i) => `<rect x="${x - 22}" y="${y - 22}" width="44" height="44" rx="12" fill="${i === 1 ? '#e0832a' : 'none'}" stroke="${i === 1 ? '#e0832a' : '#141312'}" stroke-width="7"/>`).join(''),
  music: '<path d="M-14 34 L-14 -40 L42 -54 L42 22" fill="none" stroke="#141312" stroke-width="7" stroke-linejoin="round"/><circle cx="-28" cy="34" r="16" fill="#141312"/><circle cx="28" cy="22" r="16" fill="#141312"/>',
  pay: '<rect x="-60" y="-38" width="120" height="76" rx="12" fill="none" stroke="#141312" stroke-width="7"/><rect x="-42" y="-16" width="26" height="20" rx="4" fill="#e0832a"/><line x1="-42" y1="20" x2="10" y2="20" stroke="#141312" stroke-width="6" stroke-linecap="round"/>',
};
const TILES = [
  { at: 49.67, x: 205, y: 830, g: 'cloud', label: 'ICLOUD' }, { at: 50.43, x: 875, y: 830, g: 'store', label: 'APP STORE' },
  { at: 51.07, x: 205, y: 1240, g: 'music', label: 'MUSIC' }, { at: 52.13, x: 875, y: 1240, g: 'pay', label: 'APPLE PAY' },
].map(tl => {
  const el = document.createElement('div'); el.className = 'tile';
  el.innerHTML = `<svg viewBox="-88 -88 176 176">${GLYPH[tl.g]}</svg><div class="tl">${tl.label}</div>`;
  $('tiles').appendChild(el); return { ...tl, el };
});

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
// TIMELINES
// =====================================================================================
const FEAT = {
  board: t => kf(t, [[13.45, 0], [13.9, 1, E.outExpo], [17.55, 1], [17.95, 0], [19.95, 0], [20.4, 1, E.outExpo], [22.65, 1], [23.0, 0]]),
  disp: t => kf(t, [[18.25, 0], [18.6, 1, E.outExpo], [18.92, 1], [19.2, 0]]),
  cam: t => kf(t, [[18.95, 0], [19.3, 1, E.outExpo], [19.92, 1], [20.2, 0]]),
  body: t => kf(t, [[22.8, 0], [23.2, 1, E.outExpo], [25.35, 1], [25.7, 0]]),
  batt: t => kf(t, [[25.5, 0], [25.9, 1, E.outExpo], [27.7, 1], [28.05, 0]]),
};
// phone presence / pose per window
function phonePose(t) {
  if (t < 44.6) {
    return {
      s: kf(t, [[0, 0.72], [7.0, 0.72], [7.5, 0.56], [10.66, 0.56], [11.1, 0.54], [11.65, 0.6, E.outExpo], [28.07, 0.6], [28.9, 0.7], [37.7, 0.7],
        [38.13, 0.5, E.outExpo], [42.35, 0.5], [42.8, 0.68, E.outExpo], [43.96, 0.68], [44.28, 0, E.inCubic]]),
      y: kf(t, [[0, -1.7], [0.8, -0.2, E.outExpo], [7.0, -0.2], [7.5, -0.07], [10.66, -0.07], [11.65, -0.22, E.outExpo], [28.07, -0.22], [28.9, -0.2], [37.7, -0.2],
        [38.13, -0.17], [42.35, -0.17], [42.8, -0.2], [43.96, -0.2], [44.45, -0.05]]),
      x: kf(t, [[0, 0.9], [0.8, 0, E.outExpo]]),
      rx: kf(t, [[0, 0.4], [0.8, 0.06, E.outExpo], [10.66, 0.06], [11.1, 0.14], [11.65, -1.0, E.outExpo], [28.07, -1.0], [28.85, 0.06, E.outExpo],
        [36.45, 0.06], [36.9, 0.22, E.outCubic], [37.4, 0.22], [37.85, 0.06]]),
      ry: kf(t, [[0, -3.2], [0.8, -0.32, E.outExpo], [3.95, 0.25, E.linear], [4.05, 0.25], [4.6, PI - 0.3, E.outExpo], [6.9, PI + 0.15, E.linear],
        [7.5, TAU - 0.12, E.outExpo], [10.66, TAU + 0.12, E.linear], [11.1, TAU + 0.12], [11.65, TAU + 0.62, E.outExpo], [28.07, TAU + 0.32, E.linear],
        [28.85, 2 * TAU, E.outExpo], [31.82, 2 * TAU + 0.28, E.linear], [32.45, 2 * TAU - 0.22, E.outExpo], [36.45, 2 * TAU + 0.15, E.linear],
        [36.95, 2 * TAU + 0.62, E.outCubic], [37.6, 2 * TAU + 0.55], [38.13, 2 * TAU - 0.1, E.outExpo], [42.35, 2 * TAU + 0.2, E.linear],
        [42.8, 2 * TAU - 0.15, E.outExpo], [43.96, 2 * TAU + 0.05, E.linear], [44.28, 2 * TAU + 1.6, E.inCubic]]),
    };
  }
  if (t < 53.5) return {
    s: kf(t, [[47.3, 0], [47.85, 0.6, E.outExpo], [52.9, 0.6], [53.18, 0, E.inCubic]]), y: -0.17, x: 0, rx: 0.06,
    ry: kf(t, [[47.3, -3], [47.85, -0.25, E.outExpo], [52.9, 0.25, E.linear], [53.18, 1.5, E.inCubic]]),
  };
  return {
    s: kf(t, [[56.0, 0], [56.5, 0.7, E.outExpo], [57.84, 0.7], [57.845, 0]]), y: -0.2, x: 0, rx: 0.06,
    ry: kf(t, [[56.0, -2.8], [56.5, -0.25, E.outExpo], [57.58, 0.12, E.linear], [57.86, PI / 2, E.inCubic]]),
  };
}

// =====================================================================================
// RENDER
// =====================================================================================
function renderAt(t) {
  const float = Math.sin(t * 1.9) * 0.016;

  // ---------------- camera: always moving
  const camZ = kf(t, [[0, 6.0], [3.9, 5.6, E.linear], [4.4, 5.4, E.outCubic], [6.9, 5.25, E.linear], [7.5, 5.6], [10.6, 5.4, E.linear], [11.15, 5.75, E.outCubic],
    [13.4, 5.5, E.linear], [27.9, 5.25, E.linear], [28.6, 5.6], [31.8, 5.35, E.linear], [32.5, 5.1, E.outCubic], [37.7, 5.35, E.linear], [38.2, 5.6],
    [43.9, 5.4, E.linear], [47.2, 5.25, E.linear], [47.8, 5.6], [52.9, 5.35, E.linear], [53.4, 5.5], [55.95, 5.3, E.linear], [56.5, 5.55], [57.8, 5.45, E.linear],
    [58.5, 5.25, E.outCubic], [DUR, 5.05, E.linear]]);
  camera.position.set(Math.sin(t * 0.7) * 0.06, Math.cos(t * 0.9) * 0.03, camZ);
  camera.lookAt(0, -0.05, 0);

  // ---------------- phone
  const P = phonePose(t);
  phone.visible = P.s > 0.004;
  phone.scale.setScalar(Math.max(P.s, 0.0001));
  phone.position.set(P.x, P.y + float, 0);
  phone.rotation.set(P.rx + Math.sin(t * 1.1) * 0.012, P.ry + Math.sin(t * 0.6) * (t > 11.6 && t < 28 ? 0.1 : 0.02), Math.sin(t * 1.3) * 0.015);
  const ex = Math.max(kf(t, [[4.3, 0], [4.85, 0.16, E.outCubic], [6.9, 0.16], [7.4, 0]]), kf(t, [[11.05, 0], [11.75, 1, E.outBack], [28.07, 1], [28.62, 0]]));
  const feats = {}; let fmax = 0;
  for (const k in L) { feats[k] = FEAT[k] ? FEAT[k](t) : 0; fmax = Math.max(fmax, feats[k]); }
  phone.position.y += 0.045 * feats.body;
  const xray = kf(t, [[4.34, 0], [4.85, 1], [6.85, 1], [7.3, 0]]);
  const bp = kf(t, [[36.5, 0], [36.9, 1], [37.3, 1], [37.75, 0]]);
  for (const k in L) {
    const l = L[k], f = feats[k];
    l.g.position.set(-0.24 * fmax * (1 - f) + 0.46 * f, 0, ex * 0.5 * LZ[k] + f * 0.05);
    l.g.scale.setScalar(1 + 0.06 * f);
    let o = 1;
    if (k === 'body') o *= 1 - 0.8 * xray;
    o *= 1 - 0.88 * bp;
    if (!l.mats) l.mats = matsOf(l.g);
    fadeMats(l.mats, o);
  }
  bpMat.opacity = bp * 0.9;
  // chip & memory lifts
  const lift = kf(t, [[13.52, 0], [14.0, 1, E.outBack], [17.5, 1], [17.9, 0]]);
  chip.position.z = 0.02 + lift * 0.16; chip.scale.setScalar(1 + lift * 1.1);
  chipMat.emissiveIntensity = lift * (0.25 + 0.1 * Math.sin(t * 5));
  const ml = kf(t, [[20.05, 0], [20.45, 1, E.outBack], [22.6, 1], [22.95, 0]]), sl = kf(t, [[20.52, 0], [20.9, 1, E.outBack], [22.6, 1], [22.95, 0]]);
  mem.position.z = 0.018 + ml * 0.14; mem.scale.setScalar(1 + ml * 0.9); memMat.emissiveIntensity = ml * 0.22;
  sto.position.z = 0.018 + sl * 0.14; sto.scale.setScalar(1 + sl * 0.9); stoMat.emissiveIntensity = sl * 0.22;
  const pulse450 = kf(t, [[5.54, 0], [5.8, 1], [6.8, 0]]);
  L.batt.glow.emissiveIntensity = Math.max(pulse450 * 0.35, feats.batt * 0.12 + kf(t, [[26.66, 0], [26.8, 0.6], [27.4, 0.1]]) * feats.batt);
  chipMat.emissiveIntensity += pulse450 * 0.4;
  // battery "four dollars" shrink-bounce
  L.batt.g.scale.multiplyScalar(1 - 0.12 * kf(t, [[26.66, 0], [26.85, 1, E.outCubic], [27.3, 0.4]]));

  // ---------------- coin
  const cw1 = t >= 43.9 && t < 47.6, cw2 = t >= 52.85 && t < 56.4;
  coin.visible = cw1 || cw2;
  let coinS = 0;
  if (cw1) {
    coinS = kf(t, [[44.18, 0], [44.62, 0.72, E.outBack], [47.1, 0.72], [47.5, 0, E.inCubic]]);
    coin.rotation.set(0.08, kf(t, [[44.18, -3 * PI], [44.75, 0, E.outExpo], [47.1, 0.35, E.linear], [47.5, PI, E.inCubic]]), 0);
  } else if (cw2) {
    coinS = kf(t, [[53.08, 0], [53.5, 0.72, E.outBack], [55.9, 0.72], [56.3, 0, E.inCubic]]);
    coin.rotation.set(0.08, kf(t, [[53.08, -3 * PI], [53.6, 0, E.outExpo], [55.9, 0.35, E.linear], [56.3, PI, E.inCubic]]), 0);
  }
  coin.scale.setScalar(Math.max(coinS, 0.0001));
  coin.position.set(0, -0.19 + float, 0);

  // ---------------- ticket
  const tk = t >= 57.84;
  ticket.visible = tk;
  if (tk) {
    const ts = kf(t, [[57.84, 0.7], [58.47, 0.7], [58.9, 0.76, E.outBack]]);
    ticket.scale.setScalar(ts);
    ticket.position.set(0, -0.2 + float, 0);
    ticket.rotation.set(0.06 + Math.sin(t * 1.1) * 0.012, kf(t, [[57.84, -PI / 2], [58.3, -0.12, E.outCubic], [DUR, 0.18, E.linear]]), Math.sin(t * 1.3) * 0.015);
  }

  scene.updateMatrixWorld(); camera.updateMatrixWorld();
  renderer.render(scene, camera);

  // ---------------- contact shadow
  const sh = $('shadow');
  let shy = 0, sho = 0, shs = 1;
  if (phone.visible) { shy = project(phone, [0, ex > 0.5 ? -1.0 : -0.9, 0])[1]; sho = clamp(P.s / 0.6) * (1 - 0.4 * clamp(ex)); shs = P.s / 0.72; }
  else if (coin.visible) { shy = project(coin, [0, -0.62, 0])[1]; sho = clamp(coinS / 0.7); shs = coinS; }
  else if (ticket.visible) { shy = project(ticket, [0, -0.85, 0])[1]; sho = 1; shs = 0.95; }
  sh.style.top = Math.min(1480, shy + 20).toFixed(1) + 'px';
  sh.style.opacity = (prog(t, 0.2, 0.8) * sho * (0.85 + float * 4)).toFixed(3);
  sh.style.transform = `scaleX(${shs.toFixed(3)})`;

  // ---------------- glow
  const glow = Math.max(kf(t, [[5.54, 0], [5.9, 0.75], [6.9, 0]]), kf(t, [[26.66, 0], [26.9, 0.8], [27.7, 0]]), kf(t, [[29.92, 0], [30.3, 0.6], [31.6, 0]]),
    kf(t, [[44.5, 0], [44.9, 0.7], [46.9, 0.4], [47.4, 0]]), kf(t, [[53.4, 0], [53.8, 0.85], [55.9, 0.5], [56.3, 0]]), kf(t, [[58.45, 0], [58.9, 1]]));
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
      if (b.huge) { st.s *= lerp(1.06, 1, prog(t, b.at, b.at + 1.2, E.outCubic)); st.y *= 0.3; }
      applyText(s, st, drift);
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
    const vis = p > 0 && q < 1 && phone.visible;
    c.g.style.display = vis ? '' : 'none';
    if (!vis) return;
    const [ax, ay] = project(obj(), pt), tw = c.text.textContent.length * 22 + 30;
    const by = clamp(ay + d[1], 700, 1470);
    let bx = ax + d[0];
    if (c.side > 0) bx = Math.min(bx, W - 64 - tw - 70); else bx = Math.max(bx, 64 + tw + 70);
    const ex2 = bx + c.side * 70;
    c.path.setAttribute('d', `M${ax.toFixed(1)},${ay.toFixed(1)} L${bx.toFixed(1)},${by.toFixed(1)} L${ex2.toFixed(1)},${by.toFixed(1)}`);
    c.path.setAttribute('stroke-dashoffset', (1 - p + q).toFixed(3));
    c.dot.setAttribute('cx', ax); c.dot.setAttribute('cy', ay); c.dot.setAttribute('r', 7 * clamp(p * 3) * (1 - q));
    const pp = prog(t, tin, tin + 0.6, E.outCubic);
    c.ping.setAttribute('cx', ax); c.ping.setAttribute('cy', ay); c.ping.setAttribute('r', 8 + pp * 26); c.ping.setAttribute('opacity', (1 - pp) * (1 - q));
    c.text.setAttribute('x', ex2 + c.side * (14 + (1 - p) * 24)); c.text.setAttribute('y', by + 9);
    c.text.setAttribute('opacity', clamp((p - 0.4) / 0.6) * (1 - q));
  });

  // ---------------- price bar
  const bo = prog(t, 7.45, 7.85, E.outExpo) * (1 - prog(t, 10.45, 10.75));
  barG.style.display = bo > 0 ? '' : 'none';
  if (bo > 0) {
    barG.style.opacity = bo;
    barG.setAttribute('transform', `translate(0 ${((1 - bo) * 50).toFixed(1)})`);
    barInk.setAttribute('width', (PART * prog(t, 7.6, 8.1, E.outCubic)).toFixed(1));
    const ap = prog(t, 8.47, 9.0, E.outExpo);
    const shake = t > 9.84 ? Math.sin((t - 9.84) * 40) * 10 * (1 - prog(t, 9.84, 10.3)) : 0;
    barAmb.setAttribute('width', ((BW - PART - 8) * ap).toFixed(1)); barAmb.setAttribute('x', (BX + PART + 8 + shake).toFixed(1));
    barL1.setAttribute('opacity', prog(t, 7.7, 8.0)); barV1.setAttribute('opacity', prog(t, 7.8, 8.1));
    barL2.setAttribute('opacity', prog(t, 8.7, 9.0)); barV2.setAttribute('opacity', prog(t, 8.5, 8.8));
    const qs = E.outBack(clamp((t - 9.84) / 0.35));
    barQ.setAttribute('opacity', ap); barQ.setAttribute('transform', `translate(${shake.toFixed(1)} 0)`);
    barQ.style.fontSize = (40 + 14 * qs * (1 - prog(t, 10.2, 10.5))).toFixed(1) + 'px';
  }

  // ---------------- tested badge
  const bdg = prog(t, 28.67, 29.05, E.outCubic) * (1 - prog(t, 31.5, 31.8));
  badgeG.style.display = bdg > 0 && phone.visible ? '' : 'none';
  if (bdg > 0 && phone.visible) {
    const [bx, by] = project(phone, [0.39, 0.55, 0]);
    badgeG.setAttribute('transform', `translate(${(bx + 105).toFixed(1)} ${(by + 40).toFixed(1)}) scale(${lerp(0.7, 1, E.outBack(bdg)).toFixed(3)})`);
    badgeG.style.opacity = clamp(bdg * 2);
    badgeC.setAttribute('stroke-dashoffset', 1 - bdg); badgeK.setAttribute('stroke-dashoffset', 1 - prog(t, 28.85, 29.15, E.outCubic));
    badgeT.setAttribute('opacity', prog(t, 29.0, 29.3));
  }

  // ---------------- blueprint dims + grid
  gridG.style.opacity = (bp * 1).toFixed(3); gridG.style.display = bp > 0 ? '' : 'none';
  dimG.style.display = bp > 0 ? '' : 'none';
  if (bp > 0) {
    const [tlx, tly] = project(phone, [-PW / 2, PH / 2, 0]), [blx, bly] = project(phone, [-PW / 2, -PH / 2, 0]), [brx, bry] = project(phone, [PW / 2, -PH / 2, 0]);
    const vx = Math.min(tlx, blx) - 60;
    dimV.setAttribute('d', `M${vx + 14},${tly} L${vx - 14},${tly} M${vx},${tly} L${vx},${bly} M${vx + 14},${bly} L${vx - 14},${bly}`);
    const hy = Math.max(bly, bry) + 50;
    dimH.setAttribute('d', `M${blx},${hy - 14} L${blx},${hy + 14} M${blx},${hy} L${brx},${hy} M${brx},${hy - 14} L${brx},${hy + 14}`);
    dimV.setAttribute('stroke-dashoffset', 1 - bp); dimH.setAttribute('stroke-dashoffset', 1 - bp);
    dimVT.setAttribute('transform', `translate(${vx - 24} ${(tly + bly) / 2}) rotate(-90)`); dimVT.setAttribute('opacity', bp);
    dimHT.setAttribute('x', (blx + brx) / 2); dimHT.setAttribute('y', hy + 46); dimHT.setAttribute('opacity', bp);
  }

  // ---------------- hidden-cost icons
  ICONS.forEach(ic => {
    const p = prog(t, ic.at, ic.at + 0.5, E.outCubic), q = prog(t, 42.25, 42.55, E.inCubic);
    const vis = p > 0 && q < 1;
    ic.g.style.display = vis ? '' : 'none';
    if (!vis) return;
    const s = lerp(0.6, 1, E.outBack(clamp((t - ic.at) / 0.4))) * (1 - 0.3 * q);
    ic.g.setAttribute('transform', `translate(${ic.x} ${(ic.y + Math.sin(t * 1.6 + ic.x) * 6).toFixed(1)}) scale(${s.toFixed(3)})`);
    ic.g.style.opacity = clamp(p * 2) * (1 - q);
    ic.paths.forEach((pa, i) => pa.setAttribute('stroke-dashoffset', 1 - clamp(p * 1.4 - i * 0.12)));
    if (ic.pct) ic.pct.setAttribute('opacity', prog(t, ic.at + 0.3, ic.at + 0.5));
    ic.lbl.setAttribute('opacity', prog(t, ic.at + 0.2, ic.at + 0.45));
  });

  // ---------------- coin ring
  const ringOn = cw1 ? prog(t, 44.6, 44.95, E.outCubic) * (1 - prog(t, 46.95, 47.3)) : cw2 ? prog(t, 53.3, 53.6, E.outCubic) * (1 - prog(t, 55.8, 56.15)) : 0;
  ringG.style.display = ringOn > 0 ? '' : 'none';
  if (ringOn > 0) {
    const [cx, cy] = project(coin, [0, 0, 0]);
    ringG.setAttribute('transform', `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${lerp(0.9, 1, ringOn).toFixed(4)})`);
    ringIn.setAttribute('transform', `rotate(${(-90 + (1 - ringOn) * -40).toFixed(2)})`);
    ringG.style.opacity = clamp(ringOn * 2);
    const val = cw1 ? ROLLS[8].v(t) : ROLLS[9].v(t);
    ringArc.setAttribute('stroke-dasharray', `${(ringOn * val).toFixed(2)} 100`);
    ringTicks.forEach((l, i) => {
      const a = (i / 100) * TAU, on = clamp(ringOn * 100 - i), r1 = 320, r2 = 320 + (i % 5 ? 10 : 20) * on;
      l.setAttribute('x1', Math.cos(a) * r1); l.setAttribute('y1', Math.sin(a) * r1); l.setAttribute('x2', Math.cos(a) * r2); l.setAttribute('y2', Math.sin(a) * r2);
      l.setAttribute('opacity', on); l.setAttribute('stroke', i < val ? 'rgba(224,131,42,.9)' : 'rgba(20,19,18,.35)');
    });
  }

  // ---------------- service tiles
  const conv = prog(t, 52.9, 53.3, E.inCubic);
  TILES.forEach(tl => {
    const p = E.outBack(clamp((t - tl.at) / 0.45)), o = clamp((t - tl.at) / 0.2) * (1 - conv);
    tl.el.style.opacity = o.toFixed(3);
    tl.el.style.display = o > 0.002 ? '' : 'none';
    if (o <= 0.002) return;
    const x = lerp(tl.x, 540, conv), y = lerp(tl.y + Math.sin(t * 1.7 + tl.x) * 7, 1030, conv);
    tl.el.style.transform = `translate(${(x - 88).toFixed(1)}px, ${(y - 88 + (1 - p) * 40).toFixed(1)}px) scale(${(lerp(0.6, 1, p) * (1 - 0.7 * conv)).toFixed(3)}) rotate(${((1 - p) * (tl.x < 540 ? -12 : 12)).toFixed(2)}deg)`;
    tl.el.style.filter = p < 0.95 ? `blur(${((1 - clamp(p)) * 10).toFixed(1)}px)` : 'none';
  });

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
      d.textContent = m < 0 ? '' : r.fmt(m);
      d.style.transform = `translateY(${((r.up ? m - v : v - m) * 150).toFixed(1)}px)`;
      d.style.filter = speed > 1 ? `blur(${Math.min(r.maxBlur ?? 8, speed * 0.12).toFixed(1)}px)` : 'none';
      d.style.color = r.amber && r.amber(v) && Math.round(v) === m ? '#e0832a' : '#141312';
    });
  });

  // ---------------- grain
  const RG = rng(Math.floor(t * 60) + 11);
  $('grain').style.backgroundPosition = `${Math.floor(RG() * 256)}px ${Math.floor(RG() * 256)}px`;
}

// =====================================================================================
// LAYOUT CHECK: projected object bounds vs. text boxes (run before the full render)
// =====================================================================================
const pv = new THREE.Vector3();
function meshRects() {
  const rects = [];
  [phone, coin, ticket].forEach(root => {
    if (!root.visible) return;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    root.traverse(o => {
      if (!o.isMesh) return;
      let vis = true; for (let a = o; a; a = a.parent) if (!a.visible) vis = false;
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      if (!vis || Math.max(...ms.map(m => (m.transparent ? m.opacity : 1))) < 0.08) return;
      const p = o.geometry.attributes.position;
      for (let i = 0; i < p.count; i += 3) {
        pv.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld).project(camera);
        const x = (pv.x + 1) / 2 * W, y = (1 - pv.y) / 2 * H;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      }
    });
    if (x1 > x0) rects.push({ name: root === phone ? 'phone' : root === coin ? 'coin' : 'ticket', x0, y0, x1, y1 });
  });
  return rects;
}
function domRect(el, name) { const r = el.getBoundingClientRect(); return r.width ? { name, x0: r.left, y0: r.top, x1: r.right, y1: r.bottom } : null; }
window.CHECK = t => {
  renderAt(t);
  const objs = meshRects();
  const gfx = [barG, ringG, badgeG, dimG, ...ICONS.map(i => i.g)].filter(g => g.style.display !== 'none').map((g, i) => domRect(g, 'gfx' + i)).filter(Boolean);
  TILES.forEach(tl => { if (tl.el.style.display !== 'none' && +tl.el.style.opacity > 0.05) objs.push(domRect(tl.el, 'tile')); });
  const text = [];
  [...kick, ...bigs].forEach(k => { if (k.el.style.display === 'none') return; k.spans.forEach(s => { if (s.style.visibility !== 'hidden' && +s.style.opacity > 0.05) { const r = domRect(s, 'text'); if (r) text.push(r); } }); });
  rolls.forEach(r => { if (r.el.style.display !== 'none' && +r.el.style.opacity > 0.05) text.push(domRect(r.el.querySelector('.lbl'), 'readout')); });
  const hits = [];
  const GAP = 24;
  for (const a of text) for (const b of [...objs, ...gfx]) {
    if (a.x0 < b.x1 + GAP && a.x1 > b.x0 - GAP && a.y0 < b.y1 + GAP && a.y1 > b.y0 - GAP) hits.push(`${a.name}[${a.y0.toFixed(0)}-${a.y1.toFixed(0)}] x ${b.name}[${b.y0.toFixed(0)}-${b.y1.toFixed(0)}]`);
  }
  return { objs: objs.map(o => `${o.name} y${o.y0.toFixed(0)}-${o.y1.toFixed(0)} x${o.x0.toFixed(0)}-${o.x1.toFixed(0)}`), hits };
};

window.READY = (async () => {
  await document.fonts.load('italic 500 100px Playfair');
  await document.fonts.load('600 100px "Inter Display"');
  await document.fonts.load('700 30px Inter');
  buildScreen();
  addEdges(phone);
  for (const k in L) L[k].mats = matsOf(L[k].g);
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
