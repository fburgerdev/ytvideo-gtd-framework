// Headless render of src/render-list.json through the Motion Canvas editor.
// Usage: node render.mjs <out.mp4>      (called by edit/build.py)
// Uses the browser that is already installed (Edge on Windows, else Chrome); set BROWSER_CHANNEL to override.
import {spawn} from 'node:child_process';
import {chromium} from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2];
const port = 9200 + Math.floor(Math.random() * 700);
const outDir = path.resolve('output');
fs.rmSync(outDir, {recursive: true, force: true});

const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--port', String(port), '--strictPort'], {stdio: ['ignore', 'pipe', 'pipe']});
vite.stderr.on('data', d => process.stderr.write(d));
await new Promise(r => vite.stdout.on('data', d => { if (String(d).includes('Local')) r(); }));

const fail = e => { console.error(e); vite.kill(); process.exit(1); };
process.on('exit', () => vite.kill());
process.on('uncaughtException', fail);
process.on('unhandledRejection', fail);

const channel = process.env.BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : 'chrome');
const browser = await chromium.launch({channel, args: ['--no-proxy-server']});
const page = await browser.newPage({viewport: {width: 1600, height: 1000}, ignoreHTTPSErrors: true});
const errors = [];
page.on('console', m => { if (m.type() === 'error') { errors.push(m.text()); console.error('[page]', m.text()); } });
page.on('pageerror', e => { errors.push(e.message); console.error('[pageerror]', e.message); });
await page.goto(`http://localhost:${port}/`);
// the first start takes a while (vite prepares the dependencies); the render button lives in the "Video Settings" tab
const renderBtn = page.locator('button', {hasText: /^Render$/});
await page.locator('button[title="Video Settings"]').or(renderBtn).first().waitFor({timeout: 180000});
await page.waitForTimeout(3000);
if (!(await renderBtn.isVisible())) await page.locator('button[title="Video Settings"]').click();
await renderBtn.click();
const t0 = Date.now();
let done = false, lastNote = 0;
while (!done) {
  await page.waitForTimeout(3000);
  const files = fs.existsSync(outDir) ? fs.readdirSync(outDir).filter(f => f.endsWith('.mp4')) : [];
  const btn = await renderBtn.isVisible().catch(() => false);
  if (files.length && btn) done = true;
  const s = Math.round((Date.now() - t0) / 1000);
  if (s - lastNote >= 30) { lastNote = s; process.stdout.write(`  rendering... ${s}s\n`); }
  if (!files.length && btn && s > 60) throw new Error('the render stopped without a video' + (errors.length ? ': ' + errors[0] : ''));
  if (s > 3 * 3600) throw new Error('render timeout');
}
await page.waitForTimeout(2000);
const f = fs.readdirSync(outDir).find(f => f.endsWith('.mp4'));
fs.copyFileSync(path.join(outDir, f), out);
await browser.close();
vite.kill();
console.log('rendered', out);
process.exit(0);
