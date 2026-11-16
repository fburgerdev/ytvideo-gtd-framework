// Shared pieces: text, the page with five lines, the ladder of the five stages, me and the AI, cards.
import {Node, Txt, Rect, Circle, Line} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {Block} from '../lib';
import {BG, INK, MUTED, GOOD, SERIF, SANS, PAPER} from '../style';

export const STAGES = ['purpose', 'vision', 'brainstorm', 'organise', 'next action'];
export const SHEET = '#F8F3EA';      // the page: a little lighter than the background
export const EDGE = '#D8CBB4';

export const T = (text: string, size = 44, fill = INK, props: any = {}) =>
  new Txt({text, fontFamily: SERIF, fontSize: size, fill, opacity: 0, ...props});
export const S = (text: string, size = 24, fill = MUTED, props: any = {}) =>
  new Txt({text, fontFamily: SANS, fontSize: size, fill, opacity: 0, letterSpacing: 2, ...props});

export function* show(n: Node, d = 0.6) { yield* n.opacity(1, d); }

/** Me: a dark dot. */
export function me(x: number, y: number, label = 'ME') {
  const g = new Node({x, y});
  const c = new Circle({size: 34, fill: INK});
  g.add(c);
  if (label) g.add(S(label, 15, MUTED, {y: 42, opacity: 1}));
  return {g, c};
}

/** The AI: an open ring. */
export function ai(x: number, y: number, label = 'AI') {
  const g = new Node({x, y});
  const c = new Circle({size: 56, stroke: INK, lineWidth: 4, fill: BG});
  g.add(c);
  if (label) g.add(S(label, 15, MUTED, {y: 52, opacity: 1}));
  return {g, c};
}

/** The page. Five lines, drawn (end 1) or still to be drawn (end 0); `names` writes the stages instead. */
export function sheet(x = 0, y = 0, scale = 1, drawn = false, names = false) {
  const g = new Node({x, y, scale});
  g.add(new Rect({width: 300, height: 380, radius: 10, fill: SHEET, stroke: EDGE, lineWidth: 2,
    shadowColor: '#2B2A2822', shadowBlur: 24, shadowOffsetY: 8}));
  const len = [200, 168, 188, 150, 176];
  const ys = len.map((_, i) => -120 + i * 60);
  const lines = len.map((l, i) => new Line({points: [[-100, ys[i]], [-100 + l, ys[i]]], stroke: INK, lineWidth: 5,
    lineCap: 'round', end: drawn ? 1 : 0, opacity: names ? 0 : 1}));
  const labels = STAGES.map((s, i) => new Txt({text: s, fontFamily: SERIF, fontSize: 30, fill: i === 0 ? GOOD : INK,
    x: -104, y: ys[i], offset: [-1, 0], opacity: names ? 1 : 0}));
  lines.forEach(l => g.add(l));
  labels.forEach(l => g.add(l));
  return {g, lines, labels, ys};
}

/** The five stages as stations on a vertical rail, purpose on top. Everything visible. */
export function ladder(x: number, yTop = -200, gap = 95, size = 22, font = 28) {
  const g = new Node({x});
  const ys = STAGES.map((_, i) => yTop + i * gap);
  const rail = new Line({points: [[0, ys[0]], [0, ys[4]]], stroke: MUTED, lineWidth: 3, opacity: 0.5});
  g.add(rail);
  const under = new Node({});          // what rides on the rail passes under the stations
  g.add(under);
  const dots = ys.map((yy, i) => new Circle({size, y: yy, fill: BG, stroke: i === 0 ? GOOD : INK, lineWidth: 4}));
  const labels = STAGES.map((s, i) => new Txt({text: s, fontFamily: SERIF, fontSize: font, fill: INK, x: size / 2 + 18, y: ys[i], offset: [-1, 0]}));
  dots.forEach(d => g.add(d));
  labels.forEach(l => g.add(l));
  const dim = (idx: number[], o: number, d = 0.5) => all(...idx.map(i => all(dots[i].opacity(o, d), labels[i].opacity(o, d))));
  return {g, rail, under, dots, labels, ys, dim};
}

/** A card with a word on it. */
export function card(text: string, x: number, y: number, w = 220) {
  const g = new Rect({x, y, width: w, height: 58, radius: 12, fill: PAPER, stroke: INK, lineWidth: 0, opacity: 0});
  g.add(new Txt({text, fontFamily: SANS, fontSize: 22, fill: INK}));
  return g;
}

/** An option: a card with two lines of "text", and room for a pro and a con. */
export function option(x: number, y: number) {
  const g = new Rect({x, y, width: 230, height: 64, radius: 12, fill: PAPER, stroke: INK, lineWidth: 0, opacity: 0});
  g.add(new Line({points: [[-92, -10], [30, -10]], stroke: MUTED, lineWidth: 5, lineCap: 'round'}));
  g.add(new Line({points: [[-92, 10], [-6, 10]], stroke: MUTED, lineWidth: 5, lineCap: 'round'}));
  const pro = new Circle({size: 12, fill: GOOD, x: 70, opacity: 0});
  const con = new Circle({size: 12, fill: '#C8553D', x: 92, opacity: 0});
  g.add(pro); g.add(con);
  return {g, pro, con};
}

/** Unknown marker: show what should be here. */
export function* placeholder(root: Node, b: Block) {
  const box = new Rect({width: 1000, height: 420, radius: 24, fill: PAPER, opacity: 0});
  const tag = S('ANIMATION', 22, MUTED, {y: -110});
  const d = T(b.desc, 40, INK, {width: 860, textWrap: true, textAlign: 'center', y: 10});
  root.add(box); root.add(tag); root.add(d);
  yield* all(box.opacity(1, 0.5), tag.opacity(1, 0.5), d.opacity(1, 0.5));
}
