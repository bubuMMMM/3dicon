# /3dicon

**One prompt in, a looping animated 3D icon out** — with real transparency for icons you can drop straight into an app UI.

<p align="center">
  <img src="skills/3dicon/examples/banner.webp" width="820" alt="eight icons looping around the 3dicon wordmark">
</p>

## Web interface

The repository now includes a Vercel-ready web studio. It lets you describe an icon, generate a transparent-ready still through OpenRouter, then start a short looping animation.

### Deploy

1. Import `https://github.com/bubuMMMM/3dicon` into Vercel.
2. Add `OPENROUTER_API_KEY` as a **server-only** environment variable for Production, Preview and Development.
3. Redeploy once after saving the variable.

Optional variables:

```
OPENROUTER_IMAGE_MODEL=
OPENROUTER_VIDEO_MODEL=bytedance/seedance-2.0
APP_URL=https://your-domain.vercel.app
```

The browser never receives the OpenRouter key. Calls are handled by the Vercel functions in `api/`.

## Claude skill

```
/plugin marketplace add samyost1/3dicon
/plugin install 3dicon
```

One OpenRouter key covers the whole pipeline — the image model and the video model both run through it.

```bash
cd ~/.claude/skills/3dicon
pip install -r requirements.txt
cp .env.example .env
```

Put your key in `.env`:

```
OPENROUTER_API_KEY=sk-or-...
```

Get one at [openrouter.ai/keys](https://openrouter.ai/keys).

`ffmpeg` must be on PATH. The first run downloads a ~180MB matting model.

## Use

Ask for it in plain words:

> make an animated 3d fire icon using /3dicon

It generates one still, shows it, and waits for you to approve it before spending anything on motion. Then it proposes the motion and waits again.

## How it works

```mermaid
flowchart LR
    P["your prompt"] --> S["still image<br/><sub>GPT Image</sub>"]
    S --> F["first frame"]
    S --> L["last frame"]
    F --> V["video model<br/><sub>Seedance</sub>"]
    L --> V
    V --> M["remove background<br/><sub>every frame</sub>"]
    M --> E["animated .webp<br/><sub>real alpha</sub>"]
```

The trick in the original local pipeline is that the same still is sent as both the first and the last frame, so the model returns to where it began and the loop closes with no visible seam.

The background is removed against a colour chosen by the pipeline, which keeps soft edges soft instead of leaving a halo.

## Licence

MIT. Icons you generate with it are yours, with no restrictions.
