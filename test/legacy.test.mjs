// Which requests to the hub are really old game links, and where they go.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const ctx = { URLSearchParams };
vm.createContext(ctx);
vm.runInContext(readFileSync(new URL('../js/legacy.js', import.meta.url), 'utf8'), ctx);
const target = (search, hash = '', { nav = {}, matchMedia = null, referrer = '' } = {}) =>
  ctx.legacyTarget({ search, hash }, nav, matchMedia, referrer);

test('the hub itself is left alone', () => {
  assert.equal(target(''), null);
  assert.equal(target('?lang=en'), null);
  assert.equal(target('?utm_source=newsletter&utm_medium=mail'), null);
  assert.equal(target('', '#games'), null);
});

test('old game links at the root go to the game with query and hash intact', () => {
  const cases = [
    ['?match=abc123', '', '/snailmageddon/?match=abc123'],
    ['?daily=1', '', '/snailmageddon/?daily=1'],
    ['?day=2026-09-01', '', '/snailmageddon/?day=2026-09-01'],
    ['?seed=42', '', '/snailmageddon/?seed=42'],
    ['?bought=gold', '', '/snailmageddon/?bought=gold'],
    ['?cancelled=tophat', '', '/snailmageddon/?cancelled=tophat'],
    ['?twa=1', '', '/snailmageddon/?twa=1'],
    ['?platform=poki', '', '/snailmageddon/?platform=poki'],
    ['?noanalytics', '', '/snailmageddon/?noanalytics'],
    ['?token_hash=abc&type=magiclink', '', '/snailmageddon/?token_hash=abc&type=magiclink'],
    ['?error=access_denied&error_code=identity_already_exists&error_description=x', '', '/snailmageddon/?error=access_denied&error_code=identity_already_exists&error_description=x'],
    ['', '#access_token=a.b.c&refresh_token=r&type=magiclink', '/snailmageddon/#access_token=a.b.c&refresh_token=r&type=magiclink'],
    ['', '#error=server_error&error_code=500', '/snailmageddon/#error=server_error&error_code=500'],
    ['?lang=en&match=abc', '', '/snailmageddon/?lang=en&match=abc'],
  ];
  for (const [search, hash, expected] of cases) assert.equal(target(search, hash), expected, `${search}${hash}`);
});

test('an installed copy of the old game opens the game', () => {
  const standalone = (q) => ({ matches: q === '(display-mode: standalone)' });
  const browser = () => ({ matches: false });
  assert.equal(target('', '', { matchMedia: standalone }), '/snailmageddon/');
  assert.equal(target('', '', { matchMedia: browser }), null);
  assert.equal(target('', '', { nav: { standalone: true } }), '/snailmageddon/');
  assert.equal(target('', '', { referrer: 'android-app://se.snails.app' }), '/snailmageddon/');
  assert.equal(target('', '', { referrer: 'https://example.com/' }), null);
});

test('a broken matchMedia never breaks the hub', () => {
  const throwing = () => { throw new Error('nope'); };
  assert.equal(target('', '', { matchMedia: throwing }), null);
});
