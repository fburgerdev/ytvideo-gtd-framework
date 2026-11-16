"""Build the video from the script.

  python edit/build.py                    # no recording yet: a silent draft with the script as captions,
                                          #   timed at an estimated speaking pace -> renders/draft.mp4
  python edit/build.py --take take1       # takes/take1.(wav|m4a|mp3|mp4): transcribe, align to the script,
                                          #   time every animation to the voice -> renders/take1.mp4
  python edit/build.py --only supervisor  # render only the blocks whose key contains the word (quick review)

Steps: plan (edit/plan.py) -> animation/src/render-list.json -> Motion Canvas render -> voice on top.
"""
import argparse, glob, json, pathlib, shutil, subprocess, sys, wave

ROOT = pathlib.Path(__file__).resolve().parent.parent
EDIT, ANIM = ROOT / "edit", ROOT / "animation"
sys.path.insert(0, str(EDIT))


def ffmpeg():
    """The system's ffmpeg, or the one Motion Canvas brings along."""
    found = shutil.which("ffmpeg") or next(iter(glob.glob(str(ANIM / "node_modules/@ffmpeg-installer/*/ffmpeg*"))), None)
    if not found:
        sys.exit("no ffmpeg: run `npm install` in animation/ first")
    return found


def run(cmd, **kw):
    subprocess.run(cmd, check=True, **kw)


def voice(blocks, take, out):
    """Cut the voice by the plan's pieces (one decode), silence where nobody speaks, then clean it up."""
    import numpy as np
    sr = 48000
    pcm = subprocess.run([ffmpeg(), "-v", "error", "-i", str(take), "-vn", "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(pcm, dtype=np.float32)
    fade = int(0.02 * sr)
    ramp = np.linspace(0, 1, fade, dtype=np.float32)
    parts = []
    for b in blocks:
        if not b["pieces"]:
            parts.append(np.zeros(round(b["dur"] * sr), dtype=np.float32)); continue
        parts.append(np.zeros(round(b.get("lead", 0) * sr), dtype=np.float32))
        for a, e in b["pieces"]:
            n = round((e - a) * sr)
            seg = x[round(a * sr): round(a * sr) + n].copy()
            seg = np.pad(seg, (0, n - len(seg)))
            seg[:fade] *= ramp; seg[-fade:] *= ramp[::-1]
            parts.append(seg)
        parts.append(np.zeros(round(b.get("tail", 0) * sr), dtype=np.float32))
    y = np.concatenate(parts)
    raw = out.with_name("voice-raw.wav")
    with wave.open(str(raw), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
    run([ffmpeg(), "-v", "error", "-y", "-i", str(raw), "-af",
         "highpass=f=80,acompressor=threshold=-20dB:ratio=3,loudnorm=I=-16:TP=-1.5", "-ar", str(sr), str(out)])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--take", default=None)
    ap.add_argument("--only", default=None, help="only blocks whose key contains this")
    ap.add_argument("--out", default=None)
    args = ap.parse_args()
    import plan as P
    script = str(ROOT / "writing" / "script")
    name = args.take or "draft"
    take = None
    if args.take:
        take = next(iter((ROOT / "takes").glob(f"{args.take}.*")), None) or sys.exit(f"no takes/{args.take}.*")
        print("1 transcribe"); run([sys.executable, str(EDIT / "transcribe.py"), str(take), args.take, ffmpeg()])
        print("2 plan"); blocks = P.from_take(args.take, script)
    else:
        print("1 plan (estimated timing)"); blocks = P.estimate(script)
    if args.only:
        blocks = [b for b in blocks if args.only in b["key"]]
        name += "-" + args.only
    out = pathlib.Path(args.out) if args.out else ROOT / "renders" / f"{name}.mp4"
    out.parent.mkdir(parents=True, exist_ok=True)

    print(f"3 animations: {len(blocks)} blocks, {sum(b['dur'] for b in blocks)/60:.1f} min, in Motion Canvas")
    (ANIM / "src" / "render-list.json").write_text(json.dumps({"captions": take is None, "blocks": blocks}), encoding="utf-8")
    silent = EDIT / "work" / f"{name}-silent.mp4"
    silent.parent.mkdir(parents=True, exist_ok=True)
    run(["node", "render.mjs", str(silent)], cwd=ANIM)
    if take is None:
        shutil.copy(silent, out)
    else:
        print("4 voice")
        vo = EDIT / "work" / args.take / "voice.wav"
        voice(blocks, take, vo)
        run([ffmpeg(), "-v", "error", "-y", "-i", str(silent), "-i", str(vo), "-map", "0:v", "-map", "1:a",
             "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(out)])
    print(f"done: {out}")


if __name__ == "__main__":
    main()
