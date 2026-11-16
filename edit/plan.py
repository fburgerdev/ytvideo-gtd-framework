"""Turn the script into a timed plan: blocks in script order, each with its duration and word times.

Two sources for the timing:
  estimate()     no recording yet: word times guessed from the text at a calm speaking pace.
  from_take()    a recording: its transcript (edit/transcribe.py) is aligned to the script, retakes are
                 dropped (the later take wins), long pauses shrink. Same rules as in the "Doing good" pipeline.
Both write edit/work/<name>/plan.json.
"""
import json, sys, difflib, re, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from script import parse, norm_words

FPS = 30
WORK = pathlib.Path(__file__).parent / "work"
KEEP = ("id", "section", "section_title", "kind", "desc", "key", "title")

# estimate
PER_WORD, PER_LETTER = 0.14, 0.055          # about 2.5 words a second
SENTENCE, COMMA, PARA = 0.55, 0.22, 0.6     # pauses
LEAD, TAIL = 0.5, 0.9
SILENT = {"card": 3.5, "title": 5.0}        # blocks nobody speaks over
# take
MAX_PAUSE, KEEP_PAUSE = 2.0, 1.0
CUT_LEAD, CUT_TAIL = 0.12, 0.22
MIN_SCORE = 0.4
META = re.compile(r"record (the|this|that) (sentence|again)|let me (start|say that) again|once more|"
                  r"repeat th(at|e sentence)|remove that sentence", re.I)
SENT_END = re.compile(r"[.?!:]\W?$")


def snap(t):
    return round(t * FPS) / FPS


def silent_dur(b):
    return b["opts"].get("dur", SILENT.get(b["key"], 3.5))


def finish(name, out, extra):
    t = 0.0
    for o in out:
        o["start"] = round(t, 4); t += o["dur"]
    WORK.joinpath(name).mkdir(parents=True, exist_ok=True)
    json.dump({"fps": FPS, "duration": t, "blocks": out} | extra, open(WORK / name / "plan.json", "w"), indent=1)
    lines = [f"# Shot list ({name})", "", f"Total {t/60:.1f} min.", "", "| at | dur | block | what |", "|---|---|---|---|"]
    for o in out:
        lines.append(f"| {int(o['start']//60)}:{o['start']%60:04.1f} | {o['dur']:.1f}s | {o['id']} | {o['desc']} |")
    (WORK / name / "shotlist.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(out)} blocks, {t/60:.1f} min")
    return out


def estimate(script_dir="writing/script", name="draft"):
    out = []
    for b in parse(script_dir):
        o = {k: b[k] for k in KEEP} | {"stage": b["opts"].get("stage"), "pieces": []}
        if not b["paras"]:
            out.append(o | {"dur": silent_dur(b), "words": [], "lines": []}); continue
        t = b["opts"].get("lead", LEAD)
        words, lines = [], []
        for para in b["paras"]:
            sent, s0 = [], t
            for tok in para.split():
                words.append({"w": tok, "t": round(t, 3)})
                sent.append(tok)
                t += PER_WORD + PER_LETTER * len(re.sub(r"[^A-Za-z0-9]", "", tok))
                if SENT_END.search(tok):
                    lines.append({"t": round(s0, 3), "e": round(t + 0.25, 3), "text": " ".join(sent)})
                    t += SENTENCE; sent, s0 = [], t
                elif tok[-1] in ",;":
                    t += COMMA
            if sent:
                lines.append({"t": round(s0, 3), "e": round(t + 0.25, 3), "text": " ".join(sent)})
                t += SENTENCE
            t += PARA
        out.append(o | {"dur": round(snap(t - PARA - SENTENCE + TAIL + b["opts"].get("tail", 0)), 4), "words": words, "lines": lines})
    return finish(name, out, {"take": None})


def from_take(take, script_dir="writing/script"):
    segs = json.load(open(WORK / take / "transcript.json"))
    blocks = parse(script_dir)

    sw, sblock = [], []
    for bi, b in enumerate(blocks):
        sw += b["words"]; sblock += [bi] * len(b["words"])
    tw, tseg = [], []
    for si, s in enumerate(segs):
        for w in s["words"]:
            for n in norm_words(w["w"]):
                tw.append(n); tseg.append(si)

    sm = difflib.SequenceMatcher(None, tw, sw, autojunk=False)
    t2s = {}
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            t2s[a + k] = b + k
    info = []
    for si, s in enumerate(segs):
        idx = [i for i, x in enumerate(tseg) if x == si]
        hits = [t2s[i] for i in idx if i in t2s]
        info.append({"hits": hits, "score": len(hits) / max(len(idx), 1)})

    def sim(a, b):
        return difflib.SequenceMatcher(None, norm_words(a), norm_words(b), autojunk=False).ratio()
    keep, last_block = [], 0
    for si, s in enumerate(segs):
        inf = info[si]
        nxt = range(si + 1, min(si + 4, len(segs)))
        later = [segs[j]["text"] for j in nxt]
        false_start = (inf["score"] < MIN_SCORE and later
                       and norm_words(s["text"])[:3] == norm_words(later[0])[:3])
        # said again a moment later = a retake; unless the script itself has two sentences that alike
        # ("does this fit what I want? Does it fit what I believe?"), then both match their own place
        both = lambda j: inf["score"] >= 0.8 and info[j]["score"] >= 0.8 and not set(inf["hits"]) & set(info[j]["hits"])
        if META.search(s["text"]) or false_start or any(sim(s["text"], segs[j]["text"]) >= 0.6 and not both(j) for j in nxt):
            print(f"  retake {s['start']:7.1f}  {s['text'].strip()}")
            continue
        if inf["score"] >= MIN_SCORE and inf["hits"]:
            bi = sblock[sorted(inf["hits"])[len(inf["hits"]) // 2]]
        else:
            bi = last_block            # an ad-lib: keep it where it was said
        last_block = bi
        keep.append({"seg": si, "block": bi, "s": s["start"], "e": s["end"]})

    out = []
    for bi, b in enumerate(blocks):
        o = {k: b[k] for k in KEEP} | {"stage": b["opts"].get("stage"), "lines": []}
        if not b["paras"]:
            out.append(o | {"pieces": [], "dur": silent_dur(b), "words": []}); continue
        mine = [k for k in keep if k["block"] == bi]
        pieces = []
        for k in mine:
            s, e = k["s"] - CUT_LEAD, k["e"] + CUT_TAIL
            if pieces and s - pieces[-1][1] <= MAX_PAUSE - CUT_LEAD - CUT_TAIL:
                pieces[-1][1] = e
            else:
                if pieces:
                    shrink = KEEP_PAUSE - CUT_LEAD - CUT_TAIL
                    pieces[-1][1] += max(0, shrink / 2); s -= max(0, shrink / 2)
                pieces.append([s, e])
        pieces = [[snap(max(a, 0)), snap(e)] for a, e in pieces]
        for i in range(1, len(pieces)):
            if pieces[i][0] < pieces[i - 1][1]:
                pieces[i][0] = pieces[i - 1][1]
        pieces = [p for p in pieces if p[1] - p[0] >= 1 / FPS]
        if not pieces:
            continue                   # nothing said over it in this take
        lead = b["opts"].get("lead", 0)   # silent animation before the voice starts
        words, t0 = [], lead
        for p in pieces:
            for k in mine:
                for w in segs[k["seg"]]["words"]:
                    if p[0] <= w["s"] < p[1]:
                        words.append({"w": w["w"].strip(), "t": round(t0 + w["s"] - p[0], 3)})
            t0 += p[1] - p[0]
        tail = b["opts"].get("tail", 0)   # and after it ends
        out.append(o | {"pieces": pieces, "lead": lead, "tail": tail, "dur": round(snap(t0 + tail), 4), "words": words})
    return finish(take, out, {"take": take})


if __name__ == "__main__":
    from_take(sys.argv[1]) if len(sys.argv) > 1 else estimate()
