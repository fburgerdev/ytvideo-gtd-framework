"""Transcribe a take with word timestamps. Cached: skips if work/<take>/transcript.json exists.
Usage: python transcribe.py takes/take1.wav take1 <ffmpeg>      (needs: pip install faster-whisper numpy)"""
import json, sys, subprocess, pathlib
src, name = sys.argv[1], sys.argv[2]
ffmpeg = sys.argv[3] if len(sys.argv) > 3 else "ffmpeg"
out = pathlib.Path(__file__).parent / "work" / name
out.mkdir(parents=True, exist_ok=True)
if (out / "transcript.json").exists():
    print("cached"); sys.exit()
import numpy as np
from faster_whisper import WhisperModel
pcm = subprocess.run([ffmpeg, "-v", "error", "-i", src, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, dtype=np.float32)
m = WhisperModel("small", device="cpu", compute_type="int8")
segs, _ = m.transcribe(audio, language="en", word_timestamps=True, vad_filter=True, beam_size=1)
res = []
with open(out / "transcript.txt", "w", encoding="utf-8") as f:
    for s in segs:
        res.append({"start": s.start, "end": s.end, "text": s.text,
                    "words": [{"w": w.word, "s": w.start, "e": w.end} for w in s.words]})
        line = f"[{s.start:7.2f}-{s.end:7.2f}] {s.text}"
        print(line, flush=True); f.write(line + "\n")
json.dump(res, open(out / "transcript.json", "w"), indent=1)
