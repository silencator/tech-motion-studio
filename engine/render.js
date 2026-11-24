#!/usr/bin/env node
// Frame-by-frame renderer: loads a video page, calls window.renderAt(t) for every
// frame, screenshots it, and pipes the frames + audio into ffmpeg.
//
//   node engine/render.js videos/<name>                  -> out/<name>.mp4
//   node engine/render.js videos/<name> --from 10 --to 20 --fps 30
//   node engine/render.js videos/<name> --still 12.5     -> out/<name>-12.5.png
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
if (!args[0]) { console.error('usage: render.js <video-dir> [--fps 30] [--from s] [--to s] [--still s] [--out file]'); process.exit(1); }
const dir = path.resolve(args[0]);
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const name = path.basename(dir);
const fps = +(opt('fps') || 30);

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.join(dir, 'index.html') + '?render=1');
  await page.evaluate(() => document.fonts.ready);
  const cfg = await page.evaluate(() => window.VIDEO);
  await page.setViewportSize({ width: cfg.width, height: cfg.height });
  fs.mkdirSync(path.resolve('out'), { recursive: true });

  const still = opt('still');
  if (still !== undefined) {
    for (const s of still.split(',')) {
      await page.evaluate(t => window.renderAt(t), +s);
      const file = path.resolve(opt('out') || `out/${name}-${s}.png`);
      await page.screenshot({ path: file });
      console.log('Wrote', file);
    }
    await browser.close();
    return;
  }

  const from = +(opt('from') || 0);
  const to = opt('to') !== undefined ? +opt('to') : cfg.duration;
  const total = Math.round((to - from) * fps);
  const out = path.resolve(opt('out') || `out/${name}.mp4`);
  const audio = cfg.audio ? path.join(dir, cfg.audio) : null;

  const ff = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-'];
  if (audio) ff.push('-ss', String(from), '-i', audio);
  ff.push('-map', '0:v');
  if (audio) ff.push('-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-af', 'apad');
  ff.push('-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', '-t', String(total / fps), out);
  const proc = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });

  const t0 = Date.now();
  for (let f = 0; f < total; f++) {
    await page.evaluate(t => window.renderAt(t), from + f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!proc.stdin.write(buf)) await new Promise(r => proc.stdin.once('drain', r));
    if (f % 60 === 0) process.stdout.write(`frame ${f}/${total}  (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
  }
  proc.stdin.end();
  const code = await new Promise(r => proc.on('close', r));
  await browser.close();
  if (code !== 0) { console.error('ffmpeg failed', code); process.exit(1); }
  console.log('Wrote', out);
})();
