import {makeProject} from '@motion-canvas/core';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import timeline from './scenes/timeline?scene';

// make sure the fonts are there before the first frame is drawn
await Promise.all([
  document.fonts.load('400 40px Fraunces'),
  document.fonts.load('600 40px Fraunces'),
  document.fonts.load('400 40px Inter'),
  document.fonts.load('600 40px Inter'),
]);

export default makeProject({
  scenes: [timeline],
});
