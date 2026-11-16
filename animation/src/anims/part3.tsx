// Chapters 4 and 5: a goal and steps, the goal fading, the thread; the supervisor; the ending.
import {Node, Circle, Rect, Line, Spline} from '@motion-canvas/2d';
import {all, chain, delay, sequence, waitFor, tween, useRandom, easeInOutCubic, easeInOutSine, easeInCubic, easeOutCubic, linear, Vector2} from '@motion-canvas/core';
import {Block, at, left} from '../lib';
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

// the mind: a lot that runs by itself, and a small part that watches
const BLOB: [number, number] = [-270, 30], R = 175;
function mind(root: Node, seed = 9) {
  const rnd = useRandom(seed);
  const inBlob = () => {
    const a = rnd.nextFloat(0, Math.PI * 2), r = R * Math.sqrt(rnd.nextFloat(0, 1));
    return new Vector2(BLOB[0] + Math.cos(a) * r, BLOB[1] + Math.sin(a) * r);
  };
  root.add(new Circle({size: 2 * R + 70, fill: PAPER, x: BLOB[0], y: BLOB[1]}));
  const dots = Array.from({length: 38}, () => new Circle({size: rnd.nextFloat(11, 18), fill: MUTED, position: inBlob(), opacity: rnd.nextFloat(0.5, 0.95)}));
  dots.forEach(d => root.add(d));
  const drift = (total: number) => all(...dots.map(d => {
    const n = Math.max(1, Math.round(total / rnd.nextFloat(2.2, 3.4)));
    return chain(...Array.from({length: n}, () => {
      const to = d.position().add(new Vector2(rnd.nextFloat(-45, 45), rnd.nextFloat(-45, 45)));
      const c = new Vector2(BLOB), off = to.sub(c);
      const p = off.magnitude > R ? c.add(off.scale(R / off.magnitude)) : to;
      return d.position(p, total / n, easeInOutSine);
    }));
  }));
  return {dots, drift};
}
const SUP: [number, number] = [130, -20];

export function* supervisor(root: Node, b: Block) {
  const {drift} = mind(root);
  const tag = S('SPECULATION', 14, ACCENT, {x: -600, y: -316, offset: [-1, 0]});
  const goal = new Circle({size: 32, fill: GOOD, x: 470, y: -60, opacity: 0});
  const gl = S('WHAT I WANT', 14, GOOD, {x: 470, y: -100});
  const sup = new Circle({size: 58, stroke: INK, lineWidth: 4, x: -20, y: -230, opacity: 0});
  const sl = S('SUPERVISOR', 13, INK, {x: SUP[0], y: SUP[1] + 48});
  const i1 = new Circle({size: 18, fill: INK, x: -110, y: 110, opacity: 0});
  const i2 = new Circle({size: 18, fill: INK, x: -100, y: -10, opacity: 0});
  [tag, goal, gl, i1, i2, sup, sl].forEach(n => root.add(n));
  function* main() {
    yield* at(b, 'speculation', 3);
    yield* tag.opacity(1, 0.5);
    yield* at(b, 'small part that watches', 12.5);
    yield* sup.opacity(1, 0.7);
    // one impulse heads off somewhere else: checked, and sent back
    yield* at(b, 'does this still fit what I want', 16);
    yield* all(goal.opacity(1, 0.6), gl.opacity(1, 0.6), i1.opacity(1, 0.3), i1.position([130, 190], 1.3, easeOutCubic));
    yield* sup.position([130, 190], 0.8, easeInOutCubic);
    yield* i1.fill(ACCENT, 0.3);
    yield* all(i1.position([-200, 90], 1, easeInOutCubic), delay(0.6, i1.opacity(0, 0.4)));
    // the next one fits: it may go on, towards the goal
    yield* at(b, 'Does it fit what I believe', 20);
    yield* all(i2.opacity(1, 0.3), i2.position(SUP, 1.2, easeOutCubic), sup.position(SUP, 1.2, easeInOutCubic));
    yield* i2.fill(GOOD, 0.3);
    yield* i2.position([470, -60], 1.4, easeInOutCubic);
    yield* i2.opacity(0, 0.3);
    yield* at(b, 'Supervising the ones', 30);
    yield* sl.opacity(1, 0.6);
  }
  yield* all(drift(b.dur), main());
}

/** The supervisor gets tired; the file puts it on a page, outside the head. */
export function* pageSupervisor(root: Node, b: Block) {
  const {drift} = mind(root, 21);
  const sup = new Circle({size: 58, stroke: INK, lineWidth: 4, x: SUP[0], y: SUP[1]});
  const sl = S('SUPERVISOR', 13, INK, {x: SUP[0], y: SUP[1] + 48, opacity: 1});
  const sh = sheet(400, 10, 0.72, true);
  sh.g.opacity(0);
  const top = new Vector2(400 - 100 * 0.72 - 34, 10 + sh.ys[0] * 0.72);
  const tie = new Line({points: [[400 - 150 * 0.72 - 8, 10], [BLOB[0] + R + 44, BLOB[1]]], stroke: GOOD, lineWidth: 3, lineCap: 'round', end: 0});
  [tie, sh.g, sup, sl].forEach(n => root.add(n));
  function* main() {
    yield* at(b, 'weak', 0.8);
    yield* all(sup.opacity(0.3, 1.6, easeInOutSine), sl.opacity(0.3, 1.6, easeInOutSine));
    yield* at(b, 'outside my head', 5.5);
    yield* all(sh.g.opacity(1, 0.8), sl.opacity(0, 0.5),
      sup.position(top, 1.6, easeInOutCubic), sup.size(30, 1.6, easeInOutCubic), sup.opacity(1, 1.6));
    yield* at(b, "doesn't forget", 9.5);
    yield* all(sh.lines[0].stroke(GOOD, 0.7), sup.stroke(GOOD, 0.7), tie.end(1, 1.4, easeInOutCubic));
  }
  yield* all(drift(b.dur), main());
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
  yield* sequence(0.18, ...sh.lines.map(l => l.end(1, 0.5, easeInOutCubic)));
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
