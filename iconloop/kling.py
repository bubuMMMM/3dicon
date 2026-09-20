"""Kling image-to-video on Replicate.

Two things here are the whole reason this pipeline works, and both are easy to
miss:

1. `end_image` set to the START image. Kling then returns to its opening pose,
   which is what makes the clip loop instead of ping-pong. Without it you are
   left cross-fading, and a cross-fade on a rigid object reads as a glitch.

2. The still is composited onto a KNOWN flat backing before it is sent. Kling
   will not accept alpha, and the colour you choose is not cosmetic: because
   you know it exactly, the matte stage can solve for the true foreground
   instead of estimating it. Mid-grey is used rather than a chroma-key green
   or magenta, which spill onto glossy edges and destroy soft shadows.
"""
import os
import time

from . import config, http

API = "https://api.replicate.com/v1"
# Mid-grey: far enough from most art to matte cleanly, neutral enough that any
# spill it does leave is colourless rather than a green or magenta fringe.
BACKING = (158, 158, 158)

LOOP_RULES = (
    "The camera is locked off and must not move, pan, zoom or push in. "
    "The background is flat and completely static. "
    "No new objects, hands, text or effects enter the frame at any point. "
    "The object keeps its exact shape, colour and proportions throughout. "
    "The motion is continuous and evenly paced from the first frame to the "
    "last — it must not ease to a stop, hold still, or pause at the extremes "
    "of its travel."
)


def composite(still_path, out_path, size=1024):
    """Flatten a transparent PNG onto the known backing, ready to send."""
    from PIL import Image
    im = Image.open(still_path).convert("RGBA")
    side = max(im.size)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    sq = sq.resize((size, size), Image.LANCZOS)
    bg = Image.new("RGBA", (size, size), BACKING + (255,))
    bg.alpha_composite(sq)
    bg.convert("RGB").save(out_path)
    return out_path


def resolve_version(model=None):
    model = model or config.opt("ICONLOOP_KLING_MODEL", "kwaivgi/kling-v2.5-turbo-pro")
    k = config.key("REPLICATE_API_TOKEN", "run Kling image-to-video on Replicate")
    # Note: Replicate's ?search= is semantic and does not reliably surface Kling.
    # Hitting the model endpoint directly is what actually works.
    d = http.get_json(f"{API}/models/{model}", {"Authorization": f"Bearer {k}"})
    v = d.get("latest_version", {}).get("id")
    if not v:
        raise SystemExit(f"Could not resolve a version for {model}.")
    return model, v


def animate(image_path, motion_prompt, out_path, duration=5, model=None, poll=10):
    """Run one image-to-video job and download the mp4. Returns (model, version)."""
    k = config.key("REPLICATE_API_TOKEN", "run Kling image-to-video on Replicate")
    model, version = resolve_version(model)
    import base64
    data_uri = "data:image/png;base64," + base64.b64encode(open(image_path, "rb").read()).decode()

    prompt = f"{motion_prompt.strip().rstrip('.')}. {LOOP_RULES}"
    pred = http.post_json(f"{API}/predictions", {
        "version": version,
        "input": {
            "prompt": prompt,
            "start_image": data_uri,
            # The loop trick: end where you began.
            "end_image": data_uri,
            "duration": duration,
        },
    }, {"Authorization": f"Bearer {k}", "Prefer": "wait"})

    url = pred.get("urls", {}).get("get")
    while pred.get("status") in ("starting", "processing"):
        time.sleep(poll)
        pred = http.get_json(url, {"Authorization": f"Bearer {k}"})
        print(f"  kling: {pred.get('status')}", flush=True)

    if pred.get("status") != "succeeded":
        raise RuntimeError(f"Kling failed: {pred.get('error') or pred.get('status')}")

    out = pred["output"]
    http.download(out if isinstance(out, str) else out[0], out_path)
    print(f"  kling: {os.path.getsize(out_path)/1024/1024:.1f} MB -> {out_path}", flush=True)
    return model, version
