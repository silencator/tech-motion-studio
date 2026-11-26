#!/usr/bin/env node
// Layout check: calls window.CHECK(t) (if the video defines it) across the timeline and prints any frame
// where text (kicker / hero word / readout label) comes within the gap of an object or graphic.
//   node engine/check.js videos/<name> [--step 0.05]
const { chromium } = require('playwright');
const http = require('http'), path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const dir = path.resolve(args[0]), rel = path.relative(ROOT, dir).split(path.sep).join('/');
const step = +(args[args.indexOf('--step') + 1] || 0.05) || 0.05;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };
const srv = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
srv.listen(0, '127.0.0.1', async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/${rel}/index.html?render=1`);
  await page.waitForFunction(() => window.VIDEO && window.renderAt);
  await page.evaluate(async () => { await document.fonts.ready; if (window.READY) await window.READY; });
  const res = await page.evaluate(step => {
    const out = [];
    for (let t = 0; t <= window.VIDEO.duration; t += step) { const r = window.CHECK(+t.toFixed(3)); if (r.hits.length) out.push(t.toFixed(2) + '  ' + r.hits.join(' | ')); }
    return out;
  }, step);
  console.log(res.length ? res.join('\n') : 'No overlaps.');
  await browser.close(); srv.close();
});
