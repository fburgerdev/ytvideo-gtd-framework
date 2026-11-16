# Video GTD

Video 4 for Florian's YouTube channel: the five stages of planning from *Getting Things Done* (purpose, vision, brainstorm, organise, next action), told through how one file with those five lines changed the way he works with his AI. Started 16-11-2026.

Same look and pipeline idea as video 3 ("Doing good"): Motion Canvas, beige paper, dark ink, one terracotta and one green, Fraunces and Inter. This one is animation throughout, with a voiceover.

## Where things are

- `writing/script/*.md`: the script, one file per chapter. Markers decide what is on screen (see below).
- `animation/`: the Motion Canvas project. One function per animation in `src/anims/`, keyed by its marker's text in `src/anims/index.ts`. `src/scenes/timeline.tsx` plays them back to back, with the stage indicator in the top right corner.
- `edit/`: turns the script (and later a recording) into a timed render.
- `renders/`: the videos. Not in git.

## Build

```
cd animation && npm install        # once
python edit/build.py               # silent draft: renders/draft.mp4
python edit/build.py --only goal   # only the blocks whose key contains "goal"
python edit/build.py --only 5      # only chapter 5
python edit/build.py --take take1  # with a recording, see below
```

Rendering runs headless in the installed browser (Edge on Windows). To work on an animation live: `cd animation && npx vite`, open the editor, edit `src/anims/*.tsx`. The editor plays `src/render-list.json`, the blocks of the last build.

### Without a recording

`build.py` guesses the timing from the text at a calm speaking pace and shows the script as captions, so the draft can be judged before anything is recorded. The pace is set at the top of `edit/plan.py`.

### With a recording

Put the voiceover into `takes/` (`take1.wav`, `.m4a`, `.mp3` or `.mp4`) and run `python edit/build.py --take take1`. It needs `pip install faster-whisper numpy`. The take is transcribed with word times and aligned to the script, so every animation moves on the word it belongs to. Retakes are dropped (the later one wins; "repeat that", "repeat the sentence", "remove that sentence" work as spoken markers), pauses over 2 s shrink to 1 s. This path is ported from video 3's pipeline and has not run on a real take in this repository yet.

## Script markers

```
[ANIM: the goal fades]             an animation; the paragraphs below it are spoken over it
[ANIM: one file | lead=5]          5 silent seconds of animation before the voice starts
[ANIM: go up first | tail=3]       3 silent seconds after the voice ends
[ANIM: example, purpose | stage=1] shows the stage indicator on stage 1 during this block
[ANIM: thanks for watching | 7s]   a block nobody speaks over, 7 seconds long
[CARD: The five stages]            chapter card, 3.5 s of music only
[Title: ...]                       the title card's text, after [ANIM: title]
[Florian: ...] [pause] [check ...] notes, never spoken or shown
```

A marker without an animation gets a placeholder card with its text, so the script can run ahead of the animations. Inside an animation, `at(b, 'some words', fallback)` waits until those words are spoken; change the sentence in the script and the cue follows, as long as the words still occur.

## What is built in from earlier feedback

From the feedback rounds on video 2 (`writing/feedback/summary.md` there) and video 3:

- Every block fades in and out; what carries over between two blocks stands in the same place in both.
- Things are dimmed only while something else is being highlighted, and come back afterwards. No emphasis by scaling large objects, no checkmarks, nothing crossed out.
- Slow pace: shapes get time, and each highlight stays until the next idea starts.
- The recurring element (the five stages) sits small in the top right corner and does not touch the layout.
- Chapter cards name the topic in a few words, with a few seconds of music only.
- The video opens with animation before the voice and ends with everything collapsing into a point, then "Thanks for watching".
- Key terms appear on screen on the word ("reactive planning").
