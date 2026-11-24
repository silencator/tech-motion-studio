# Tech Motion Studio

Code-driven motion graphics for short tech explainers. Master format: 9:16, 1080×1920, 60 fps, 25 Mbps.
Each video is an HTML page (DOM + SVG + Three.js) where every frame is a pure function of time, synced to a
voiceover, then rendered frame-by-frame to MP4 with headless Chromium + ffmpeg (voice + synthesised SFX mixed in).

**House style** (see `videos/battery-ageing`): warm paper background, film grain, Playfair Display Italic hero words
that blur in letter by letter over an Inter Display kicker, 3D hero objects, thin-line callouts, rolling numbers,
one amber accent. Something new on screen every 0.5–1.5 s; camera and objects never stop drifting.

Setup: `npm install` (three.js + fonts).

## Layout
- `engine/anim.js`: easing, tweens, seeded random, colour mixing
- `engine/captions.js`: word-by-word captions from sentence timings
- `engine/render.js`: renderer (frames → ffmpeg, with audio)
- `videos/<name>/`: one folder per video (`index.html`, `scene.js`, audio)
- `assets/sfx`, `assets/fonts`: shared sound effects and fonts

## Commands
```bash
node engine/render.js videos/battery-ageing                       # full video -> out/battery-ageing.mp4
node engine/render.js videos/iphone-battery-aging --from 15 --to 25
node engine/render.js videos/iphone-battery-aging --still 12.5,30  # PNG frames for review
```
Open `videos/<name>/index.html` in a browser to preview with audio and a scrubber.

## Workflow for a new video
1. Voiceover audio + script.
2. Get sentence timings from the audio (pause detection), then put them in `SEGMENTS` in `scene.js`.
3. Plan scenes per line, build them in `index.html`/`scene.js`, check stills, render.
