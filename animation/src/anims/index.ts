// Which animation plays for which marker in the script. The key is the marker's text, slugged
// (see the shot list): rename a marker in the script and its key changes with it.
import {Node} from '@motion-canvas/2d';
import {Block} from '../lib';
import * as a from './part1';
import * as b from './part2';
import * as c from './part3';
export {placeholder} from './common';

type Anim = (root: Node, b: Block) => Generator<any, void, any>;

export const ANIMS: Record<string, Anim> = {
  'one-file': a.oneFile,
  'title': a.title,
  'card': a.chapter,
  'a-problem-in-options-out': a.optionsOut,
  'picking-feels-like-progress': a.picking,
  'don-t-jump-into-suggestions': a.dontJump,
  'five-lines-on-the-page': b.fiveLines,
  'we-start-in-the-middle': b.startInMiddle,
  'example-the-question': b.exQuestion,
  'example-purpose': b.exPurpose,
  'example-vision': b.exVision,
  'example-brainstorm-and-organise': b.exBrainOrg,
  'example-next-action': b.exNext,
  'the-file-between-us': b.theFile,
  'stuck-go-one-up': b.stuck,
  'a-goal-and-steps': c.goalSteps,
  'the-goal-fades': c.goalFades,
  'the-stages-hold-the-thread': c.thread,
  'the-ai-jumps-too': c.aiJumps,
  'the-supervisor': c.supervisor,
  'the-supervisor-on-a-page': c.pageSupervisor,
  'go-up-first': c.goUp,
  'thanks-for-watching': c.thanks,
};
