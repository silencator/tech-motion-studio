# Tech Motion Studio

Graphic-design motion videos that explain how technology works (short-form, voiceover-driven).
The owner works from an iPhone: everything is built, previewed and rendered in the cloud container.
`videos/battery-ageing/` is the approved reference production. Reuse its system and style for every new video.

## Workflow rules

- **Talk vs. build:** do NOT start building or rendering a video until the owner says to start (e.g. "start", "make the video", "make the full one"). When they are only discussing ideas, just talk.
- **Inputs:** the owner sends a voiceover audio file + text script. The video's length = the audio's length (plus ~0.6 s settle at the end). There is no minimum length.
- **Test first when the style changes:** if asked for a sample, render a ≤ 5 s excerpt before the full video.
- **Deliver:** send the MP4 with SendUserFile, and also commit it to `renders/<name>.mp4` (Git LFS; the `tech-motion-studio` cloud environment allows lfs.github.com) and give the link
  `https://github.com/silencator/tech-motion-studio/raw/claude/youthful-cannon-wip7qx/renders/<name>.mp4` (Safari → Share → Save Video).

## Output format (always)

- 9:16, **1080×1920, 60 fps, 25 Mbps** H.264 (`bitrate: '25M', maxrate: '25M'` in `window.VIDEO`), AAC 320k.
- Voiceover untouched and dominant. Synthesised SFX from `assets/sfx` (whoosh, pop, click, tick, impact) on every motion beat. No music unless asked.

## Creative direction (approved by the owner, keep it)

- **Pace:** something new happens on screen at least every ~1.5 s (aim for 0.5–1 s): a word change, an object turning or exploding, a label drawing on, a number rolling. Between beats the camera keeps pushing/drifting and objects keep floating, so the frame is never static. Fast, fluid, smooth.
- **Type:** kicker line in Inter Display 600 (~52 px) on top; hero word in **Playfair Display Italic 500** (~236 px, auto-fit to width) that blurs in letter by letter and locks on the spoken word, then blurs out into the next. Word times come from the audio.
- **Look:** warm paper background, film grain, soft vignette, contact shadow under objects. Black ink + **one amber accent** (`#e0832a`) for key words, rolls and glows; full warm/orange takeover only for heat moments.
- **Graphics:** 3D hero objects built in Three.js (phone, battery, cell layers, ions…), thin-line callouts with a dot and tracked caps label (`BATTERY.`), rolling picker numbers with a small caps label, rings/ticks, line-art drawn on with stroke animation, iOS-style UI touches (search bar typing, lock screen).
- Invent the visuals from the script, one clear idea per beat. Don't copy reference videos literally.

## Layout rule: text never touches objects

- Text (kicker + hero word) **must never overlap or touch the 3D object, phone, image or any graphic**, at any frame. Keep a clear gap.
- Text lives in the top zone (≈ y 200–520). Frame every object below it with margin, including while it floats, spins, explodes or the camera pushes in. Readouts at the bottom (≈ y 1520+) must also stay clear of objects.
- No "word behind the object" depth effect unless the owner asks for it.
- Before the full render, check stills across the whole timeline (or project the object's bounds against the text boxes) and fix any overlap.

## How the engine works

- `engine/render.js` serves the repo over local HTTP, loads `videos/<name>/index.html?render=1`, calls `window.renderAt(t)` per frame, screenshots, and pipes frames + voiceover (`audio`, `audioStart`) + `sfx` list into ffmpeg.
  - `node engine/render.js videos/<name>` → `out/<name>.mp4`
  - `node engine/render.js videos/<name> --still 1.2,3.4` → PNG stills for review (always check these before a full render)
- `engine/anim.js`: easing, `prog`, `kf` keyframes, seeded `rng`, `mix`. Everything must be a pure function of `t` (no CSS transitions, no `Math.random`, no `Date.now`).
- Setup per container: `npm install` (three.js + Playfair font). Fonts are self-hosted in `assets/fonts`; Inter/Inter Display are installed system-wide.
- Word timing: `ffmpeg -af silencedetect=noise=-28dB:d=0.035` on the voiceover gives near-word boundaries; map the script's words onto them.
- Render speed ≈ 0.55 s per frame (≈ 30–35 min per minute of 60 fps video). Run full renders in the background.
