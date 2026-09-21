---
name: animated-3d-icon
description: Turn a prompt or a still image into a looping animated icon with real transparency — GPT Image / Nano Banana for the art, Kling on Replicate for the motion, exact-unpremultiply matting for the alpha, animated WebP out. Use when asked to animate an app icon, make a 3D icon loop, produce a transparent animated asset, or add motion to flat icon art.
---

# animated-3d-icon

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

## Always stop after the still

One still, then ask. Never generate several takes to choose from, and never
run through to the animation without the user seeing the art first.

1. Generate exactly ONE still.
2. **Show it to the user** and ask plainly whether they are happy with the
   static design before anything else happens.
3. Only on a yes, animate it.

Why this is a hard rule, not a nicety: the still is 13 cents and the full run is
48 cents and four minutes, and every later stage inherits the still's object,
colour and weight. Animating art the user has not approved means paying twice.
`run` therefore stops after the still on purpose.

If they are not happy, adjust the prompt and generate one replacement — not a
grid of options. Variants exist behind `--variants` but are off by default and
should stay that way unless the user asks to compare.

## The pipeline

```bash
python -m iconloop --out out still   --prompt "a 3D stopwatch, sage green and cream, soft matte plastic"
python -m iconloop --out out animate --motion "the stopwatch rocks gently while its hand sweeps clockwise"
python -m iconloop --out out matte
python -m iconloop --out out encode  --sweep
python -m iconloop --out out encode  --size 288 --name timer
python -m iconloop --out out verify
```

`run` is just `still` plus the reminder to stop and ask. The stages are
separate because each one is a place to look before spending the next thing.

## Choosing the motion

Before animating, answer one question: **what does this object do when left
alone?** The answer picks the strategy, and picking it wrong is the main cause
of a dull or generic result.

| answer | strategy | what you get |
|---|---|---|
| It moves by itself — flows, burns, breathes, ticks | `native` | continuous motion from its own physics |
| Nothing. It is inert until used | `event` | it performs its function once, then rests |
| Nothing, but part of it is loose, hinged or light | `part` | the body anchors, one small piece moves |
| Nothing, and it has no moving parts at all | `surface` | light or material travels across a fixed form |

Most objects people ask for are **inert**. Asking an inert object to move
naturally is what produces a turntable spin or an aimless bob — it has no
natural motion, so the model supplies a generic one. Reach for `event` first
unless the thing genuinely moves on its own.

Add `--emit` when the action would realistically throw something off — a
fragment, a droplet, a spark, a glint. For an inert object that emission is
often the entire reason the animation reads at icon size.

`event` and `part` also permit the object to be **temporarily altered** —
something removed, opened, split, filled — as long as it returns to its
opening state so the loop closes. Without that permission an object can only
ever jiggle.

Then say in `--motion` what the specific action is, in plain physical language.
Describe what happens to the material, not what the animation should feel like.

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
