// Style test: "So what changed? The battery inside your phone has actually aged."
// Voiceover 7.30s -> 12.30s of the iPhone battery narration. Local time t = 0..5.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const { clamp, lerp, E, prog, rng, mix, kf } = window.Anim;
const $ = id => document.getElementById(id);
const W = 1080, H = 1920, SVGNS = 'http://www.w3.org/2000/svg';

// ------------------------------------------------------------------ text plan
// word times measured from the voiceover (local seconds)
const KICKERS = [
  { words: [['So', 0.17], ['what', 0.56]], out: 1.42 },
  { words: [['The', 1.77]], out: 2.26 },
  { words: [['inside', 2.35], ['your', 2.75]], out: 3.32 },
  { words: [['has', 3.51], ['actually', 3.70]], out: 99 },
];
const BIGS = [
  { text: 'changed?', at: 0.82, out: 1.40, acc: 7 },
  { text: 'battery.', at: 1.90, out: 2.28, acc: 99 },
  { text: 'phone.', at: 2.95, out: 3.36, acc: 99 },
  { text: 'aged.', at: 4.04, out: 99, acc: 0, huge: true },
];

// ------------------------------------------------------------------ roll values (capacity)
const capAt = t => kf(t, [[3.85, 100], [4.38, 79, E.inOutCubic]]);
const ticks = [];
{ let last = 100; for (let t = 3.85; t <= 4.4; t += 1 / 480) { const n = Math.floor(capAt(t)); if (n < last) { if (n % 3 === 0) ticks.push(+t.toFixed(3)); last = n; } } }

window.VIDEO = {
  width: W, height: H, fps: 60, duration: 5.0, bitrate: '22M', maxrate: '25M',
  audio: '../iphone-battery-aging/voiceover.mp3', audioStart: 7.30,
  sfx: [
    { at: 0.00, name: 'whoosh-fast', vol: 0.45 },
    { at: 0.62, name: 'click', vol: 0.35 },
    { at: 0.82, name: 'pop', vol: 0.4 },
    { at: 1.40, name: 'whoosh-soft', vol: 0.3 },
    { at: 1.74, name: 'whoosh-fast', vol: 0.4 },
    { at: 1.90, name: 'click', vol: 0.35 },
    { at: 2.08, name: 'tick', vol: 0.4 },
    { at: 2.52, name: 'tick', vol: 0.4 },
    { at: 2.92, name: 'whoosh-low', vol: 0.45 },
    { at: 2.95, name: 'pop', vol: 0.35 },
    { at: 3.12, name: 'tick', vol: 0.4 },
    { at: 3.52, name: 'whoosh-soft', vol: 0.3 },
    ...ticks.map(at => ({ at, name: 'tick', vol: 0.28 })),
    { at: 4.02, name: 'impact-soft', vol: 0.55 },
  ],
};

// ------------------------------------------------------------------ text DOM
function makeSpans(parent, cls, parts) {
  const el = document.createElement('div'); el.className = cls; parent.appendChild(el);
  const spans = parts.map(p => { const s = document.createElement('span'); s.textContent = p; el.appendChild(s); return s; });
  return { el, spans };
}
const kick = KICKERS.map(k => ({ ...k, ...makeSpans($('front'), 'kicker', k.words.map((w, i) => (i ? ' ' : '') + w[0])) }));
const bigs = BIGS.map(b => {
  const r = makeSpans(b.huge ? $('back') : $('front'), b.huge ? 'big huge' : 'big', [...b.text]);
  r.spans.forEach((s, i) => { if (i >= b.acc) s.classList.add('acc'); });
  return { ...b, ...r };
});

function textState(t, tin, tout, i) {
  const p = E.outExpo(clamp((t - tin - i * 0.03) / 0.62));
  const q = E.inCubic(clamp((t - tout - i * 0.012) / 0.26));
  return { o: clamp(p * 1.6) * (1 - q), y: (1 - p) * 80 - q * 60, b: (1 - p) * 26 + q * 18, s: 1 + (1 - p) * 0.1 - q * 0.05 };
}
function applyText(s, st, drift = 0) {
  s.style.opacity = st.o.toFixed(3);
  s.style.transform = `translateY(${(st.y + drift).toFixed(1)}px) scale(${st.s.toFixed(4)})`;
  s.style.filter = st.b > 0.15 ? `blur(${st.b.toFixed(1)}px)` : 'none';
  s.style.visibility = st.o < 0.003 ? 'hidden' : 'visible';
}

// ------------------------------------------------------------------ three.js
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
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function rrect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }

const mats = {
  frame: new THREE.MeshPhysicalMaterial({ color: 0xc9c2b7, metalness: 0.9, roughness: 0.26, clearcoat: 0.4 }),
  back: new THREE.MeshPhysicalMaterial({ color: 0xdcd5ca, metalness: 0.15, roughness: 0.5, clearcoat: 0.5, clearcoatRoughness: 0.4 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x060606, metalness: 0, roughness: 0.04, clearcoat: 1 }),
  lens: new THREE.MeshPhysicalMaterial({ color: 0x0a0a0c, metalness: 0.2, roughness: 0.05, clearcoat: 1 }),
  board: new THREE.MeshStandardMaterial({ color: 0x2b2e31, metalness: 0.4, roughness: 0.5 }),
  chip: new THREE.MeshStandardMaterial({ color: 0x9a9fa6, metalness: 0.9, roughness: 0.3 }),
  batt: new THREE.MeshPhysicalMaterial({ color: 0x232325, metalness: 0.3, roughness: 0.42, clearcoat: 0.6 }),
};

const root = new THREE.Group(); scene.add(root);
const shell = new THREE.Group(); root.add(shell);
const glassG = new THREE.Group(); root.add(glassG);
const battG = new THREE.Group(); root.add(battG);

// frame (hollow ring)
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
let screenTex, labelTex;
function buildTextures() {
  screenTex = canvasTex(512, 1110, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1d1915'); gr.addColorStop(1, '#060606');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const rg = g.createRadialGradient(256, 760, 0, 256, 760, 520); rg.addColorStop(0, 'rgba(224,131,42,.5)'); rg.addColorStop(1, 'rgba(224,131,42,0)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
    g.fillStyle = '#000'; rrect(g, 196, 28, 120, 36, 18); g.fill();
    g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.72)'; g.font = '500 26px Inter'; g.fillText('Tuesday, May 14', 256, 150);
    g.fillStyle = '#fff'; g.font = '600 150px "Inter Display"'; g.fillText('12:30', 256, 300);
    g.strokeStyle = '#fff'; g.lineWidth = 6; rrect(g, 176, 760, 150, 68, 18); g.stroke();
    g.fillStyle = '#fff'; rrect(g, 330, 780, 8, 28, 4); g.fill();
    g.fillStyle = '#ff5a3c'; rrect(g, 186, 770, 20, 48, 9); g.fill();
    g.fillStyle = '#fff'; g.font = '700 50px "Inter Display"'; g.fillText('9%', 256, 900);
  });
  labelTex = canvasTex(560, 880, (g, w, h) => {
    g.fillStyle = '#1e1e20'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; rrect(g, 30, 30, w - 60, h - 60, 18); g.stroke();
    g.fillStyle = '#e0832a'; g.font = 'italic 500 170px Playfair'; g.textAlign = 'center'; g.fillText('Li-ion', w / 2, 360);
    g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '700 22px Inter';
    g.letterSpacing = '6px'; g.fillText('RECHARGEABLE CELL', w / 2, 430);
    g.fillStyle = 'rgba(255,255,255,.45)'; g.font = '600 22px Inter'; g.fillText('3.8 V  ·  NOMINAL', w / 2, 470);
    g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 2;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(70, 600 + i * 30); g.lineTo(w - 70 - (i % 3) * 90, 600 + i * 30); g.stroke(); }
  });
  // glass + screen
  glassG.add(slab(rr(0.75, 1.57, 0.105), 0.007, 0.034, mats.glass, 0.002));
  const sg = planeUV(new THREE.ShapeGeometry(rr(0.71, 1.53, 0.09), 24), 0.71, 1.53);
  const screen = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false, transparent: true }));
  screen.position.z = 0.0435; glassG.add(screen);
  // battery
  const b = new THREE.Mesh(new RoundedBoxGeometry(0.58, 0.9, 0.036, 4, 0.016), mats.batt); battG.add(b);
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.82), new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.55, metalness: 0.1 }));
  lab.position.z = 0.0185; battG.add(lab);
  battG.userData.label = lab;
}
const allShellMats = [mats.frame, mats.back, mats.lens, mats.board, mats.chip];
function fadeMats(list, o) { list.forEach(m => { m.transparent = o < 0.999; m.opacity = o; m.depthWrite = o > 0.6; }); }

// ------------------------------------------------------------------ overlay SVG (callouts, ring)
function svg(tag, attrs, parent = $('ui')) { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; }
const ringG = svg('g', {});
const ringBg = svg('circle', { r: 410, fill: 'none', stroke: 'rgba(20,19,18,.12)', 'stroke-width': 2 }, ringG);
const ringTicks = [];
for (let i = 0; i < 72; i++) ringTicks.push(svg('line', { stroke: 'rgba(20,19,18,.35)', 'stroke-width': i % 6 ? 2 : 3, 'stroke-linecap': 'round' }, ringG));
const ringArc = svg('circle', { r: 410, fill: 'none', stroke: '#e0832a', 'stroke-width': 7, 'stroke-linecap': 'round', pathLength: 100 }, ringG);
function makeCallout(label, side) {
  const g = svg('g', {});
  return { side, g, path: svg('path', { fill: 'none', stroke: '#141312', 'stroke-width': 2.5, pathLength: 1, 'stroke-dasharray': 1 }, g),
    ping: svg('circle', { r: 8, fill: 'none', stroke: '#141312', 'stroke-width': 2 }, g),
    dot: svg('circle', { r: 7, fill: '#141312' }, g),
    text: Object.assign(svg('text', { class: 'cl-txt', 'text-anchor': side > 0 ? 'start' : 'end' }, g), { textContent: label }) };
}
const callouts = [
  { c: makeCallout('BATTERY.', 1), tin: 2.05, tout: 2.86, obj: battG, pt: [0.22, 0.26, 0.02], d: [190, -150] },
  { c: makeCallout('LOGIC BOARD.', -1), tin: 2.5, tout: 2.86, obj: shell, pt: [-0.2, 0.5, 0.0], d: [-170, -130] },
  { c: makeCallout('LITHIUM-ION CELL.', -1), tin: 3.1, tout: 3.62, obj: battG, pt: [-0.24, -0.3, 0.02], d: [-60, 190] },
];
const v3 = new THREE.Vector3();
function project(obj, [x, y, z]) { v3.set(x, y, z); obj.localToWorld(v3); v3.project(camera); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H]; }

// rolling number
const rollItems = [0, 1, 2, 3].map(() => { const d = document.createElement('div'); $('roll').appendChild(d); return d; });

// film grain: seeded noise tile, offset every frame
{
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const im = g.createImageData(256, 256); const R = rng(3);
  for (let i = 0; i < im.data.length; i += 4) { const v = 110 + R() * 145; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
  g.putImageData(im, 0, 0); $('grain').style.backgroundImage = `url(${c.toDataURL()})`;
}

// ------------------------------------------------------------------ render
function renderAt(t) {
  const float = Math.sin(t * 1.9) * 0.018;

  // ---- camera: constant slow push-in + drift (never static)
  const camZ = kf(t, [[0, 6.1], [1.7, 5.75], [2.35, 5.0, E.outCubic], [2.95, 5.15], [3.5, 5.0, E.outCubic], [5, 4.8, E.linear]]);
  camera.position.set(Math.sin(t * 0.7) * 0.06, 0.02 + Math.cos(t * 0.9) * 0.03, camZ);
  camera.lookAt(0, -0.05, 0);

  // ---- phone root
  root.position.set(kf(t, [[0, 1.6], [0.72, 0, E.outExpo]]), kf(t, [[0, -1.5], [0.72, -0.22, E.outExpo], [2.9, -0.22], [3.45, -0.1, E.outCubic]]) + float, 0);
  root.rotation.set(
    kf(t, [[0, 0.35], [0.72, 0.1, E.outExpo], [1.75, 0.1], [2.3, 0.42, E.outExpo], [2.95, 0.32], [3.45, 0.08, E.outExpo], [5, 0.04]]),
    kf(t, [[0, -2.9], [0.72, -0.32, E.outExpo], [1.12, -0.12], [1.5, 0.32, E.inOutCubic], [1.75, 0.3], [2.3, -0.62, E.outExpo], [2.95, 0.3, E.linear], [3.45, -0.18, E.outExpo], [5, 0.12, E.linear]]),
    kf(t, [[0, 0.5], [0.72, 0.04, E.outExpo], [2.3, -0.06], [3.45, 0.0]]) + Math.sin(t * 1.3) * 0.015);

  // glass lifts off and flies out
  const lift = prog(t, 1.74, 2.0, E.outCubic), fly = prog(t, 1.98, 2.42, E.inCubic);
  glassG.position.set(fly * 0.6, fly * 2.8, lift * 0.32 + fly * 0.9);
  glassG.rotation.set(-fly * 0.7, fly * 0.4, fly * 0.3);
  glassG.visible = fly < 0.999;

  // shell (frame, back, board) falls away on "phone."
  const drop = prog(t, 2.95, 3.4, E.inCubic);
  shell.position.set(0, -drop * 0.5, -drop * 0.9);
  shell.scale.setScalar(1 - drop * 0.15);
  fadeMats(allShellMats, 1 - drop);
  shell.visible = drop < 0.999;

  // battery comes forward, then swells as it "ages"
  const fwd = prog(t, 2.95, 3.45, E.outExpo), age = prog(t, 4.02, 4.55, E.outCubic);
  battG.position.set(0, lerp(-0.22, 0.02, fwd), lerp(-0.008, 0.25, fwd));
  battG.scale.set(1 + fwd * 0.08 + age * 0.02, 1 + fwd * 0.08 + age * 0.02, 1 + age * 0.9);
  mats.batt.color.set(mix('#232325', '#3b2f25', age));
  if (battG.userData.label) battG.userData.label.material.color.set(mix('#ffffff', '#b7a48f', age));

  scene.updateMatrixWorld(); camera.updateMatrixWorld();
  renderer.render(scene, camera);

  // ---- contact shadow follows the object
  const [, sy] = project(root, [0, -0.95, 0]);
  const sh = $('shadow');
  sh.style.top = (sy + 30).toFixed(1) + 'px';
  sh.style.opacity = (prog(t, 0.2, 0.8) * (1 - 0.5 * drop) * (0.85 + float * 4)).toFixed(3);
  sh.style.transform = `scaleX(${(1 - drop * 0.15 + fwd * 0.1).toFixed(3)})`;

  // ---- warm glow pulse on "aged."
  $('glow').style.opacity = (prog(t, 4.0, 4.45, E.outCubic) * 0.95).toFixed(3);
  $('glow').style.transform = `scale(${lerp(0.7, 1, prog(t, 4.0, 4.8, E.outCubic)).toFixed(3)})`;

  // ---- text
  const drift = -t * 6; // slow upward drift of all type
  kick.forEach(k => k.spans.forEach((s, i) => applyText(s, textState(t, k.words[i][1], k.out, 0), drift)));
  bigs.forEach(b => b.spans.forEach((s, i) => {
    const st = textState(t, b.at, b.out, i);
    if (b.huge) st.s *= lerp(1.12, 1, prog(t, b.at, b.at + 1.2, E.outCubic));
    applyText(s, st, b.huge ? 0 : drift);
  }));

  // ---- callouts
  callouts.forEach(({ c, tin, tout, obj, pt, d }) => {
    const p = prog(t, tin, tin + 0.38, E.outCubic), q = prog(t, tout, tout + 0.22, E.inCubic);
    const vis = p > 0 && q < 1;
    c.g.style.display = vis ? '' : 'none';
    if (!vis) return;
    const [ax, ay] = project(obj, pt), tw = c.text.textContent.length * 22 + 30, by = ay + d[1];
    // keep the label fully on screen (64px safe margin)
    let bx = ax + d[0];
    if (c.side > 0) bx = Math.min(bx, W - 64 - tw - 70); else bx = Math.max(bx, 64 + tw + 70);
    const ex = bx + c.side * 70;
    c.path.setAttribute('d', `M${ax},${ay} L${bx},${by} L${ex},${by}`);
    c.path.setAttribute('stroke-dashoffset', (1 - p + q).toFixed(3));
    c.dot.setAttribute('cx', ax); c.dot.setAttribute('cy', ay); c.dot.setAttribute('r', 7 * clamp(p * 3) * (1 - q));
    const pp = prog(t, tin, tin + 0.6, E.outCubic);
    c.ping.setAttribute('cx', ax); c.ping.setAttribute('cy', ay); c.ping.setAttribute('r', 8 + pp * 26); c.ping.setAttribute('opacity', (1 - pp) * (1 - q));
    c.text.setAttribute('x', ex + c.side * (14 + (1 - p) * 24)); c.text.setAttribute('y', by + 9);
    c.text.setAttribute('opacity', clamp((p - 0.4) / 0.6) * (1 - q));
  });

  // ---- capacity ring around the battery
  const [cx, cy] = project(battG, [0, 0, 0]);
  const rin = prog(t, 3.5, 3.88, E.outCubic);
  ringG.setAttribute('transform', `translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${(-90 + (1 - rin) * -40).toFixed(2)}) scale(${lerp(0.9, 1, rin).toFixed(4)})`);
  ringG.style.opacity = clamp(rin * 2);
  ringG.style.display = rin > 0 ? '' : 'none';
  const cap = capAt(t);
  ringArc.setAttribute('stroke-dasharray', `${(rin * cap).toFixed(2)} 100`);
  ringArc.setAttribute('stroke', mix('#141312', '#e0832a', prog(t, 3.9, 4.1)));
  ringTicks.forEach((l, i) => {
    const a = (i / 72) * Math.PI * 2, on = clamp(rin * 72 - i), r1 = 432, r2 = 432 + (i % 6 ? 10 : 20) * on;
    l.setAttribute('x1', Math.cos(a) * r1); l.setAttribute('y1', Math.sin(a) * r1);
    l.setAttribute('x2', Math.cos(a) * r2); l.setAttribute('y2', Math.sin(a) * r2);
    l.setAttribute('opacity', on);
  });

  // ---- rolling readout
  const ro = prog(t, 3.6, 3.95, E.outExpo);
  $('readout').style.opacity = ro.toFixed(3);
  $('readout').style.transform = `translateY(${((1 - ro) * 60).toFixed(1)}px)`;
  const base = Math.floor(cap), speed = Math.abs(capAt(t + 0.01) - cap) * 100;
  rollItems.forEach((d, k) => {
    const m = base - 1 + k, y = (m - cap) * -150;
    d.textContent = m + '%';
    d.style.transform = `translateY(${y.toFixed(1)}px)`;
    d.style.filter = speed > 1 ? `blur(${Math.min(8, speed * 0.12).toFixed(1)}px)` : 'none';
    d.style.color = cap < 80.5 && m === 79 ? '#e0832a' : '#141312';
  });

  // ---- grain
  const R = rng(Math.floor(t * 60) + 11);
  $('grain').style.backgroundPosition = `${Math.floor(R() * 256)}px ${Math.floor(R() * 256)}px`;
}

window.READY = (async () => {
  await document.fonts.load('italic 500 100px Playfair');
  await document.fonts.load('600 100px "Inter Display"');
  await document.fonts.load('700 30px Inter');
  buildTextures();
  renderAt(0);
})();
window.renderAt = renderAt;

// ------------------------------------------------------------------ preview mode
if (/render=1/.test(location.search)) document.body.classList.add('render');
else {
  const stage = $('stage');
  const fit = () => { const k = Math.min(innerWidth / W, (innerHeight - 48) / H); stage.style.transform = `translate(${(innerWidth - W * k) / 2}px,0) scale(${k})`; };
  addEventListener('resize', fit); fit();
  const audio = $('audio'), scrub = $('scrub'); let tl = 0;
  $('play').onclick = () => { if (audio.paused) { audio.currentTime = 7.3 + tl; audio.play(); } else audio.pause(); };
  scrub.oninput = () => { tl = +scrub.value; audio.pause(); };
  window.READY.then(function loop() {
    if (!audio.paused) { tl = audio.currentTime - 7.3; if (tl >= 5) audio.pause(); }
    renderAt(clamp(tl, 0, 5)); scrub.value = tl; $('tc').textContent = tl.toFixed(2);
    requestAnimationFrame(loop);
  });
}
