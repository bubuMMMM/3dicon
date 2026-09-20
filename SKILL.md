---
name: icon-loop
description: Turn a prompt or a still image into a looping animated icon with real transparency — GPT Image / Nano Banana for the art, Kling on Replicate for the motion, exact-unpremultiply matting for the alpha, animated WebP out. Use when asked to animate an app icon, make a 3D icon loop, produce a transparent animated asset, or add motion to flat icon art.
---

# icon-loop

Generate a still, animate it into a seamless loop, key the background out
properly, and encode it as an animated WebP with true soft alpha — the format
`expo-image`, Chrome and Safari all render natively, with no Lottie conversion
and no new native dependency.

## Before anything

1. `pip install -r requirements.txt` (or `uv pip install -r requirements.txt`).
2. `cp .env.example .env` and fill in the keys for the backend you want.
3. `ffmpeg` must be on PATH.

Check the keys are present *before* running — `animate` costs money, and a run
that dies halfway has already spent it.

## The pipeline

```bash
python -m iconloop --out out still   --prompt "a 3D stopwatch, sage green and cream, soft matte plastic"
python -m iconloop --out out animate --motion "the stopwatch rocks gently while its hand sweeps clockwise"
python -m iconloop --out out matte
python -m iconloop --out out encode  --sweep
python -m iconloop --out out encode  --size 288 --name timer
python -m iconloop --out out verify
```

`run` does all of it in one go, but prefer the stages: each one is a place to
look before spending the next thing.

## Rules that matter

**Encode at the source frame rate.** Kling returns 24fps. Sampling down to 8fps
to hit a size target is the single most common way to ruin one of these — it
produces judder that looks like a bad render, bad matting, or a bad player, and
is none of those. `--sweep` prints what each rate actually costs; choose with
the numbers in front of you. Smooth, slow motion suffers worst, so the icons
that most want animating are the ones a low frame rate hurts most.

**`end_image` is set to the start image.** That is what makes Kling return to
its opening pose and the loop close. It is handled for you in `kling.py`; do
not remove it and try to cross-fade instead.

**The backing colour is load-bearing.** The still is flattened onto a known
mid-grey before it is sent. Because the colour is known exactly, the matte
stage solves `C = (F - (1-a)*BG)/a` for the true foreground rather than
estimating it — measured, that cut edge colour error from 26.9 to 15.9. Do not
switch it to chroma-key green or magenta: those spill onto glossy edges.

**Believe the verifier, not the contact sheet.** A render can look animated in
stills and be almost entirely static — it has happened, 1 moving frame out of
121. `verify` measures motion inside the object and exits non-zero. If it says
the render is static, re-prompt; do not encode it.

**Never temporally smooth alpha.** It seems like the obvious anti-flicker move
and it smears a ghost ring around anything that moves.

## What it cannot do

See `docs/limitations.md`. The short version: the soft contact shadow does not
survive matting, file size scales with frame count, transparent MP4 needs an
x265 build most distros do not ship, and an animated WebP cannot honour
reduced-motion — ship the still alongside it.
