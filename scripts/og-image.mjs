#!/usr/bin/env node
// Renders img/og-1200x630.png from the live hero: start the static server,
// open the page in Chromium at 1200×630, screenshot the header.
//   npx playwright install chromium   (once)
//   npm run og:image
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = 8099;
const server = spawn(process.execPath, [join(root, 'scripts', 'serve.mjs')], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
try {
  await new Promise((r) => setTimeout(r, 600));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await page.goto(`http://localhost:${port}/?lang=sv`, { waitUntil: 'networkidle' });
  await page.addStyleTag({ content: '.hero { height: 630px !important; min-height: 630px !important; } .topnav { display: none !important; }' });
  await page.waitForTimeout(400);
  await page.locator('header.hero').screenshot({ path: join(root, 'img', 'og-1200x630.png') });
  await browser.close();
  console.log('wrote img/og-1200x630.png');
} finally {
  server.kill();
}
