// Chapters 1 and 2: the file, options instead of answers, "don't jump into suggestions".
import {Node, Circle, Rect, Line} from '@motion-canvas/2d';
import {all, sequence, waitFor, easeInOutCubic, easeOutCubic} from '@motion-canvas/core';
import {Block, at} from '../lib';
import {INK, MUTED, ACCENT, GOOD, PAPER} from '../style';
import {T, S, me, ai, sheet, option} from './common';

/** Cold open without voice: a page, five lines. Then it goes from me to the AI. */
export function* oneFile(root: Node, b: Block) {
  const sh = sheet(0, -10, 1);
  sh.g.opacity(0);
  const m = me(-330, 110), a = ai(330, 110);
  m.g.opacity(0); a.g.opacity(0);
  const thread = new Line({points: [[-300, 110], [298, 110]], stroke: GOOD, lineWidth: 4, lineCap: 'round', end: 0});
  root.add(thread); root.add(m.g); root.add(a.g); root.add(sh.g);
  yield* waitFor(0.5);
  yield* sh.g.opacity(1, 1);
  yield* sequence(0.6, ...sh.lines.map(l => l.end(1, 0.8, easeInOutCubic)));
  // the arrow of the opening comes to rest and moves on when the voice starts
  yield* at(b, 'A few months ago', 5);
  yield* all(sh.g.scale(0.42, 1.2, easeInOutCubic), sh.g.position([-330, -30], 1.2, easeInOutCubic),
    m.g.opacity(1, 1), a.g.opacity(1, 1));
  yield* at(b, 'gave my AI', 6.5);
  yield* sh.g.position([330, -30], 1.8, easeInOutCubic);
  yield* at(b, 'Five steps', 10);
  yield* sequence(0.3, ...sh.lines.map(l => l.stroke(GOOD, 0.5)));
  yield* at(b, 'changed everything', 16);
  yield* all(thread.end(1, 1.6, easeInOutCubic), a.c.stroke(GOOD, 1.6));
}

export function* title(root: Node, b: Block) {
  const t = T(b.title ?? 'The five lines I gave my AI', 58, INK, {width: 1000, textWrap: true, textAlign: 'center'});
  const line = new Line({points: [[-120, 70], [120, 70]], stroke: ACCENT, lineWidth: 3, end: 0});
  root.add(t); root.add(line);
  yield* t.opacity(1, 1.2);
  yield* line.end(1, 0.8);
}

/** Chapter card: the topic, and a few seconds of music only. */
export function* chapter(root: Node, b: Block) {
  const t = T(b.title ?? '', 60, INK);
  const line = new Line({points: [[-60, 62], [60, 62]], stroke: MUTED, lineWidth: 3, end: 0});
  root.add(t); root.add(line);
  yield* t.opacity(1, 0.8);
  yield* line.end(1, 0.6);
}

const SPOTS: [number, number][] = [];
for (let c = 0; c < 2; c++) for (let r = 0; r < 5; r++) SPOTS.push([120 + c * 270, -200 + r * 100]);

/** I describe a problem, and options come back. */
export function* optionsOut(root: Node, b: Block) {
  const m = me(-500, 0), a = ai(-200, 0);
  const prob = new Circle({size: 22, fill: ACCENT, x: -460, opacity: 0});
  root.add(prob); root.add(m.g); root.add(a.g);
  const opts = SPOTS.map(([x, y]) => option(x - 40, y));
  opts.forEach(o => root.add(o.g));
  const pop = (i: number) => all(opts[i].g.opacity(1, 0.4), opts[i].g.x(SPOTS[i][0], 0.5, easeOutCubic));
  yield* at(b, 'I describe a problem', 8);
  yield* prob.opacity(1, 0.3);
  yield* prob.x(-235, 1.2, easeInOutCubic);
  yield* prob.opacity(0, 0.3);
  yield* at(b, 'I get options', 11);
  yield* sequence(0.3, pop(0), pop(1));
  yield* at(b, 'Five ideas', 13);
  yield* sequence(0.25, pop(2), pop(3), pop(4));
  yield* at(b, 'Ten ideas', 15);
  yield* sequence(0.2, pop(5), pop(6), pop(7), pop(8), pop(9));
  yield* at(b, 'pros and cons', 17);
  yield* sequence(0.1, ...opts.map(o => sequence(0.15, o.pro.opacity(1, 0.3), o.con.opacity(1, 0.3))));
}

/** Reading, picking, asking for more: the list grows, and what I wanted is nowhere on it. */
export function* picking(root: Node, b: Block) {
  const m = me(-500, 40);
  const list = new Node({});
  root.add(m.g); root.add(list);
  const spots = [...SPOTS];
  for (let r = 5; r < 9; r++) for (let c = 0; c < 2; c++) spots.push([120 + c * 270, -200 + r * 100]);
  const opts = spots.map(([x, y], i) => {
    const o = option(x, y);
    if (i < 10) { o.g.opacity(1); o.pro.opacity(1); o.con.opacity(1); }
    list.add(o.g);
    return o;
  });
  const bar = new Rect({x: -560, y: 190, width: 0, height: 10, radius: 5, fill: GOOD, offset: [-1, 0]});
  const track = new Rect({x: -560, y: 190, width: 240, height: 10, radius: 5, fill: PAPER, offset: [-1, 0], opacity: 0});
  const lbl = S('FEELS LIKE PROGRESS', 14, MUTED, {x: -560, y: 164, offset: [-1, 0]});
  root.add(track); root.add(bar); root.add(lbl);
  const pick = (i: number) => opts[i].g.lineWidth(4, 0.4);
  yield* at(b, 'I pick one', 3);
  yield* pick(3);
  yield* at(b, 'ask for more', 4.5);
  yield* all(
    list.y(-400, 3.2, easeInOutCubic),
    sequence(0.3, ...opts.slice(10).map(o => all(o.g.opacity(1, 0.4), o.pro.opacity(1, 0.4), o.con.opacity(1, 0.4)))),
  );
  yield* pick(14);
  yield* at(b, 'feels like progress', 6.5);
  yield* all(track.opacity(1, 0.4), lbl.opacity(1, 0.4), bar.width(220, 2.2, easeInOutCubic));
  yield* at(b, 'no idea whether', 12);
  const goal = new Circle({size: 36, stroke: GOOD, lineWidth: 4, x: -500, y: -200, opacity: 0});
  const gl = S('WHAT I ACTUALLY WANTED', 15, GOOD, {x: -468, y: -200, offset: [-1, 0]});
  root.add(goal); root.add(gl);
  // the list dims while the goal is what we look at
  yield* all(list.opacity(0.3, 0.8), bar.opacity(0.3, 0.8), track.opacity(0.3, 0.8), lbl.opacity(0.3, 0.8),
    goal.opacity(1, 0.8), gl.opacity(1, 0.8));
}

/** The first fix: the options go back in, questions come out. */
export function* dontJump(root: Node, b: Block) {
  const m = me(-360, 40), a = ai(360, 40);
  const thread = new Line({points: [[-330, 40], [328, 40]], stroke: GOOD, lineWidth: 4, lineCap: 'round', end: 0});
  root.add(thread); root.add(m.g);
  const opts = [[150, -70], [110, 40], [150, 150]].map(([x, y]) => option(x, y));
  opts.forEach(o => root.add(o.g));
  root.add(a.g);
  yield* waitFor(0.4);
  yield* sequence(0.25, ...opts.map(o => o.g.opacity(0.6, 0.5)));
  const rule = T('don’t jump into suggestions', 46, INK, {y: -250});
  root.add(rule);
  yield* at(b, "don't jump into suggestions", 3.5);
  yield* all(rule.opacity(1, 0.6),
    ...opts.map(o => all(o.g.position([360, 40], 0.9, easeInOutCubic), o.g.scale(0.2, 0.9, easeInOutCubic), o.g.opacity(0, 0.8))));
  yield* at(b, 'Ask me questions', 9);
  const qs = [0, 1, 2].map(() => T('?', 56, INK, {x: 300, y: 36}));
  qs.forEach(q => root.add(q));
  yield* sequence(0.9, ...qs.map(q => sequence(1.3,
    all(q.opacity(1, 0.3), q.x(-300, 1.6, easeInOutCubic)),
    q.opacity(0, 0.3))));
  yield* at(b, 'slower', 15);
  yield* thread.end(1, 2.4, easeInOutCubic);
}
