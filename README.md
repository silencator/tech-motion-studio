# Tech Motion Studio

Code-driven motion graphics for short tech explainers (9:16, 1080×1920, 30 fps).
Each video is an HTML page where every frame is a pure function of time, synced to a voiceover,
then rendered frame-by-frame to MP4 with headless Chromium + ffmpeg.

## Layout
- `engine/anim.js`: easing, tweens, seeded random, colour mixing
- `engine/captions.js`: word-by-word captions from sentence timings
- `engine/render.js`: renderer (frames → ffmpeg, with audio)
- `videos/<name>/`: one folder per video (`index.html`, `style.css`, `scene.js`, voiceover audio)

## Commands
```bash
node engine/render.js videos/iphone-battery-aging                 # full video -> out/iphone-battery-aging.mp4
node engine/render.js videos/iphone-battery-aging --from 15 --to 25
node engine/render.js videos/iphone-battery-aging --still 12.5,30  # PNG frames for review
```
Open `videos/<name>/index.html` in a browser to preview with audio and a scrubber.

## Workflow for a new video
1. Voiceover audio + script.
2. Get sentence timings from the audio (pause detection), then put them in `SEGMENTS` in `scene.js`.
3. Plan scenes per line, build them in `index.html`/`scene.js`, check stills, render.
