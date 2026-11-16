// Chapter 3: the five stages, the example that runs through them, the file, and what to do when stuck.
import {Node, Circle, Rect, Line, Txt, blur} from '@motion-canvas/2d';
import {all, delay, sequence, waitFor, useRandom, easeInOutCubic, easeOutCubic, easeInCubic, linear, Vector2} from '@motion-canvas/core';
import {Block, at, stage} from '../lib';
import {BG, INK, MUTED, ACCENT, GOOD, PAPER, SERIF} from '../style';
import {T, S, STAGES, SHEET, EDGE, me, ai, sheet, ladder, card} from './common';

const QUESTIONS = [
  'Why am I doing this?',
  'What does it look like when it worked?',
  'Everything that comes to mind.',
  'Giving the pile a shape.',
  'What is the very next thing I do?',
];

/** The book, then the page: each stage appears with its question when it is named. */
export function* fiveLines(root: Node, b: Block) {
  const book = T('Getting Things Done', 58, INK, {y: -24});
  const by = S('DAVID ALLEN', 20, MUTED, {y: 44});
  root.add(book); root.add(by);
  yield* at(b, 'Getting Things Done', 2);
  yield* all(book.opacity(1, 0.7), by.opacity(1, 0.7));
  yield* at(b, 'Five stages', 9);
  yield* all(book.opacity(0, 0.5), by.opacity(0, 0.5));
  const page = new Rect({x: -360, width: 380, height: 520, radius: 12, fill: SHEET, stroke: EDGE, lineWidth: 2, opacity: 0,
    shadowColor: '#2B2A2822', shadowBlur: 24, shadowOffsetY: 8});
  root.add(page);
  const ys = STAGES.map((_, i) => -180 + i * 90);
  const names = STAGES.map((s, i) => T(s, 38, i === 0 ? GOOD : INK, {x: -510, y: ys[i], offset: [-1, 0]}));
  const qs = QUESTIONS.map((q, i) => T(q, 30, INK, {x: -110, y: ys[i], offset: [-1, 0]}));
  names.forEach(n => root.add(n)); qs.forEach(q => root.add(q));
  yield* page.opacity(1, 0.7);
  const cues = ['Purpose', 'Vision', 'Brainstorming', 'Organising', 'next actions'];
  for (let i = 0; i < 5; i++) {
    yield* at(b, cues[i], 11 + i * 4.5);
    // earlier stages step back while the new one is spoken about
    yield* all(names[i].opacity(1, 0.5), delay(0.5, qs[i].opacity(1, 0.6)),
      ...names.slice(0, i).map(n => n.opacity(0.4, 0.5)), ...qs.slice(0, i).map(q => q.opacity(0.4, 0.5)));
  }
  yield* at(b, 'very next thing', 30);
  yield* waitFor(1.8);
  yield* all(...names.map(n => n.opacity(1, 0.8)), ...qs.map(q => q.opacity(1, 0.8)));
}

/** Small things: all five, top to bottom. Important things: we enter in the middle. */
export function* startInMiddle(root: Node, b: Block) {
  const L = ladder(-170);
  root.add(L.g);
  const runner = new Circle({size: 44, stroke: GOOD, lineWidth: 5, y: L.ys[0], opacity: 0});
  L.under.add(runner);
  yield* at(b, 'naturally', 1.5);
  yield* runner.opacity(1, 0.4);
  yield* runner.y(L.ys[4], 3.4, easeInOutCubic);
  yield* at(b, 'feels important', 6.5);
  yield* runner.opacity(0, 0.5);
  yield* at(b, 'skip the first stages', 8);
  yield* L.dim([0, 1], 0.25, 0.7);
  yield* at(b, 'start in the middle', 10.5);
  runner.stroke(ACCENT); runner.position([-260, L.ys[3]]);
  yield* runner.opacity(1, 0.4);
  yield* runner.x(0, 1.2, easeInOutCubic);
  yield* at(b, 'feels productive', 14.5);
  yield* runner.y(L.ys[4], 1.2, easeInOutCubic);
  const name = T('reactive planning', 50, ACCENT, {x: 330, y: 50});
  root.add(name);
  yield* at(b, 'reactive planning', 17);
  yield* name.opacity(1, 0.7);
}

// the example: a student group with too few people at its meetings
const IDEAS = ['posters', 'Instagram', 'free pizza', 'campus stall'];
const ideaCards = () => IDEAS.map((t, i) => card(t, 400, -120 + i * 90));

export function* exQuestion(root: Node, b: Block) {
  const seats: Circle[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    const taken = r === 0 && c < 3;
    seats.push(new Circle({size: 30, x: -500 + c * 72, y: -30 + r * 72, opacity: 0,
      ...(taken ? {fill: INK} : {stroke: MUTED, lineWidth: 3})}));
  }
  const lbl = S('YOUR MEETING', 15, MUTED, {x: -392, y: -90});
  seats.forEach(s => root.add(s)); root.add(lbl);
  yield* at(b, 'student group', 2.5);
  yield* all(lbl.opacity(1, 0.5), sequence(0.06, ...seats.map(s => s.opacity(1, 0.4))));
  const q = T('How do we get more people?', 42, INK, {x: -60, y: -250});
  root.add(q);
  yield* at(b, 'how do we get more people', 9);
  yield* q.opacity(1, 0.6);
  const cards = ideaCards();
  cards.forEach(c => root.add(c));
  const cues = ['posters', 'Instagram', 'Free pizza', 'stall on campus'];
  for (let i = 0; i < 4; i++) {
    yield* at(b, cues[i], 13 + i * 1.3);
    yield* cards[i].opacity(1, 0.45);
  }
}

/** Why? And why does that matter? The answer changes what the problem is. */
export function* exPurpose(root: Node, b: Block) {
  const cards = ideaCards();
  cards.forEach(c => { c.opacity(1); root.add(c); });
  const X = -200;
  const n0 = T('more people at meetings', 34, INK, {x: X, y: 160, opacity: 1});
  const n0b = T('two or three who take over real work', 34, INK, {x: X, y: 160});
  const n1 = T('three of us do all the work', 34, INK, {x: X, y: 10});
  const n2 = T('the group survives when we leave', 34, GOOD, {x: X, y: -140});
  const arrow = (y0: number, y1: number) => new Line({points: [[X, y0], [X, y1]], stroke: MUTED, lineWidth: 3, endArrow: true, arrowSize: 11, end: 0});
  const a1 = arrow(128, 44), a2 = arrow(-22, -106);
  const w1 = S('WHY?', 15, MUTED, {x: X + 22, y: 88, offset: [-1, 0]});
  const w2 = S('WHY?', 15, MUTED, {x: X + 22, y: -62, offset: [-1, 0]});
  [n0, n0b, n1, n2, a1, a2, w1, w2].forEach(n => root.add(n));
  yield* at(b, 'Why do you want', 3);
  yield* all(a1.end(1, 0.7, easeInOutCubic), w1.opacity(1, 0.5));
  yield* at(b, 'three of us', 8);
  yield* n1.opacity(1, 0.6);
  yield* at(b, 'Why does that matter', 12.5);
  yield* all(a2.end(1, 0.7, easeInOutCubic), w2.opacity(1, 0.5));
  yield* at(b, 'otherwise the group dies', 15);
  yield* n2.opacity(1, 0.6);
  yield* at(b, "You don't need more people", 20.5);
  yield* n0.opacity(0, 0.7);
  yield* at(b, 'You need two or three', 23.5);
  yield* n0b.opacity(1, 0.7);
  yield* at(b, 'fell off the table', 28.5);
  yield* sequence(0.3, ...[cards[0], cards[2]].map(c =>
    all(c.y(c.y() + 240, 0.9, easeInCubic), c.rotation(10, 0.9, easeInCubic), c.opacity(0, 0.9, easeInCubic))));
}

/** A vague picture gets sharp: someone else runs the meeting, you sit in the back. */
export function* exVision(root: Node, b: Block) {
  const pic = new Node({x: -40, y: 30, filters: [blur(18)]});
  pic.add(new Rect({width: 640, height: 380, radius: 24, fill: PAPER}));
  pic.add(new Rect({width: 200, height: 12, radius: 6, fill: MUTED, y: -150}));
  const front = new Circle({size: 36, fill: MUTED, y: -96});
  pic.add(front);
  for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++)
    pic.add(new Circle({size: 30, fill: MUTED, x: -200 + c * 100, y: 0 + r * 76}));
  const you = new Circle({size: 30, fill: INK, x: 230, y: 148});
  const youL = S('YOU', 13, INK, {x: 230, y: 124});
  pic.add(you); pic.add(youL);
  root.add(pic);
  const vague = T('“the group is doing well”', 40, MUTED, {x: -40, y: -250});
  const day = S('A TUESDAY IN JUNE', 18, INK, {x: -40, y: -196});
  root.add(vague); root.add(day);
  yield* at(b, 'Not', 6);
  yield* vague.opacity(1, 0.5);
  yield* at(b, 'Something specific', 9);
  yield* all(vague.opacity(0, 0.8), pic.filters.blur(0, 2.4, easeInOutCubic));
  yield* at(b, 'A Tuesday in June', 12);
  yield* day.opacity(1, 0.6);
  yield* at(b, 'someone else is running', 14);
  yield* front.fill(GOOD, 0.7);
  yield* at(b, 'you sit in the back', 16.5);
  yield* youL.opacity(1, 0.6);
}

// brainstorm -> organise -> next action share one layout: the goal on top, the ideas below
const GOALP: [number, number] = [0, -235];
const N = 18;
const groupSpot = (k: number): [number, number] => {
  const g = Math.floor(k / 6), i = k % 6;
  return [-330 + g * 330 - 24 + (i % 2) * 48, 60 + Math.floor(i / 2) * 46];
};
function goalNode(root: Node) {
  const goal = new Circle({size: 30, fill: GOOD, x: GOALP[0], y: GOALP[1]});
  const gl = S('TWO OR THREE WHO TAKE OVER', 14, GOOD, {y: GOALP[1] - 38, opacity: 1});
  root.add(goal); root.add(gl);
  return {goal, gl};
}
function sequenceMarks(root: Node, visible: boolean) {
  const arrows = [[-270, -60], [60, 270]].map(([x0, x1]) =>
    new Line({points: [[x0, 106], [x1, 106]], stroke: MUTED, lineWidth: 3, endArrow: true, arrowSize: 11, end: visible ? 1 : 0}));
  const nums = [0, 1, 2].map(g => S(String(g + 1), 16, MUTED, {x: -330 + g * 330, y: 200, opacity: visible ? 1 : 0}));
  arrows.forEach(a => root.add(a)); nums.forEach(n => root.add(n));
  return {arrows, nums};
}

export function* exBrainOrg(root: Node, b: Block) {
  const rnd = useRandom(5);
  goalNode(root);
  const ideas = Array.from({length: N}, () => new Circle({size: 20, fill: INK, opacity: 0, scale: 0.4,
    x: rnd.nextFloat(-500, 500), y: rnd.nextFloat(-70, 230)}));
  const threads = ideas.map(d => new Line({points: () => [d.position(), new Vector2(GOALP[0], GOALP[1] + 15)],
    stroke: GOOD, lineWidth: 1.5, opacity: 0.45, end: 0}));
  threads.forEach(t => root.add(t)); ideas.forEach(d => root.add(d));
  yield* at(b, 'brainstorm', 1);
  yield* sequence(0.11, ...ideas.map(d => all(d.opacity(0.9, 0.35), d.scale(1, 0.35, easeOutCubic))));
  yield* at(b, "know where they're going", 5.5);
  yield* sequence(0.04, ...threads.map(t => t.end(1, 0.8, easeInOutCubic)));
  yield* at(b, 'sort them', 8.5);
  const marks = sequenceMarks(root, false);
  yield* all(stage(4),
    ...threads.map(t => t.opacity(0.18, 1)),
    ...ideas.map((d, k) => d.position(groupSpot(k), 1.6, easeInOutCubic)));
  yield* at(b, 'what comes first', 11.5);
  yield* all(...threads.map(t => t.opacity(0, 0.6)),
    sequence(0.3, ...marks.arrows.map(a => a.end(1, 0.6))), sequence(0.3, ...marks.nums.map(n => n.opacity(1, 0.4))));
}

export function* exNext(root: Node, b: Block) {
  const {goal} = goalNode(root);
  const marks = sequenceMarks(root, true);
  const ideas = Array.from({length: N}, (_, k) => new Circle({size: 20, fill: INK, opacity: 0.9, position: groupSpot(k)}));
  const first = ideas[0];
  const up1 = new Line({points: [[first.x(), first.y() - 16], [first.x(), -38]], stroke: GOOD, lineWidth: 3, lineCap: 'round', end: 0});
  const up2 = new Line({points: [[0, -124], [0, GOALP[1] + 20]], stroke: GOOD, lineWidth: 3, lineCap: 'round', end: 0});
  const msg = new Rect({y: -81, width: 780, height: 84, radius: 14, fill: PAPER, opacity: 0});
  msg.add(new Txt({text: '“Do you want to plan the next meeting with me?”', fontFamily: SERIF, fontSize: 30, fill: INK}));
  root.add(up1); root.add(up2); ideas.forEach(d => root.add(d)); root.add(msg);
  yield* at(b, 'one next action', 1.5);
  // everything else steps back while the one action is what we look at
  yield* all(...ideas.slice(1).map(d => d.opacity(0.25, 0.7)), ...marks.arrows.map(a => a.opacity(0.25, 0.7)),
    ...marks.nums.map(n => n.opacity(0.25, 0.7)), first.fill(GOOD, 0.7));
  yield* at(b, 'Write to one person', 10);
  yield* all(up1.end(1, 0.8, easeInOutCubic), delay(0.5, msg.opacity(1, 0.6)));
  yield* waitFor(1.2);
  yield* up2.end(1, 1.2, easeInOutCubic);
  yield* goal.size(38, 0.5);
}

/** The five stages in one file, between me and the AI. Then: two steps up. */
export function* theFile(root: Node, b: Block) {
  const m = me(-420, 0), a = ai(420, 0);
  const thread = new Line({points: [[-390, 0], [388, 0]], stroke: GOOD, lineWidth: 4, lineCap: 'round', end: 0});
  const sh = sheet(0, 0, 0.72, true, true);
  sh.g.opacity(0);
  const scene = new Node({});
  const marker = new Circle({size: 16, fill: ACCENT, x: -132, y: sh.ys[2], opacity: 0});
  sh.g.add(marker);
  [thread, m.g, a.g, sh.g].forEach(n => scene.add(n));
  root.add(scene);
  yield* at(b, 'into one file', 1.5);
  yield* sh.g.opacity(1, 0.8);
  yield* at(b, 'how we think together', 5);
  yield* thread.end(1, 1.6, easeInOutCubic);
  yield* at(b, 'Stay in a stage', 7.5);
  yield* marker.opacity(1, 0.5);
  yield* at(b, 'point me back up', 11);
  yield* marker.y(sh.ys[1], 0.9, easeInOutCubic);
  yield* at(b, 'I expected', 14);
  yield* scene.opacity(0, 0.6);
  const stairs = new Line({points: [[-420, 150], [-140, 150], [-140, 50], [140, 50], [140, -90], [420, -90]],
    stroke: INK, lineWidth: 5, lineCap: 'round', lineJoin: 'round', end: 0});
  const l1 = S('OPTIONS', 15, MUTED, {x: -280, y: 180});
  const l2 = S('“DON’T JUMP”', 15, MUTED, {x: 0, y: 80});
  const l3 = S('THE FIVE STAGES', 15, GOOD, {x: 280, y: -60});
  [stairs, l1, l2, l3].forEach(n => root.add(n));
  yield* all(stairs.end(0.61, 1.6, easeInOutCubic), l1.opacity(1, 0.5), delay(1, l2.opacity(1, 0.5)));
  yield* at(b, 'another leap', 17);
  yield* all(stairs.end(1, 1.2, easeInOutCubic), delay(0.7, l3.opacity(1, 0.5)));
}

/** Stuck? The problem sits one stage higher. Too much? All the way down. */
export function* stuck(root: Node, b: Block) {
  const L = ladder(-330);
  root.add(L.g);
  const ring = new Circle({size: 46, stroke: ACCENT, lineWidth: 5, y: L.ys[2], opacity: 0});
  L.under.add(ring);
  const note = (text: string, row: number, fix: boolean) => {
    const t = T(text, 32, fix ? GOOD : MUTED, {x: fix ? 500 : 270, y: L.ys[row], offset: [-1, 0]});
    L.g.add(t);
    return t;
  };
  const p1 = note('no ideas?', 2, false), f1 = note('make it vivid', 1, true);
  const p2 = note('too vague?', 1, false), f2 = note('ask why again', 0, true);
  const p3 = note('too much?', 3, false), f3 = note('just one step', 4, true);
  yield* at(b, 'No ideas', 6.5);
  yield* all(ring.opacity(1, 0.4), p1.opacity(1, 0.4));
  yield* at(b, "vision isn't vivid", 8);
  yield* all(ring.y(L.ys[1], 1, easeInOutCubic), ring.stroke(GOOD, 1), delay(0.5, f1.opacity(1, 0.5)));
  yield* at(b, 'Vision vague', 11);
  yield* all(ring.stroke(ACCENT, 0.4), p2.opacity(1, 0.4), p1.opacity(0.4, 0.4), f1.opacity(0.4, 0.4));
  yield* at(b, "purpose isn't clear", 12.5);
  yield* all(ring.y(L.ys[0], 1, easeInOutCubic), ring.stroke(GOOD, 1), delay(0.5, f2.opacity(1, 0.5)));
  yield* at(b, 'everything is too much', 15.5);
  yield* ring.opacity(0, 0.3);
  ring.y(L.ys[3]); ring.stroke(ACCENT);
  yield* all(ring.opacity(1, 0.4), p3.opacity(1, 0.4), p2.opacity(0.4, 0.4), f2.opacity(0.4, 0.4));
  yield* at(b, 'all the way down', 18);
  yield* all(ring.y(L.ys[4], 0.9, easeInOutCubic), ring.stroke(GOOD, 0.9), delay(0.5, f3.opacity(1, 0.5)));
  yield* waitFor(1.5);
  yield* all(...[p1, f1, p2, f2].map(t => t.opacity(1, 0.6)));
}
