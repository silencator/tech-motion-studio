#!/usr/bin/env python3
"""Tech Motion Studio brand theme, v2 "chill": original, fully synthesised (no samples).

Neo-soul / chillhop, 80 BPM, F major: Fmaj9 - Em9 - Dm9 - G13sus (one bar each), ~87 s.
Layers: FM electric piano (Rhodes-style, autopan + tape wobble), warm pad, round glide bass,
swung dusty drums (kick, brushy snare, ghost notes, hats), breathy flute lead, vinyl + hiss,
plate-ish convolution reverb, warm saturation.

  python tools/music/compose_chill.py out/brand-chill.wav
"""
import sys, wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
BPM = 80
BEAT = 60 / BPM
BAR = 4 * BEAT
BARS = 28
LEN = BARS * BAR + 3.5
N = int(LEN * SR)
rng = np.random.default_rng(80)
SW = 0.62                                  # swing ratio for 8ths

L = np.zeros(N); R = np.zeros(N)           # dry
RL = np.zeros(N); RR = np.zeros(N)         # reverb send
DL = np.zeros(N); DR = np.zeros(N)         # ducked bus (pad + bass + keys)


def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def lp(x, fc, o=2): return sosfilt(butter(o, fc, 'low', fs=SR, output='sos'), x)
def hp(x, fc, o=2): return sosfilt(butter(o, fc, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def add(bl, br, t0, sig, pan=0.0, g=1.0):
    i = int(t0 * SR)
    if i >= N or i < 0: return
    sig = sig[: N - i] * g; a = (pan + 1) * np.pi / 4
    bl[i:i + len(sig)] += sig * np.cos(a); br[i:i + len(sig)] += sig * np.sin(a)
def add2(bl, br, t0, sl, sr_, g=1.0):
    i = int(t0 * SR)
    if i >= N: return
    n = min(len(sl), N - i); bl[i:i + n] += sl[:n] * g; br[i:i + n] += sr_[:n] * g
def sw8(beat_pos):
    """swung position (in beats) for an 8th-note grid index."""
    return (beat_pos // 1) + (SW if beat_pos % 1 >= 0.5 else 0)
ON = lambda bar, rs: any(a <= bar <= b for a, b in rs)
wob = lambda t: 1 + 0.0018 * np.sin(2 * np.pi * 0.55 * t) + 0.0007 * np.sin(2 * np.pi * 5.3 * t)   # tape wow + flutter

# ----------------------------------------------------------------------------- harmony
CHORDS = [  # (rhodes voicing, bass root)
    ([53, 57, 60, 64, 67, 69], 41),  # Fmaj9   F A C E G A
    ([52, 55, 59, 62, 66, 67], 40),  # Em9     E G B D F# G
    ([50, 53, 57, 60, 64, 65], 38),  # Dm9     D F A C E F
    ([55, 60, 62, 65, 69, 64], 43),  # G13sus  G C D F A E
]
chord = lambda bar: CHORDS[bar % 4] if bar < BARS - 1 else CHORDS[0]

# ----------------------------------------------------------------------------- FM electric piano
def rhodes(m, dur, vel, t_abs):
    n = int((dur + 2.8) * SR); t = np.arange(n) / SR
    f = mtof(m) * wob(t + t_abs)
    ph = 2 * np.pi * np.cumsum(f) / SR
    idx = (0.9 + 1.4 * vel) * np.exp(-t / 0.35) + 0.25
    body = np.sin(ph + idx * np.sin(ph))
    tine = 0.22 * vel * np.sin(ph * 14.0) * np.exp(-t / 0.05)          # bell-like attack
    bark = 0.15 * vel * np.tanh(3 * np.sin(ph)) * np.exp(-t / 0.4)      # a little grit when hit harder
    amp = np.clip(t / 0.003, 0, 1) * (0.65 * np.exp(-t / 0.7) + 0.35 * np.exp(-t / 2.6))
    rel = np.clip(1 - (t - dur) / 0.35, 0, 1)
    s = (body + tine + bark) * amp * rel * vel
    return lp(s, 2600 + 2400 * vel)

def keys_hit(bar_t, notes, beat, dur, vel, spread=0.012):
    t0 = bar_t + beat * BEAT
    sl = np.zeros(int((dur + 3.2) * SR)); sr_ = np.zeros_like(sl)
    for k, m in enumerate(notes):
        v = vel * (0.85 + 0.3 * rng.random()) * (0.9 if k else 1.0)
        s = rhodes(m, dur, v, t0)
        off = int((k * spread + rng.random() * 0.006) * SR)
        sl[off:off + len(s)] += s[: len(sl) - off]; sr_[off:off + len(s)] += s[: len(sl) - off]
    tt = np.arange(len(sl)) / SR + t0
    pan = 0.45 * np.sin(2 * np.pi * 0.5 * tt)                               # slow suitcase-style autopan
    gl = np.cos((pan + 1) * np.pi / 4); gr = np.sin((pan + 1) * np.pi / 4)
    return t0, sl * gl, sr_ * gr

COMP = [  # (beat, dur, vel, which notes)
    (0.0, 1.4, 0.75, 'all'), (1.5 + SW - 0.5, 0.45, 0.45, 'top'), (2.5, 0.9, 0.6, 'all'), (3.5 + SW - 0.5, 0.4, 0.5, 'top'),
]
for bar in range(BARS):
    notes, root = chord(bar)
    bt = bar * BAR
    if bar == BARS - 1:
        t0, sl, sr_ = keys_hit(bt, notes + [notes[-2] + 12], 0, 2.8, 0.7, 0.03)
        add2(DL, DR, t0, sl, sr_, 0.05); add2(RL, RR, t0, sl, sr_, 0.04); continue
    intro = bar < 4
    for (b, d, v, which) in COMP:
        if intro and b > 2.6: continue
        ns = notes if which == 'all' else notes[2:]
        t0, sl, sr_ = keys_hit(bt, ns, b + (0.03 if b else 0), d, v * (0.8 if intro else 1), 0.016 if b == 0 else 0.008)
        add2(DL, DR, t0, sl, sr_, 0.05); add2(RL, RR, t0, sl, sr_, 0.035)
    # little fill on the last bar of each 4-bar loop
    if bar % 4 == 3 and not intro:
        for k, m in enumerate([notes[-1] + 12, notes[-2] + 12, notes[-3] + 12, notes[-1] + 7]):
            t0 = bt + (3 + k * 0.25) * BEAT
            s = rhodes(m, 0.25, 0.4, t0)
            add(DL, DR, t0, s, 0.35, 0.045); add(RL, RR, t0, s, 0, 0.04)

# ----------------------------------------------------------------------------- warm pad bed
for bar in range(BARS):
    notes, _ = chord(bar)
    hold = BAR + (1.5 if bar == BARS - 1 else 0); rel = 1.8
    n = int((hold + rel) * SR); t = np.arange(n) / SR
    pl = np.zeros(n); pr = np.zeros(n)
    for m in notes[1:5]:
        f = mtof(m)
        for v, c in enumerate([-12, -5, 0, 5, 12]):
            tri = 2 * np.abs(2 * ((f * 2 ** (c / 1200) * t + rng.random()) % 1) - 1) - 1
            a = ((v - 2) / 2 * 0.9 + 1) * np.pi / 4
            pl += tri * np.cos(a); pr += tri * np.sin(a)
    e = np.clip(t / 0.9, 0, 1) * np.clip(1 - (t - hold) / rel, 0, 1)
    g = 0.006 * (1.3 if 20 <= bar <= 23 else 1.0)
    add2(DL, DR, bar * BAR, lp(pl, 1600, 4) * e, lp(pr, 1600, 4) * e, g)
    add2(RL, RR, bar * BAR, lp(pl, 1600, 4) * e, lp(pr, 1600, 4) * e, g * 0.8)

# ----------------------------------------------------------------------------- round bass with glides
BASSLINE = [(0, 0, 1.4), (2.5 - 0.5 + SW, 7, 0.4), (3.0, 12, 0.5), (3.5 - 0.5 + SW, 10, 0.35)]
def bass_note(m, m_next, dur):
    n = int((dur + 0.25) * SR); t = np.arange(n) / SR
    f0, f1 = mtof(m), mtof(m_next if m_next else m)
    glide = np.clip((t - (dur - 0.07)) / 0.07, 0, 1) if m_next else 0
    f = f0 * (f1 / f0) ** glide
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)
    e = np.clip(t / 0.012, 0, 1) * (0.7 + 0.3 * np.exp(-t / 0.3)) * np.clip(1 - (t - dur) / 0.12, 0, 1)
    return lp(np.tanh(1.4 * s) * e, 650)
for bar in range(4, BARS):
    if ON(bar, [(20, 21)]): continue
    _, root = chord(bar); _, nroot = chord(bar + 1)
    line = BASSLINE if bar < BARS - 1 else [(0, 0, 2.6)]
    for k, (b, iv, d) in enumerate(line):
        nxt = root + line[k + 1][1] if k + 1 < len(line) else (nroot if bar < BARS - 1 else None)
        add(DL, DR, bar * BAR + b * BEAT, bass_note(root + iv, nxt if k == len(line) - 1 else None, d * BEAT), 0, 0.11)

# ----------------------------------------------------------------------------- drums (lofi, swung, laid back)
kick_t = []
def kick(v=1):
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 58 + 60 * np.exp(-t / 0.035); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t / 0.22) + 0.12 * lp(rng.standard_normal(n), 3000) * np.exp(-t / 0.006)
    return lp(np.tanh(2 * s), 4000) * 0.13 * v
def snare(v=1):
    n = int(0.5 * SR); t = np.arange(n) / SR
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.05)
    nz = bp(rng.standard_normal(n), 900, 6000) * (0.8 * np.exp(-t / 0.09) + 0.2 * np.exp(-t / 0.25))   # brushy tail
    return lp(0.5 * body + nz, 6500) * 0.07 * v
def hat(v=1, open_=False):
    n = int((0.3 if open_ else 0.07) * SR); t = np.arange(n) / SR
    return lp(hp(rng.standard_normal(n), 6500, 3), 10000) * np.exp(-t / (0.11 if open_ else 0.02)) * 0.05 * v
for bar in range(BARS - 1):
    bt = bar * BAR
    full = ON(bar, [(4, 19), (24, 26)])
    brk = ON(bar, [(20, 23)])
    if not (full or brk): continue
    if full:
        for b in ([0, 2.5 - 0.5 + SW] if bar % 2 == 0 else [0, 1.5 - 0.5 + SW, 2.5]):
            kick_t.append(bt + b * BEAT); add(L, R, bt + b * BEAT, kick(), 0)
        for b in (1, 3):
            s = snare(); add(L, R, bt + (b + 0.035) * BEAT, s, 0.08); add(RL, RR, bt + (b + 0.035) * BEAT, s, 0, 0.9)
        for gb in (1.75, 3.75 if bar % 4 == 3 else None):
            if gb: add(L, R, bt + gb * BEAT, snare(0.25), 0.1)
    for k in range(8):
        b = sw8(k * 0.5)
        v = (0.9 if k % 2 == 0 else 0.55) * (0.7 if brk else 1)
        add(L, R, bt + b * BEAT + 0.008, hat(v, open_=(k == 7 and bar % 4 == 1)), 0.32)
    if brk:
        add(L, R, bt, lp(kick(0.6), 250), 0)   # felt-like pulse only

# ----------------------------------------------------------------------------- breathy flute lead
MEL = [  # (bar offset in 8-bar phrase, beat, midi, dur beats)
    (0, 0.5, 76, 1.5), (0, 2.5, 74, 1), (0, 3.5, 72, 2.5), (1, 2.5, 71, 0.5), (1, 3, 72, 1),
    (2, 0, 69, 2.5), (2, 3, 72, 1), (3, 0, 74, 3.5),
    (4, 0.5, 76, 1), (4, 1.5, 79, 1.5), (4, 3, 76, 1), (5, 0, 74, 2), (5, 2.5, 72, 1.5),
    (6, 0, 69, 1.5), (6, 2, 72, 1), (6, 3, 74, 1), (7, 0, 72, 3.8),
]
def flute(m, dur, vel, t_abs):
    n = int((dur + 1.2) * SR); t = np.arange(n) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.25) / 0.4, 0, 1)
    f = mtof(m) * vib * wob(t + t_abs); ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.05 * np.sin(3 * ph)
    breath = bp(rng.standard_normal(n), mtof(m) * 0.9, mtof(m) * 3.5) * 0.25
    e = np.clip(t / 0.09, 0, 1) ** 1.5 * np.clip(1 - (t - dur) / 0.35, 0, 1) * (0.9 + 0.1 * np.sin(2 * np.pi * 0.7 * t))
    chiff = hp(rng.standard_normal(n), 2000) * np.exp(-t / 0.03) * 0.08
    return lp((tone + breath) * e + chiff, 5500) * vel
for start in (12, 24):
    for (bo, b, m, d) in MEL:
        bar = start + bo
        if bar > BARS - 1: continue
        t0 = bar * BAR + b * BEAT
        s = flute(m, d * BEAT, 0.035, t0)
        add(L, R, t0, s, -0.12); add(RL, RR, t0, s, 0, 1.2)
        # soft echo
        add(L, R, t0 + 0.75 * BEAT, lp(s, 2500), 0.5, 0.35); add(L, R, t0 + 1.5 * BEAT, lp(s, 1800), -0.5, 0.15)

# ----------------------------------------------------------------------------- texture: vinyl, hiss, room tone
t_all = np.arange(N) / SR
crack = (rng.random(N) > 0.9996) * rng.standard_normal(N) * 0.06
crack = hp(lp(crack, 7000), 1200)
pops = (rng.random(N) > 0.99998) * 0.12
hiss = hp(lp(rng.standard_normal(N), 9000), 3000) * 0.0025
L += crack + lp(pops, 1500) + hiss; R += np.roll(crack, 911) + lp(np.roll(pops, 3000), 1500) + np.roll(hiss, 501)

# ----------------------------------------------------------------------------- mix bus
duck = np.ones(N)
for kt in kick_t:
    i = int(kt * SR); n = min(int(0.4 * SR), N - i); tt = np.arange(n) / SR
    duck[i:i + n] = np.minimum(duck[i:i + n], 1 - 0.22 * np.exp(-tt / 0.14))
L += DL * duck; R += DR * duck

ir_n = int(2.6 * SR); ti = np.arange(ir_n) / SR
def ir():
    x = rng.standard_normal(ir_n) * np.exp(-ti / 0.6)
    x = lp(x, 6500) * 0.6 + lp(x, 2200) * 0.4; x[: int(0.018 * SR)] = 0
    return x / np.sqrt(np.sum(x ** 2))
RL = hp(RL, 200); RR = hp(RR, 200)
L += fftconvolve(RL, ir())[:N] * 0.85; R += fftconvolve(RR, ir())[:N] * 0.85

# intro filter: open a low-pass over the first 4 bars (the "record starting" feel)
def sweep(x):
    out = np.copy(x); seg = int(0.05 * SR); end = int(2 * BAR * SR)
    zi = None
    from scipy.signal import sosfilt_zi
    for i in range(0, end, seg):
        fc = 1300 * (16000 / 1300) ** (i / end)
        sos = butter(2, fc, 'low', fs=SR, output='sos')
        if zi is None: zi = sosfilt_zi(sos) * x[0]
        out[i:i + seg], zi = sosfilt(sos, x[i:i + seg], zi=zi)
    return out
L = sweep(L); R = sweep(R)

L = hp(L, 35, 3); R = hp(R, 35, 3)
L = L - 0.3 * lp(L, 100) + 0.35 * hp(L, 6000); R = R - 0.3 * lp(R, 100) + 0.35 * hp(R, 6000)
L = lp(L, 15000); R = lp(R, 15000)                               # slightly vintage top
mid = (L + R) / 2; side = (L - R) / 2 * 1.2; L, R = mid + side, mid - side
fade = np.clip(t_all / 1.0, 0, 1) * np.clip((LEN - t_all) / 3.0, 0, 1)
L *= fade; R *= fade
pk = max(np.abs(L).max(), np.abs(R).max()); L /= pk / 0.9; R /= pk / 0.9
L = np.tanh(L * 1.5) / np.tanh(1.5); R = np.tanh(R * 1.5) / np.tanh(1.5)   # warm tape-ish glue

out = sys.argv[1] if len(sys.argv) > 1 else 'brand-chill.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.stack([L, R], 1) * 32767 * 0.95).astype(np.int16).tobytes())
print(f'wrote {out}  {LEN:.1f}s')
