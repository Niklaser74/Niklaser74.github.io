// Dagens spel: one game a day, the same for everyone, every game in turn, and
// the day turns at midnight Swedish time. Every game in the rotation must have
// a card on the front page, and every playable card must be in the rotation.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GAMES, dayNumber, gameOfDay } from '../js/daily.js';

test('a week of days gives every game its turn, in order, no repeats in a row', () => {
  const start = new Date('2026-10-02T10:00:00Z');
  const days = Array.from({ length: GAMES.length }, (_, i) => gameOfDay(new Date(start.getTime() + i * 86400000)));
  assert.deepEqual([...days].sort(), [...GAMES].sort());
  for (let i = 1; i < days.length; i++) assert.notEqual(days[i], days[i - 1]);
});

test('the whole day has one game, and it changes at midnight in Stockholm', () => {
  // 2026-10-02 in Stockholm is UTC+2: it runs from 22:00Z the day before to 21:59Z
  const morning = gameOfDay(new Date('2026-10-01T22:00:30Z'));
  const evening = gameOfDay(new Date('2026-10-02T21:59:30Z'));
  const next = gameOfDay(new Date('2026-10-02T22:00:30Z'));
  assert.equal(morning, evening);
  assert.notEqual(evening, next);
  assert.equal(dayNumber(new Date('2026-10-02T21:59:30Z')) + 1, dayNumber(new Date('2026-10-02T22:00:30Z')));
});

test('winter time too: the day turns at 23:00Z in January', () => {
  assert.equal(gameOfDay(new Date('2027-01-15T00:30:00Z')), gameOfDay(new Date('2027-01-15T22:59:00Z')));
  assert.notEqual(gameOfDay(new Date('2027-01-15T22:59:00Z')), gameOfDay(new Date('2027-01-15T23:00:30Z')));
});

test('every game in the rotation has a playable card, and every playable card is in it', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const cards = [...html.matchAll(/<article class="card live" data-game="([a-z]+)"/g)].map((m) => m[1]);
  assert.deepEqual([...cards].sort(), [...GAMES].sort());
  for (const id of GAMES) assert.ok(html.includes(`href="/${id}/"`), `${id} has a play link`);
});
