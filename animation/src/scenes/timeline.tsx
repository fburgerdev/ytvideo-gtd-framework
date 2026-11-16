// Plays the blocks of src/render-list.json one after another, each exactly its duration.
// edit/build.py writes that list from the script (and from a take, once there is one).
import {makeScene2D, Node, Txt, Circle} from '@motion-canvas/2d';
import {all, cancel, waitFor, ThreadGenerator} from '@motion-canvas/core';
import list from '../render-list.json';
import {BG, INK, MUTED, GOOD, SANS} from '../style';
import {Block, setBlockStart, setStageFn, until} from '../lib';
import {ANIMS, placeholder} from '../anims';
import {STAGES} from '../anims/common';

export default makeScene2D(function* (view) {
  view.fill(BG);

  // the five stages, small in the top right corner: which one are we in?
  const ind = new Node({x: 596, y: -316, opacity: 0, zIndex: 10});
  const GAP = 20;
  const dots = STAGES.map((_, i) => new Circle({size: 9, y: i * GAP, fill: MUTED, opacity: 0.45}));
  const name = new Txt({fontFamily: SANS, fontSize: 13, letterSpacing: 2, fill: INK, x: -16, offset: [1, 0]});
  dots.forEach(d => ind.add(d));
  ind.add(name);
  view.add(ind);
  let cur: number | null = null;
  const paint = (n: number, d: number) => all(...dots.map((dot, i) =>
    all(dot.fill(i === n - 1 ? (n === 1 ? GOOD : INK) : MUTED, d), dot.opacity(i === n - 1 ? 1 : 0.45, d), dot.size(i === n - 1 ? 12 : 9, d))));
  function* setStage(n: number | null): ThreadGenerator {
    n = n ? Math.round(n) : null;
    if (n === cur) return;
    if (n === null) { yield* ind.opacity(0, 0.3); cur = null; return; }
    if (cur === null) {
      name.text(STAGES[n - 1].toUpperCase()); name.y((n - 1) * GAP);
      yield* paint(n, 0);
      yield* ind.opacity(1, 0.4);
    } else {
      yield* name.opacity(0, 0.2);
      name.text(STAGES[n - 1].toUpperCase());
      yield* all(paint(n, 0.4), name.y((n - 1) * GAP, 0.4), name.opacity(1, 0.4));
    }
    cur = n;
  }
  setStageFn(setStage);

  // captions: the script itself, as long as nobody has recorded it
  const cap = new Txt({fontFamily: SANS, fontSize: 21, fill: INK, opacity: 0, y: 322, width: 1120, textWrap: true, textAlign: 'center', zIndex: 10});
  view.add(cap);
  function* captions(b: Block) {
    for (const l of b.lines ?? []) {
      yield* until(l.t);
      cap.text(l.text);
      cap.opacity(0.7);
      yield* until(Math.min(l.e, b.dur - 0.1));
      cap.opacity(0);
    }
  }

  let start = 0;
  for (const b of list.blocks as Block[]) {
    setBlockStart(start);
    const root = new Node({opacity: 0});
    view.add(root);
    const fn = ANIMS[b.key] ?? placeholder;
    const caps = (list as any).captions ? yield captions(b) : null;
    const task = yield fn(root, b);
    yield* all(root.opacity(1, 0.3), setStage(b.stage ?? null));
    yield* until(b.dur - 0.45);          // an animation that runs long is cut off here, a short one holds
    cancel(task);
    yield* root.opacity(0, 0.35);
    yield* until(b.dur);
    if (caps) cancel(caps);
    cap.opacity(0);
    root.remove();
    start += b.dur;
  }
  yield* setStage(null);
  yield* waitFor(0.1);
});
