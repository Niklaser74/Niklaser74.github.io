// The hub owns the root of snails.se and links with root-absolute paths. Every
// such path must exist in this repo, or point into a project site that lives
// under the same domain. Also pins the two contracts the hub has with the game.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(root, f), 'utf8');
const pages = ['index.html', '404.html', 'privacy.html', 'account/index.html'];
const styles = readdirSync(join(root, 'css')).map((f) => `css/${f}`);
const OTHER_SITES = ['/snailmageddon/', '/snailchess/', '/snailrake/', '/snailman/', '/snailstory/', '/snailrow/', '/tipspromenaden/'];

function refs(text) {
  const out = [];
  for (const m of text.matchAll(/(?:href|src)="(\/[^"#?]*)/g)) out.push(m[1]);
  for (const m of text.matchAll(/url\((["']?)(\/[^)"']*)\1\)/g)) out.push(m[2]);
  for (const m of text.matchAll(/content="https:\/\/snails\.se(\/[^"#?]*)/g)) out.push(m[1]);
  return out;
}

test('every root-absolute path resolves to a file here or to another site under snails.se', () => {
  const missing = [];
  for (const f of [...pages, ...styles]) {
    for (const p of refs(read(f))) {
      if (p === '/' || OTHER_SITES.some((s) => p.startsWith(s))) continue;
      const file = join(root, p);
      const ok = existsSync(file) && (statSync(file).isFile() || existsSync(join(file, 'index.html'))); // a directory counts when it has an index
      if (!ok) missing.push(`${f}: ${p}`);
    }
  }
  assert.deepEqual(missing, [], 'missing targets');
});

test('the hub has no web app manifest (the game keeps id "/")', () => {
  for (const f of pages) assert.doesNotMatch(read(f), /rel="manifest"/, f);
});

test('the root service worker is a kill-switch: no fetch, push or notification handlers, no caching', () => {
  const sw = read('sw.js');
  assert.doesNotMatch(sw, /addEventListener\(['"](fetch|push|notificationclick)['"]/);
  assert.doesNotMatch(sw, /\.addAll\(|\.put\(/);
  assert.match(sw, /registration\.unregister\(\)/);
  assert.match(sw, /startsWith\('snackmageddon-'\)/);
});

test('sitemap only lists pages that exist or live under a game', () => {
  for (const m of read('sitemap.xml').matchAll(/<loc>https:\/\/snails\.se(\/[^<]*)<\/loc>/g)) {
    const p = m[1];
    if (p === '/' || OTHER_SITES.some((g) => p.startsWith(g))) continue;
    assert.ok(existsSync(join(root, p)), `sitemap: ${p}`);
  }
});
