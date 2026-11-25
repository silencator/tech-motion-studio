#!/usr/bin/env python3
"""Tech Motion Studio brand bed: original, fully synthesised (no samples).

Warm ambient tech-pop, 100 BPM, D major (Dmaj9 - Bm11 - Gmaj9#11 - A6/9), ~89 s.
Layers: detuned saw pads, felt piano, FM pluck arpeggio with ping-pong delay, sidechained sub,
soft kick / clap / hats / shaker, bell lead, noise swells, air texture, convolution reverb.

  python tools/music/compose.py out/brand-bed.wav
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
BPM = 100
BEAT = 60 / BPM
BAR = 4 * BEAT
BARS = 36
LEN = BARS * BAR + 2.6
N = int(LEN * SR)
rng = np.random.default_rng(1207)

L = np.zeros(N); Rr = np.zeros(N)          # dry bus
RL = np.zeros(N); RR = np.zeros(N)         # reverb send
DL = np.zeros(N); DR = np.zeros(N)         # delay send (pluck)
SIDE = np.zeros(N)                         # sidechained bus (pads + sub) mono-ish weights handled below
PL = np.zeros(N); PR = np.zeros(N)         # pad/sub bus that gets ducked


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def add(bufL, bufR, t0, sig, pan=0.0, gain=1.0):
    """Mix mono sig at time t0 with equal-power pan (-1..1)."""
    i = int(t0 * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    a = (pan + 1) * np.pi / 4
    bufL[i:i + len(sig)] += sig * np.cos(a)
    bufR[i:i + len(sig)] += sig * np.sin(a)


def env_adsr(n, a, d, s, r_start, r):
    t = np.arange(n) / SR
    e = np.where(t < a, 0.5 - 0.5 * np.cos(np.pi * t / max(a, 1e-4)), 1.0)
    e = np.where((t >= a) & (t < a + d), 1 - (1 - s) * (t - a) / max(d, 1e-4), e)
    e = np.where(t >= a + d, s, e) if d > 0 else e
    rel = np.clip((t - r_start) / r, 0, 1)
    return e * (0.5 + 0.5 * np.cos(np.pi * rel)) * (t < r_start + r)


# ----------------------------------------------------------------------------- harmony
CHORDS = [
    ([50, 57, 61, 64, 66], 38),   # Dmaj9
    ([47, 54, 57, 62, 64], 35),   # Bm11
    ([43, 50, 54, 57, 61], 31),   # Gmaj9(#11)
    ([45, 52, 59, 61, 66], 33),   # A6/9
]
def chord_at(bar):
    return CHORDS[(bar // 2) % 4] if bar < 34 else CHORDS[0]

ON = lambda bar, ranges: any(a <= bar <= b for a, b in ranges)

# ----------------------------------------------------------------------------- pads
pad_cut = lambda bar: (1500 + 150 * bar if bar < 4 else 2400 if bar < 12 else 3800 if bar < 28 else 1800 if bar < 32 else 3000)
for blk in range(0, 36, 2):
    notes, _ = chord_at(blk)
    t0 = blk * BAR
    hold = 2 * BAR if blk < 34 else 2 * BAR + 0.4
    rel = 2.4
    n = int((hold + rel) * SR)
    t = np.arange(n) / SR
    padL = np.zeros(n); padR = np.zeros(n)
    for k, m in enumerate(notes):
        f = mtof(m)
        for v, c in enumerate([-15, -9, -4, 0, 4, 9, 15]):
            ph = rng.random()
            saw = 2 * ((f * 2 ** (c / 1200) * t + ph) % 1) - 1
            pan = (v - 3) / 3 * 0.8
            a = (pan + 1) * np.pi / 4
            padL += saw * np.cos(a); padR += saw * np.sin(a)
        air = np.sin(2 * np.pi * f * 2 * t + k) * 0.6           # octave-up sine shimmer
        padL += air; padR += air
    e = env_adsr(n, 1.1 if blk else 2.5, 0, 1, hold, rel)
    shimmer = 1 + 0.08 * np.sin(2 * np.pi * 0.23 * t + blk)
    fc = pad_cut(blk)
    sigL = lp(padL, fc, 4) * e * shimmer; sigR = lp(padR, fc, 4) * e * shimmer
    lvl = 0.0105 * (0.75 if blk < 4 else 1.0) * (1.0 if blk < 34 else 0.9)
    i = int(t0 * SR); j = min(N, i + n)
    PL[i:j] += sigL[: j - i] * lvl; PR[i:j] += sigR[: j - i] * lvl
    RL[i:j] += sigL[: j - i] * lvl * 0.5; RR[i:j] += sigR[: j - i] * lvl * 0.5

# ----------------------------------------------------------------------------- sub bass
for bar in range(36):
    if not ON(bar, [(4, 27), (30, 35)]):
        continue
    _, root = chord_at(bar)
    for half in range(2):
        t0 = bar * BAR + half * 2 * BEAT
        dur = 2 * BEAT if bar < 35 else 4 * BEAT
        n = int((dur + 0.3) * SR); t = np.arange(n) / SR
        f = mtof(root)
        s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t)
        e = env_adsr(n, 0.02, 0.4, 0.75, dur - 0.05, 0.25)
        g = 0.085 * (0.7 if bar < 8 else 1.0)
        add(PL, PR, t0, s * e, 0, g)

# ----------------------------------------------------------------------------- felt piano
def piano(m, dur, vel):
    n = int((dur + 2.5) * SR); t = np.arange(n) / SR; f = mtof(m)
    s = np.zeros(n)
    for h, (amp, dec) in enumerate([(1, 2.4), (0.45, 1.6), (0.22, 1.1), (0.12, 0.8), (0.06, 0.5)], start=1):
        s += amp * np.sin(2 * np.pi * f * h * (1 + 0.0004 * h * h) * t) * np.exp(-t / dec)
    att = np.clip(t / 0.006, 0, 1)
    rel = np.clip(1 - (t - dur) / 0.6, 0, 1)
    hammer = bp(rng.standard_normal(n), 800, 3000) * np.exp(-t / 0.01) * 0.15
    return lp((s + hammer) * att * rel, 5200) * vel

for bar in range(36):
    if not ON(bar, [(0, 11), (28, 31), (32, 35)]) or bar % 2:
        continue
    notes, root = chord_at(bar)
    t0 = bar * BAR
    voicing = [root + 12] + [m + 12 for m in notes[1:]]
    for k, m in enumerate(voicing):
        sig = piano(m, 2 * BAR - 0.2, 0.06 if k else 0.075)
        add(L, Rr, t0 + k * 0.035, sig, -0.35 + k * 0.15)
        add(RL, RR, t0 + k * 0.035, sig, 0, 0.6)
    # little answering phrase in the second bar
    for k, (off, m) in enumerate([(2, notes[-1] + 12), (2.5, notes[-2] + 12), (3, notes[2] + 24)]):
        if bar >= 4 or k == 0:
            sig = piano(m, 0.8, 0.04)
            add(L, Rr, t0 + BAR + off * BEAT, sig, 0.3)
            add(RL, RR, t0 + BAR + off * BEAT, sig, 0, 0.7)

# ----------------------------------------------------------------------------- FM pluck arp
def pluck(m, vel):
    n = int(0.9 * SR); t = np.arange(n) / SR; f = mtof(m)
    idx = 3.2 * np.exp(-t / 0.07)
    s = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * 2 * t))
    return s * np.exp(-t / 0.22) * np.clip(t / 0.002, 0, 1) * vel

PATTERN = [0, 2, 4, 1, 3, 4, 2, 3]
for bar in range(36):
    if not ON(bar, [(4, 27), (28, 31), (32, 34)]):
        continue
    notes, _ = chord_at(bar)
    tones = sorted(notes[1:])
    for s16 in range(16):
        m = tones[PATTERN[s16 % 8] % 4] + 12 + (12 if s16 % 8 == 4 and bar >= 16 else 0)
        vel = (0.05 if bar < 8 else 0.07) * (1.0 if s16 % 4 == 0 else 0.72) * (0.6 if 28 <= bar <= 31 else 1)
        t0 = bar * BAR + s16 * BEAT / 4 + (0.012 if s16 % 2 else 0)   # tiny swing
        sig = pluck(m, vel)
        if 28 <= bar <= 31:
            sig = lp(sig, 3200)
        add(L, Rr, t0, sig, 0.25 if s16 % 2 else -0.25)
        add(DL, DR, t0, sig, 0, 0.9)
        add(RL, RR, t0, sig, 0, 0.35)

# ----------------------------------------------------------------------------- bell lead
MELODY = [(0, 78, 1.5), (1.5, 76, 0.5), (2, 73, 1.5), (4, 71, 1), (5, 73, 1), (6, 69, 2),
          (8, 74, 1.5), (9.5, 73, 0.5), (10, 71, 2), (12, 66, 1), (13, 69, 1), (14, 71, 2),
          (16, 74, 1), (17, 73, 1), (18, 69, 1.5), (20, 66, 2), (22, 67, 2),
          (24, 69, 1.5), (25.5, 71, 0.5), (26, 73, 2), (28, 76, 3.5)]
def bell(m, dur, vel):
    n = int((dur + 2.0) * SR); t = np.arange(n) / SR; f = mtof(m)
    s = np.sin(2 * np.pi * f * t + 0.8 * np.exp(-t / 0.3) * np.sin(2 * np.pi * f * 3.5 * t))
    s += 0.3 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.6)
    e = np.clip(t / 0.01, 0, 1) * np.exp(-t / 1.4) * np.clip(1 - (t - dur) / 0.8, 0, 1)
    return s * e * vel

for loop_start in (16, 24, 32):
    for off, m, d in MELODY:
        bar = loop_start + int(off // 4)
        if bar > 35 or (loop_start == 32 and off >= 16):
            continue
        t0 = loop_start * BAR + off * BEAT
        sig = bell(m, d * BEAT, 0.05 if loop_start < 24 else 0.06)
        add(L, Rr, t0, sig, 0.1)
        add(DL, DR, t0, sig, 0, 0.5)
        add(RL, RR, t0, sig, 0, 0.9)

# ----------------------------------------------------------------------------- drums
kick_times = []
def kick():
    n = int(0.5 * SR); t = np.arange(n) / SR
    f = 54 + 80 * np.exp(-t / 0.04)
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-t / 0.2) + 0.45 * bp(rng.standard_normal(n), 2500, 8000) * np.exp(-t / 0.004)
    return np.tanh(1.6 * s) * 0.145

def clap():
    n = int(0.6 * SR); t = np.arange(n) / SR
    nz = bp(rng.standard_normal(n), 900, 4500)
    e = sum(np.exp(-np.clip(t - d, 0, None) / 0.012) * (t >= d) for d in (0, 0.011, 0.023)) + 0.6 * np.exp(-t / 0.12)
    return nz * e * 0.05

def hat(open_=False):
    n = int((0.35 if open_ else 0.08) * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000, 4) * np.exp(-t / (0.12 if open_ else 0.022)) * (0.07 if open_ else 0.065)

def shaker():
    n = int(0.09 * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 5000, 11000) * np.sin(np.pi * np.clip(t / 0.09, 0, 1)) ** 2 * 0.03

for bar in range(36):
    if not ON(bar, [(12, 27), (32, 34)]):
        continue
    for b in range(4):
        t0 = bar * BAR + b * BEAT
        kick_times.append(t0)
        add(L, Rr, t0, kick(), 0)
        if b in (1, 3) and bar >= 16:
            c = clap(); add(L, Rr, t0, c, 0.05); add(RL, RR, t0, c, 0, 1.4)
        add(L, Rr, t0 + BEAT / 2, hat(open_=(b == 3 and bar % 4 == 3)), 0.3)
        for s in range(4):
            if bar >= 14:
                add(L, Rr, t0 + s * BEAT / 4 + (0.018 if s % 2 else 0), shaker() * (1.0 if s % 2 else 0.6), -0.45)
# soft kick pulse in the breakdown so the groove never fully stops
for bar in range(29, 32):
    for b in (0, 2):
        t0 = bar * BAR + b * BEAT
        add(L, Rr, t0, lp(kick(), 300), 0, 0.6)

# ----------------------------------------------------------------------------- glass shimmer (intro + breakdown sparkle)
for blk in range(0, 36, 2):
    if not ON(blk, [(0, 11), (28, 31), (34, 35)]):
        continue
    notes, _ = chord_at(blk)
    n = int((2 * BAR + 2.0) * SR); t = np.arange(n) / SR
    e = env_adsr(n, 1.4, 0, 1, 2 * BAR, 2.0)
    for k, m in enumerate(notes[2:]):
        f = mtof(m + 24)
        trem = 0.6 + 0.4 * np.sin(2 * np.pi * (0.9 + 0.3 * k) * t + k)
        sig = (np.sin(2 * np.pi * f * t) + 0.2 * np.sin(4 * np.pi * f * t)) * e * trem * 0.012
        add(L, Rr, blk * BAR, sig, (-0.6, 0.0, 0.6)[k % 3])
        add(RL, RR, blk * BAR, sig, 0, 1.5)

# ----------------------------------------------------------------------------- swells & texture
def swell(t_end, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    out = np.zeros(n); seg = int(0.05 * SR)
    for i in range(0, n, seg):                       # rising band-pass sweep
        p = i / n; fc = 400 + 6000 * p ** 2
        out[i:i + seg] = bp(nz[i:i + seg + 1][:seg], fc * 0.7, min(fc * 1.4, 19000))[:len(out[i:i + seg])]
    return out * (t / dur) ** 2.5 * 0.05
for te in (12 * BAR, 32 * BAR):
    sw = swell(te, 2 * BAR)
    add(L, Rr, te - 2 * BAR, sw, -0.3); add(RL, RR, te - 2 * BAR, sw, 0.3, 1.2)

air = lp(np.cumsum(rng.standard_normal(N)) * 0.0005, 900)
air -= lp(air, 40)
crackle = (rng.random(N) > 0.99985) * rng.standard_normal(N) * 0.03
L += air * 0.5 + hp(crackle, 2000); Rr += np.roll(air, 1234) * 0.5 + hp(np.roll(crackle, 777), 2000)

# ----------------------------------------------------------------------------- sidechain + effects
t_all = np.arange(N) / SR
duck = np.ones(N)
for kt in kick_times:
    i = int(kt * SR); n = int(0.5 * SR); tt = np.arange(min(n, N - i)) / SR
    duck[i:i + len(tt)] = np.minimum(duck[i:i + len(tt)], 1 - 0.38 * np.exp(-tt / 0.16))
L += PL * duck; Rr += PR * duck

# ping-pong dotted-eighth delay
dly = int(0.75 * BEAT * SR)
dl = np.zeros(N); dr = np.zeros(N)
srcL, srcR = lp(DL, 4500), lp(DR, 4500)
fb = 0.38
for k in range(1, 7):
    g = fb ** (k - 1) * 0.55
    sh = dly * k
    if sh >= N: break
    if k % 2: dr[sh:] += srcL[:N - sh] * g
    else: dl[sh:] += srcL[:N - sh] * g
L += dl; Rr += dr
RL += dl * 0.4; RR += dr * 0.4

# convolution reverb: decorrelated exponentially decaying noise, 3.2 s, darkened
ir_n = int(3.2 * SR); ti = np.arange(ir_n) / SR
def ir():
    x = rng.standard_normal(ir_n) * np.exp(-ti / 0.75)
    x = lp(x, 8000) * 0.7 + lp(x, 2500) * 0.3
    x[: int(0.022 * SR)] = 0
    return x / np.sqrt(np.sum(x ** 2))
RL = hp(RL, 180); RR = hp(RR, 180)
wetL = fftconvolve(RL, ir())[:N]; wetR = fftconvolve(RR, ir())[:N]
L += wetL * 0.9; Rr += wetR * 0.9

# ----------------------------------------------------------------------------- master
L = hp(L, 38, 3); Rr = hp(Rr, 38, 3)
# tone: tame lows below ~90 Hz, lift air above ~5 kHz
L = L - 0.45 * lp(L, 90) + 0.7 * hp(L, 5000); Rr = Rr - 0.45 * lp(Rr, 90) + 0.7 * hp(Rr, 5000)
mid = (L + Rr) / 2; side = (L - Rr) / 2 * 1.15            # a touch wider
L, Rr = mid + side, mid - side
fade_in = np.clip(t_all / 1.5, 0, 1) ** 2
fade_out = np.clip((LEN - t_all) / 2.2, 0, 1)
L *= fade_in * fade_out; Rr *= fade_in * fade_out
peak = max(np.max(np.abs(L)), np.max(np.abs(Rr)))
L /= peak / 0.9; Rr /= peak / 0.9
L = np.tanh(L * 1.3) / np.tanh(1.3); Rr = np.tanh(Rr * 1.3) / np.tanh(1.3)   # gentle glue

out = sys.argv[1] if len(sys.argv) > 1 else 'brand-bed.wav'
pcm = (np.stack([L, Rr], 1) * 32767 * 0.95).astype(np.int16)
import wave
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f'wrote {out}  {LEN:.1f}s')
