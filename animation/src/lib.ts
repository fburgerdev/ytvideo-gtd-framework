import {useTime, waitFor, ThreadGenerator} from '@motion-canvas/core';

export interface Block {
  id: string; key: string; kind: string; desc: string; title?: string | null;
  dur: number; words: {w: string; t: number}[];
  /** the script's sentences with their times; shown as captions while there is no voice */
  lines?: {t: number; e: number; text: string}[];
  /** 1-5: which of the five stages the corner indicator shows during this block */
  stage?: number | null;
}

let blockStart = 0;
export function setBlockStart(t: number) { blockStart = t; }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9']/g, '');

/** Block-relative time at which `phrase` is spoken, or `fallback` (seconds). */
export function cue(b: Block, phrase: string | null, fallback: number): number {
  if (phrase) {
    const target = phrase.split(/\s+/).map(norm).filter(Boolean);
    const ws = b.words.map(w => norm(w.w));
    for (let i = 0; i + target.length <= ws.length; i++) {
      if (target.every((t, k) => ws[i + k] === t)) return b.words[i].t;
    }
  }
  return Math.min(fallback, b.dur);
}

/** Wait until block-relative time t. */
export function* until(t: number) {
  const now = useTime() - blockStart;
  if (t - now > 1 / 60) yield* waitFor(t - now);
}

/** Wait until `phrase` is spoken (or fallback). */
export function* at(b: Block, phrase: string | null, fallback: number) {
  yield* until(cue(b, phrase, fallback));
}

/** Time left in the block minus a margin. */
export function left(b: Block, margin = 0) {
  return Math.max(0, b.dur - margin - (useTime() - blockStart));
}

// The stage indicator lives in the timeline, above the blocks; an animation that moves on to the
// next stage in the middle of its block (brainstorm -> organise) calls stage(n).
let stageFn: (n: number | null) => ThreadGenerator = function* () {};
export function setStageFn(f: (n: number | null) => ThreadGenerator) { stageFn = f; }
export function stage(n: number | null) { return stageFn(n); }
