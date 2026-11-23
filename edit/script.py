"""Parse the script into blocks.

The script is one file per version, writing/script/v1.md, v2.md, ... (as in video 3 and Video Kit); the
newest is the one built. Its # headings are the sections, numbered in order; ## and ### headings, lines
starting with > (what a part is to achieve: "> Outcome: ...") and everything above the first # heading
(what the whole video is to achieve) are not spoken and are skipped.
A folder without vN.md files is read the older way: one file per section, "<n> <title>.md".

A block starts at a marker line; the paragraphs after it are what is spoken over it.
  [ANIM: the goal fades]            an animation, keyed by the marker's text (see animation/src/anims/index.ts)
  [ANIM: one file | lead=5]         options after "|": lead=<s> / tail=<s> silent seconds before / after the voice,
                                    stage=<1-5> shows the stage indicator, <n>s the length of a block without words
  [CARD: The five stages]           a chapter card
  [Title: ...]                      the text of the title card, on the line after its [ANIM: title]
Other bracket lines ([Florian: ...], [pause]) are ignored, inline [check ...] notes are stripped.
"""
import re, pathlib

MARK = re.compile(r"^\[(.*)\]\s*$")


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40]


def norm_words(text):
    text = re.sub(r"\[[^\]]*\]", " ", text)
    return [w for w in (re.sub(r"[^a-z0-9]", "", t.lower()) for t in text.replace("-", " ").split()) if w]


def options(parts):
    o = {}
    for p in parts:
        p = p.strip()
        if m := re.fullmatch(r"(\w+)=([\d.]+)", p):
            o[m.group(1)] = float(m.group(2))
        elif m := re.fullmatch(r"([\d.]+)s", p):
            o["dur"] = float(m.group(1))
    return o


VFILE = re.compile(r"^v(\d+)\.md$", re.I)


def newest(script_dir):
    """The newest version file in the folder, or None."""
    files = [f for f in pathlib.Path(script_dir).glob("*.md") if VFILE.match(f.name)]
    return max(files, key=lambda f: int(VFILE.match(f.name).group(1))) if files else None


def sections(script):
    """[(number, title, lines)]: from one version file cut at its # headings, or from a folder of section files."""
    p = pathlib.Path(script)
    f = p if p.is_file() else newest(p)
    if f is not None:
        out = []
        for line in f.read_text(encoding="utf-8").splitlines():
            m = re.match(r"^#\s+(.+?)\s*#*\s*$", line.rstrip())
            if m:
                out.append((len(out) + 1, m.group(1), []))
            elif out:
                out[-1][2].append(line)
        return out
    out = []
    for f in sorted(p.glob("*.md")):
        m = re.match(r"(\d+)\s+(.*)\.md", f.name)
        if m:
            out.append((int(m.group(1)), m.group(2), f.read_text(encoding="utf-8").splitlines()))
    return out


def parse(script_dir):
    blocks = []
    for sec, sec_title, lines in sections(script_dir):
        cur = None
        for line in lines:
            line = line.strip()
            if not line or line.startswith("#") or line.startswith(">"):
                continue
            mm = MARK.match(line)
            if mm:
                head, _, rest = mm.group(1).partition(":")
                kind = head.strip().upper()
                desc, *opts = [x.strip() for x in rest.split("|")]
                if kind == "TITLE" and cur is not None:
                    cur["title"] = desc
                elif kind in ("ANIM", "VO + ANIM", "CARD"):
                    cur = {"section": sec, "section_title": sec_title, "kind": "anim", "desc": desc,
                           "key": "card" if kind == "CARD" else slug(desc),
                           "title": desc if kind == "CARD" else None, "opts": options(opts), "paras": []}
                    blocks.append(cur)
                continue
            if cur is None:
                continue
            text = re.sub(r"\s+", " ", re.sub(r"\[[^\]]*\]", "", line)).strip()
            if text:
                cur["paras"].append(text)
    for i, b in enumerate(blocks):
        b["id"] = f"{b['section']}.{i:02d}"
        b["words"] = norm_words(" ".join(b["paras"]))
    return blocks


if __name__ == "__main__":
    import sys
    for b in parse(sys.argv[1] if len(sys.argv) > 1 else "writing/script"):
        print(f"{b['id']:6} {b['key']:40} {len(b['words']):4}w  {b['opts'] or ''}")
