#!/usr/bin/env node
// Frame-by-frame renderer. Serves the repo over a local HTTP server (so ES modules
// and WebGL work), calls window.renderAt(t) for every frame, screenshots it and
// pipes frames + voiceover + SFX into ffmpeg.
//
//   node engine/render.js videos/<name>                  -> out/<name>.mp4
//   node engine/render.js videos/<name> --from 1 --to 3
//   node engine/render.js videos/<name> --still 1.2,3.4  -> out/<name>-<t>.png
//
// window.VIDEO = { width, height, fps, duration, audio, audioStart, sfx: [{ at, name, vol }] }
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
if (!args[0]) { console.error('usage: render.js <video-dir> [--fps n] [--from s] [--to s] [--still s,s] [--out file]'); process.exit(1); }
const dir = path.resolve(args[0]);
const rel = path.relative(ROOT, dir).split(path.sep).join('/');
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const name = path.basename(dir);

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
function serve() {
  const srv = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r(srv)));
}

(async () => {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(`${base}/${rel}/index.html?render=1`);
  await page.waitForFunction(() => window.VIDEO && window.renderAt);
  await page.evaluate(async () => { await document.fonts.ready; if (window.READY) await window.READY; });
  const cfg = await page.evaluate(() => window.VIDEO);
  await page.setViewportSize({ width: cfg.width, height: cfg.height });
  fs.mkdirSync(path.join(ROOT, 'out'), { recursive: true });
  const done = async () => { await browser.close(); srv.close(); };

  const still = opt('still');
  if (still !== undefined) {
    for (const s of still.split(',')) {
      await page.evaluate(t => window.renderAt(t), +s);
      const file = path.resolve(opt('out') || path.join(ROOT, `out/${name}-${s}.png`));
      await page.screenshot({ path: file });
      console.log('Wrote', file);
    }
    return done();
  }

  const fps = +(opt('fps') || cfg.fps || 30);
  const from = +(opt('from') || 0);
  const to = opt('to') !== undefined ? +opt('to') : cfg.duration;
  const total = Math.round((to - from) * fps);
  const dur = total / fps;
  const out = path.resolve(opt('out') || path.join(ROOT, `out/${name}.mp4`));

  // ---- audio graph: voiceover (offset) + SFX, mixed without normalisation
  const ff = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-'];
  const filters = [], labels = [];
  let idx = 1;
  if (cfg.audio) {
    ff.push('-ss', String((cfg.audioStart || 0) + from), '-t', String(dur), '-i', path.join(dir, cfg.audio));
    filters.push(`[${idx}:a]aformat=channel_layouts=stereo,volume=${cfg.voiceVol || 1}[a${idx}]`); labels.push(`[a${idx}]`); idx++;
  }
  for (const s of (cfg.sfx || [])) {
    const at = s.at - from;
    if (at < 0 || at > dur) continue;
    ff.push('-i', path.join(ROOT, 'assets/sfx', s.name + '.wav'));
    const ms = Math.round(at * 1000);
    filters.push(`[${idx}:a]aformat=channel_layouts=stereo,volume=${s.vol ?? 0.4},adelay=${ms}|${ms}[a${idx}]`); labels.push(`[a${idx}]`); idx++;
  }
  ff.push('-map', '0:v');
  if (labels.length) {
    filters.push(`${labels.join('')}amix=inputs=${labels.length}:normalize=0:duration=longest,alimiter=limit=0.95,apad[aout]`);
    ff.push('-filter_complex', filters.join(';'), '-map', '[aout]', '-c:a', 'aac', '-b:a', '320k');
  }
  const br = cfg.bitrate || '22M', max = cfg.maxrate || '25M';
  ff.push('-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-b:v', br, '-maxrate', max, '-bufsize', '50M',
    '-pix_fmt', 'yuv420p', '-r', String(fps), '-movflags', '+faststart', '-t', String(dur), out);
  const proc = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });

  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    await page.evaluate(t => window.renderAt(t), from + f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 96 });
    if (!proc.stdin.write(buf)) await new Promise(r => proc.stdin.once('drain', r));
    if (f % 60 === 0) process.stdout.write(`frame ${f}/${total}  (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
  }
  proc.stdin.end();
  const code = await new Promise(r => proc.on('close', r));
  await done();
  if (code !== 0) { console.error('ffmpeg failed', code); process.exit(1); }
  console.log('Wrote', out);
})();
