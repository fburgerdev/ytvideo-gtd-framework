// Chapters 4 and 5: a goal and steps, the goal fading, the thread; the supervisor; the ending.
import {Node, Circle, Rect, Line, Spline} from '@motion-canvas/2d';
import {all, chain, delay, sequence, waitFor, tween, useRandom, easeInOutCubic, easeInOutSine, easeInCubic, easeOutCubic, linear, Vector2} from '@motion-canvas/core';
import {Block, at, cue, left} from '../lib';
import {BG, INK, MUTED, ACCENT, GOOD, PAPER} from '../style';
import {T, S, STAGES, sheet, ladder} from './common';

const A: [number, number] = [-480, 200], G: [number, number] = [480, -190];

function youAndGoal(root: Node) {
  const you = new Circle({size: 26, fill: INK, x: A[0], y: A[1]});
  const goal = new Circle({size: 32, fill: GOOD, x: G[0], y: G[1]});
  const gl = S('GOAL', 16, GOOD, {x: G[0], y: G[1] - 40, opacity: 1});
  root.add(goal); root.add(gl); root.add(you);
  return {you, goal, gl};
}

/** All strategy: a goal, and steps that connect you to it. */
export function* goalSteps(root: Node, b: Block) {
  const {goal} = youAndGoal(root);
  const path = new Spline({points: [A, [-250, 150], [-40, 40], [200, -90], G], smoothness: 0.4,
    stroke: MUTED, lineWidth: 3, lineDash: [8, 12], end: 0});
  root.insert(path, 0);
  const line = T('connecting a goal with steps', 42, INK, {x: -220, y: -250});
  root.add(line);
  yield* at(b, 'connecting a goal', 9);
  yield* all(line.opacity(1, 0.7), path.end(1, 2.6, easeInOutCubic));
  const steps = [0.14, 0.27, 0.4, 0.53, 0.66, 0.79].map(p =>
    new Circle({size: 18, fill: INK, position: path.getPointAtPercentage(p).position, opacity: 0, scale: 0.4}));
  steps.forEach(s => root.add(s));
  yield* at(b, 'steps you can take', 12);
  yield* sequence(0.22, ...steps.map(s => all(s.opacity(1, 0.4), s.scale(1, 0.4, easeOutCubic))));
  yield* at(b, 'keeping the goal in mind', 20);
  const ring = new Circle({size: 64, stroke: GOOD, lineWidth: 3, x: G[0], y: G[1], end: 0, rotation: -90});
  root.add(ring);
  // the steps step back: the goal is what this is about
  yield* all(ring.end(1, 1.2, easeInOutCubic), ...steps.map(s => s.opacity(0.35, 0.8)), goal.size(36, 0.8));
}

/** We start with a reason, get busy, and walk off while the reason fades. */
export function* goalFades(root: Node, b: Block) {
  const {you, goal, gl} = youAndGoal(root);
  const reason = new Line({points: () => [you.position(), new Vector2(G)], stroke: GOOD, lineWidth: 2.5, lineDash: [4, 10], end: 0});
  const trail = new Spline({points: [A, [-300, 110], [-110, 50], [90, 70], [250, 140], [420, 240]], smoothness: 0.4,
    stroke: INK, lineWidth: 4, lineDash: [10, 12], end: 0});
  root.insert(trail, 0); root.insert(reason, 0);
  yield* at(b, 'start with a reason', 0.5);
  yield* reason.end(1, 1.4, easeInOutCubic);
  yield* at(b, 'we get busy', 3);
  const d = Math.max(4, left(b, 1.2));
  yield* all(
    tween(d, v => { trail.end(v); you.position(trail.getPointAtPercentage(v).position); }),
    delay(d * 0.35, all(reason.opacity(0, d * 0.5), goal.opacity(0.15, d * 0.5), gl.opacity(0.15, d * 0.5))),
  );
}

/** The five stages as one thread, from the next action up to the reason. */
export function* thread(root: Node, b: Block) {
  const P = STAGES.map((_, i): [number, number] => [420 - i * 210, -180 + i * 90]);   // purpose top right
  const links = [0, 1, 2, 3].map(i => new Line({points: [P[i + 1], P[i]], stroke: GOOD, lineWidth: 4, lineCap: 'round', end: 0}));
  const faint = new Line({points: [P[4], P[0]], stroke: MUTED, lineWidth: 2, lineDash: [4, 10], end: 0});
  root.add(faint); links.forEach(l => root.add(l));
  const dots = P.map(([x, y], i) => new Circle({size: 28, x, y, fill: i === 0 ? GOOD : BG, stroke: i === 0 ? GOOD : INK, lineWidth: 4, opacity: 0}));
  const labels = P.map(([x, y], i) => S(STAGES[i].toUpperCase(), 14, i === 0 ? GOOD : INK, {x, y: y + 38}));
  dots.forEach(d => root.add(d)); labels.forEach(l => root.add(l));
  yield* at(b, 'hold that thread', 2);
  yield* sequence(0.3, ...[4, 3, 2, 1, 0].map(i => all(dots[i].opacity(1, 0.5), labels[i].opacity(1, 0.5))));
  yield* at(b, 'tied to the one above', 6);
  yield* faint.end(1, 1.4, easeInOutCubic);
  yield* at(b, 'action belongs to a plan', 9);
  yield* sequence(0.5, links[3].end(1, 0.6, easeInOutCubic), links[2].end(1, 0.6, easeInOutCubic));
  yield* at(b, 'plan to a picture', 11.5);
  yield* links[1].end(1, 0.7, easeInOutCubic);
  yield* at(b, 'picture to a reason', 13);
  yield* links[0].end(1, 0.7, easeInOutCubic);
}

/** The AI enters in the middle too; and it learned from all of us liking options. */
export function* aiJumps(root: Node, b: Block) {
  const L = ladder(-470, -200, 95, 20, 26);
  root.add(L.g);
  const ring = new Circle({size: 48, stroke: INK, lineWidth: 4, x: -150, y: L.ys[3], opacity: 0});
  const rl = S('AI', 14, MUTED, {x: -150, y: L.ys[3] - 40});
  L.under.add(ring); L.g.add(rl);
  yield* at(b, 'same mistake', 3.5);
  yield* all(ring.opacity(1, 0.5), rl.opacity(1, 0.5));
  yield* at(b, 'jumps to solutions', 6);
  yield* all(ring.x(0, 1.2, easeInOutCubic), rl.opacity(0, 0.4), L.dim([0, 1], 0.25, 1));
  const ppl: Circle[] = [], minis: Rect[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
    const x = 20 + c * 112, y = -100 + r * 110;
    ppl.push(new Circle({size: 26, fill: MUTED, stroke: GOOD, lineWidth: 0, x, y, opacity: 0}));
    minis.push(new Rect({width: 34, height: 22, radius: 5, fill: PAPER, stroke: MUTED, lineWidth: 2, x: x + 40, y, opacity: 0}));
  }
  ppl.forEach(p => root.add(p)); minis.forEach(m => root.add(m));
  yield* at(b, 'learned that from us', 9.5);
  yield* sequence(0.05, ...ppl.map(p => p.opacity(1, 0.4)));
  yield* at(b, 'list of options', 12.5);
  yield* sequence(0.05, ...minis.map((m, i) => all(m.opacity(1, 0.3), delay(0.3, ppl[i].lineWidth(4, 0.3)))));
  yield* at(b, "that's what it gives us", 15.5);
  const target = new Vector2(-470, L.ys[3]);
  const likes = ppl.map(p => new Circle({size: 10, fill: GOOD, position: p.position(), opacity: 0}));
  likes.forEach(l => root.add(l));
  yield* all(
    sequence(0.07, ...likes.map(l => sequence(0.9, all(l.opacity(1, 0.2), l.position(target, 1, easeInOutCubic)), l.opacity(0, 0.15)))),
    delay(1, ring.stroke(GOOD, 1.2)),
  );
  const name = T('reactive planning, at scale', 40, ACCENT, {x: 240, y: -250});
  root.add(name);
  yield* at(b, 'Reactive planning', 18.5);
  yield* name.opacity(1, 0.7);
}

// The gap: a track with two lanes, what you want (top, green) and what runs by itself (bottom, terracotta).
// You move along it; drifting off drops you to the lower lane, noticing brings you back up.
interface Seg { lane: number; frac: number }

function track(root: Node, y: number, x0: number, x1: number, segs: Seg[], labels: [string, string], gap = 100, font = 14) {
  const g = new Node({});
  root.add(g);
  const Y = (l: number) => y + l * gap;
  const guides = [0, 1].map(l => new Line({points: [[x0, Y(l)], [x1, Y(l)]], stroke: MUTED, lineWidth: 2, lineDash: [4, 10], opacity: 0}));
  const lab = labels.map((t, l) => S(t, font, l ? ACCENT : GOOD, {x: x0 - 24, y: Y(l), offset: [1, 0]}));
  guides.forEach(n => g.add(n));
  let x = x0, lane = segs[0].lane;
  const xs: number[] = [], turns: {i: number; x: number; y: number}[] = [];
  const lines = segs.map((s, i) => {
    const dist = s.frac * (x1 - x0), dx = Math.min(34, dist / 2);
    const pts: [number, number][] = [[x, Y(lane)]];
    if (s.lane !== lane) pts.push([x + dx, Y(s.lane)]);
    pts.push([x + dist, Y(s.lane)]);
    if (lane === 1 && s.lane === 0) turns.push({i, x: x + dx / 2, y: Y(0.5)});
    xs.push(x);
    x += dist; lane = s.lane;
    return new Line({points: pts, stroke: s.lane ? ACCENT : GOOD, lineWidth: 6, lineCap: 'round', lineJoin: 'round', end: 0});
  });
  xs.push(x);
  lines.forEach(l => g.add(l));
  lab.forEach(l => g.add(l));
  const head = new Circle({size: 22, fill: INK, x: x0, y: Y(segs[0].lane), opacity: 0});
  g.add(head);
  const show = (d = 0.5) => all(head.opacity(1, d), ...guides.map(n => n.opacity(0.35, d)), ...lab.map(n => n.opacity(1, d)));
  function* play(i: number, d: number) {
    const l = lines[i];
    yield* tween(Math.max(d, 0.1), v => { l.end(v); head.position(l.getPointAtPercentage(v).position); });
  }
  function drawn() {
    lines.forEach(l => l.end(1));
    head.position(lines[lines.length - 1].getPointAtPercentage(1).position);
    head.opacity(1); guides.forEach(n => n.opacity(0.35)); lab.forEach(n => n.opacity(1));
  }
  /** A bracket under a lower-lane segment, labelled. */
  function bracket(i: number, text = 'THE GAP', below = 30) {
    const a = xs[i] + 20, e = xs[i + 1], yb = Y(1) + below;
    const br = new Line({points: [[a, yb - 10], [a, yb], [e, yb], [e, yb - 10]], stroke: ACCENT, lineWidth: 2.5, end: 0});
    const t = S(text, 13, ACCENT, {x: (a + e) / 2, y: yb + 20});
    g.add(br); g.add(t);
    return {br, t, show: (d = 0.6) => all(br.end(1, d, easeInOutCubic), t.opacity(1, d))};
  }
  /** The moment of noticing: a ring where you turn back up. */
  function ring(k: number, size = 40) {
    const r = new Circle({size, stroke: INK, lineWidth: 4, x: turns[k].x, y: turns[k].y, opacity: 0, scale: 0.6});
    g.add(r);
    return r;
  }
  return {g, lines, head, lab, guides, xs, turns, Y, show, play, drawn, bracket, ring};
}

const INSTA: Seg[] = [{lane: 0, frac: 0.24}, {lane: 1, frac: 0.5}, {lane: 0, frac: 0.26}];
const insta = (root: Node) => track(root, -60, -400, 540, INSTA, ['STUDY', 'INSTAGRAM'], 120, 15);

/** Studying, drifting to Instagram without deciding to, noticing, going back. */
export function* instagram(root: Node, b: Block) {
  const tag = S('SPECULATION', 14, ACCENT, {x: -600, y: -316, offset: [-1, 0]});
  root.add(tag);
  const tr = insta(root);
  yield* at(b, 'speculation', 3);
  yield* tag.opacity(1, 0.5);
  const t0 = cue(b, 'sit down to study', 5), t1 = cue(b, "you're on Instagram", 10), t2 = cue(b, 'I wanted to study', 22);
  yield* at(b, null, t0);
  yield* tr.show();
  yield* tr.play(0, t1 - t0 - 0.5);
  yield* tr.play(1, t2 - t1);
  const r = tr.ring(0);
  yield* all(tr.play(2, 2.4), r.opacity(1, 0.4), r.scale(1, 0.4, easeOutCubic));
}

/** The same track: what runs by itself, what notices, and the time in between. */
export function* theGap(root: Node, b: Block) {
  const tr = insta(root);
  tr.drawn();
  const r = tr.ring(0);
  r.opacity(1); r.scale(1);
  const nl = S('NOTICES', 13, INK, {x: tr.turns[0].x, y: tr.turns[0].y - 48});
  const runs = S('RUNS BY ITSELF', 13, ACCENT, {x: (tr.xs[1] + tr.xs[2]) / 2, y: tr.Y(1) - 28});
  root.add(nl); root.add(runs);
  const top = [tr.lines[0], tr.lines[2], tr.lab[0]];
  yield* at(b, 'runs by itself', 3);
  // only the lower lane while it is the subject; everything else steps back
  yield* all(...top.map(n => n.opacity(0.3, 0.5)), r.opacity(0.3, 0.5), runs.opacity(1, 0.5));
  yield* at(b, 'another part notices', 7.5);
  yield* all(...top.map(n => n.opacity(1, 0.5)), r.opacity(1, 0.5), nl.opacity(1, 0.5));
  const c = T('consciousness', 50, INK, {y: -250});
  const cs = S('JUDGING WHAT YOU DO AGAINST WHAT YOU WANT, AND READJUSTING', 14, MUTED, {y: -200});
  root.add(c); root.add(cs);
  yield* at(b, 'what we call consciousness', 13);
  yield* c.opacity(1, 0.7);
  yield* at(b, 'Judging what', 17);
  yield* cs.opacity(1, 0.6);
  const br = tr.bracket(1);
  yield* at(b, "that's the gap", 25);
  yield* all(br.show(), runs.opacity(0, 0.4));
}

const SCALES: {name: string; labels: [string, string]; segs: Seg[]}[] = [
  {name: 'seconds', labels: ['STUDY', 'INSTAGRAM'], segs: [{lane: 0, frac: 0.3}, {lane: 1, frac: 0.12}, {lane: 0, frac: 0.58}]},
  {name: 'a day', labels: ['THE ONE THING', 'MAILS'], segs: [{lane: 0, frac: 0.1}, {lane: 1, frac: 0.78}, {lane: 0, frac: 0.12}]},
  {name: 'years', labels: ['WHAT I WANT', 'WHAT CAME NEXT'], segs: [{lane: 0, frac: 0.06}, {lane: 1, frac: 0.88}, {lane: 0, frac: 0.06}]},
];

/** Seconds, a day, years: the same move, a longer gap. */
export function* scales(root: Node, b: Block) {
  const ys = [-250, -40, 170];
  const trs = SCALES.map((s, k) => track(root, ys[k], -330, 520, s.segs, s.labels, 56, 13));
  const names = SCALES.map((s, k) => T(s.name, 28, INK, {x: -330, y: ys[k] - 42, offset: [-1, 0]}));
  names.forEach(n => root.add(n));
  function* run(k: number, a: string, z: string, fa: number, fz: number) {
    const ta = cue(b, a, fa), tz = cue(b, z, fz);
    yield* at(b, null, ta);
    yield* all(trs[k].show(), names[k].opacity(1, 0.5));
    const seg = SCALES[k].segs;
    const d = Math.max(1.5, tz - ta), f = seg[0].frac + seg[1].frac;
    yield* trs[k].play(0, d * seg[0].frac / f);
    yield* trs[k].play(1, d * seg[1].frac / f);
    const r = trs[k].ring(0, 30);
    yield* all(trs[k].play(2, 0.8), r.opacity(1, 0.3), r.scale(1, 0.3));
  }
  yield* run(0, 'not only about Instagram', 'not only about Instagram', 0.5, 2.5);
  yield* run(1, 'You plan to do', 'six in the evening', 3, 9);
  yield* run(2, 'Or over years', 'one day you ask', 12, 18);
  yield* at(b, 'Only the gap gets longer', 22);
  yield* sequence(0.5, ...trs.map(t => t.bracket(1, 'THE GAP', 22).show()));
}

const MED: Seg[] = [
  {lane: 0, frac: 0.07}, {lane: 1, frac: 0.25}, {lane: 0, frac: 0.08}, {lane: 1, frac: 0.16},
  {lane: 0, frac: 0.09}, {lane: 1, frac: 0.09}, {lane: 0, frac: 0.1}, {lane: 1, frac: 0.04}, {lane: 0, frac: 0.12},
];

/** Meditation: wander, notice, come back, again and again; the gaps get shorter. */
export function* meditation(root: Node, b: Block) {
  const tr = track(root, -10, -400, 540, MED, ['BREATH', 'WANDERING'], 110, 15);
  const half = T('almost half the time we’re awake', 40, INK, {y: -250});
  const med = T('meditation', 50, INK, {y: -250});
  root.add(half); root.add(med);
  yield* at(b, 'almost half', 4);
  yield* half.opacity(1, 0.6);
  yield* at(b, "That's what meditation is", 10);
  yield* all(half.opacity(0, 0.5), delay(0.4, med.opacity(1, 0.6)));
  const t0 = cue(b, 'You sit', 12), t1 = cue(b, 'mind wanders off', 15), t2 = cue(b, 'you come back', 18);
  yield* at(b, null, t0);
  yield* tr.show();
  yield* tr.play(0, t1 - t0);
  yield* tr.play(1, t2 - t1);
  // the rest, evenly paced until the block ends; each noticing leaves its ring, each gap its bracket
  const rest = Math.max(4, b.dur - 1.2 - t2);
  const fr = MED.slice(2).reduce((s, x) => s + x.frac, 0);
  const r0 = tr.ring(0, 30), b0 = tr.bracket(1, '', 22);
  let k = 1;
  for (let i = 2; i < MED.length; i++) {
    const d = rest * MED[i].frac / fr;
    if (i === 2) { yield* all(tr.play(i, d), r0.opacity(1, 0.3), r0.scale(1, 0.3), b0.show(0.4)); continue; }
    if (MED[i].lane === 0 && MED[i - 1].lane === 1) {
      const r = tr.ring(k, 30), br = tr.bracket(i - 1, '', 22);
      k++;
      yield* all(tr.play(i, d), r.opacity(1, 0.3), r.scale(1, 0.3), br.show(0.4));
    } else yield* tr.play(i, d);
  }
}

/** In my head the gap is weeks; on a page it closes early. */
export function* fileCloses(root: Node, b: Block) {
  const A1: Seg[] = [{lane: 0, frac: 0.14}, {lane: 1, frac: 0.7}, {lane: 0, frac: 0.16}];
  const A2: Seg[] = [{lane: 0, frac: 0.14}, {lane: 1, frac: 0.12}, {lane: 0, frac: 0.74}];
  const t1 = track(root, -200, -330, 520, A1, ['THE GOAL', 'SOLUTIONS'], 70, 13);
  const t2 = track(root, 90, -330, 520, A2, ['THE GOAL', 'SOLUTIONS'], 70, 13);
  const n1 = T('in my head', 28, INK, {x: -330, y: -246, offset: [-1, 0]});
  const n2 = T('on a page', 28, INK, {x: -330, y: 44, offset: [-1, 0]});
  root.add(n1); root.add(n2);
  yield* at(b, 'In my head', 3);
  yield* all(t1.show(), n1.opacity(1, 0.5));
  yield* t1.play(0, 0.6);
  yield* t1.play(1, 2.6);
  const r1 = t1.ring(0, 30);
  yield* all(t1.play(2, 0.6), r1.opacity(1, 0.3), r1.scale(1, 0.3));
  yield* at(b, 'On a page', 9);
  yield* all(t2.show(), n2.opacity(1, 0.5));
  // the page sits where you turn back
  const pg = sheet(t2.turns[0].x, t2.Y(0) - 52, 0.16, true);
  pg.g.opacity(0);
  t2.g.add(pg.g);
  yield* t2.play(0, 0.6);
  yield* all(t2.play(1, 0.6), pg.g.opacity(1, 0.4));
  const r2 = t2.ring(0, 30);
  yield* all(t2.play(2, 2.4), r2.opacity(1, 0.3), r2.scale(1, 0.3), pg.lines[0].stroke(GOOD, 0.5));
  yield* at(b, "doesn't get tired", 20);
  yield* sequence(0.4, t1.bracket(1, 'WEEKS', 22).show(), t2.bracket(1, 'EARLY', 22).show());
}

/** The one thing to take along: go up before asking for solutions. */
export function* goUp(root: Node, b: Block) {
  const scene = new Node({});
  root.add(scene);
  const L = ladder(-420);
  scene.add(L.g);
  const ring = new Circle({size: 46, stroke: ACCENT, lineWidth: 5, y: L.ys[3]});
  L.under.add(ring);
  const q1 = T('Why am I doing this?', 36, INK, {x: 250, y: L.ys[0], offset: [-1, 0]});
  const q2 = T('What does it look like when it worked?', 36, INK, {x: 250, y: L.ys[1], offset: [-1, 0]});
  L.g.add(q1); L.g.add(q2);
  yield* at(b, 'go up first', 10);
  yield* all(ring.y(L.ys[0], 1.8, easeInOutCubic), ring.stroke(GOOD, 1.8));
  yield* at(b, 'Why am I doing this', 12);
  yield* q1.opacity(1, 0.6);
  yield* at(b, 'what does it look like', 14);
  yield* all(ring.y(L.ys[1], 0.9, easeInOutCubic), delay(0.3, q2.opacity(1, 0.6)));
  yield* at(b, 'Five lines', 17);
  yield* scene.opacity(0, 0.6);
  const sh = sheet(0, -10, 1);
  root.add(sh.g);
  yield* sequence(0.3, ...sh.lines.map(l => l.end(1, 0.6, easeInOutCubic)));
}

/** Everything collapses into a point. Then: thanks. Time for the music. */
export function* thanks(root: Node, b: Block) {
  const sh = sheet(0, -10, 1, true);
  const dot = new Circle({size: 16, fill: INK, y: -10, opacity: 0});
  const t = T('Thanks for watching', 54, INK);
  root.add(sh.g); root.add(dot); root.add(t);
  yield* waitFor(0.9);
  yield* all(sh.g.scale(0, 1.3, easeInCubic), delay(0.9, dot.opacity(1, 0.4)));
  yield* waitFor(0.5);
  yield* dot.opacity(0, 0.5);
  yield* t.opacity(1, 1);
}
