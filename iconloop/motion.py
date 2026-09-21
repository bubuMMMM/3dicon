"""Object-native motion.

The failure this fixes: told to animate something, a video model defaults to
moving the whole object — bouncing, wobbling, drifting, jittering. It passes
every motion metric and still looks wrong, because almost nothing in the world
moves by bouncing. It reads as a sticker being shaken rather than the thing
itself being alive.

A flame licks upward and its tips tear away. A clock's hand sweeps at a
constant rate. A droplet swells, hangs, and falls. That motion is specific to
the object and cannot be guessed from the word "animate".

So each preset names two things:
  physics — what this object actually does, in physical language
  anchor  — what must NOT move, which is usually the whole silhouette

The quality words (overshoot, settle, morph) are borrowed from Emil Kowalski's
animation vocabulary. They describe how a motion should feel, which is worth
keeping — they just cannot substitute for knowing what the object does.
"""

# Applied to every preset. These are the defaults a model reaches for, and they
# are wrong for almost every icon.
BANNED = (
    "It must not bob, bounce, wobble, jitter, sway, drift, spin as a whole, "
    "rock side to side, or float around the frame. The object as a whole stays "
    "exactly where it is."
)

ARCHETYPES = {
    "flame": dict(
        physics="fire rises: the flame licks upward, its tips tapering, curling "
                "and tearing away into nothing while new flame feeds up from the "
                "base; the inner core swells and sinks in its own slower rhythm",
        anchor="the base of the flame stays planted and does not move",
    ),
    "clock": dict(
        physics="the hand sweeps steadily clockwise at a constant rate, all the "
                "way around, exactly as a real clock hand moves; the case and "
                "dial stay perfectly still",
        anchor="only the hand moves — the body, face and markings are fixed",
    ),
    "droplet": dict(
        physics="the surface tension works: the drop swells at the bottom, "
                "stretches, hangs, and its highlight slides as the surface moves, "
                "the way real water skins and settles",
        anchor="the drop stays in place and keeps its teardrop identity",
    ),
    "heart": dict(
        physics="it beats: a quick double pulse, swelling then settling back, "
                "the way a heartbeat has two knocks and a rest between",
        anchor="it beats in place, centred, and never travels",
    ),
    "bell": dict(
        physics="the bell rings: the body tilts and the clapper swings inside it, "
                "the swing decaying naturally, then rest before it rings again",
        anchor="the bell pivots from its crown, which stays fixed",
    ),
    "star": dict(
        physics="it twinkles: the points brighten and lengthen in turn, a "
                "specular glint travelling across the surface",
        anchor="the star's centre and outline stay put",
    ),
    "leaf": dict(
        physics="it responds to a breeze: the blade flexes and twists along its "
                "spine, edges lifting and settling, the stem holding it back",
        anchor="the stem is fixed; only the blade flexes",
    ),
    "gear": dict(
        physics="it rotates steadily about its own centre at a constant rate, "
                "teeth passing evenly, exactly as a driven gear turns",
        anchor="the centre is fixed and the rotation never changes speed",
    ),
    "battery": dict(
        physics="it charges: the fill level climbs the cell and the charge "
                "indicator pulses as it rises, then resets",
        anchor="the casing is rigid and completely still",
    ),
    "cloud": dict(
        physics="it churns: the puffs roll and fold into one another slowly, the "
                "silhouette breathing in and out at its edges",
        anchor="the cloud stays centred and keeps its overall mass",
    ),
}

QUALITY = {
    "settle": "movements overshoot slightly and settle rather than stopping dead",
    "snappy": "each movement is fast and decisive, with a held beat between",
    "smooth": "the motion is even and unhurried throughout",
    "organic": "no two cycles are identical; the rhythm varies slightly",
}


def compose(motion=None, preset=None, quality=None):
    """Build the motion clause: what it does, what stays put, how it feels."""
    parts = []
    if preset:
        a = ARCHETYPES[preset]
        parts.append(a["physics"])
        parts.append(a["anchor"])
    if motion:
        parts.append(motion.strip().rstrip("."))
    if quality:
        parts.append(QUALITY[quality])
    if not parts:
        raise SystemExit("Give --motion, --preset, or both.")
    parts.append(BANNED.rstrip("."))
    return ". ".join(p.strip().rstrip(".") for p in parts) + "."


def describe():
    return "\n".join(f"  {k:9s} {v['physics'][:66]}..." for k, v in ARCHETYPES.items())
